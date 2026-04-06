use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_folder_on_desktop(name: String) -> Result<String, String> {
    let desktop = dirs::desktop_dir().ok_or("Cannot find Desktop directory")?;
    let folder_path = desktop.join(&name);
    fs::create_dir_all(&folder_path).map_err(|e| format!("Failed to create folder: {}", e))?;
    Ok(folder_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_pictures_dir() -> Result<String, String> {
    let pictures = dirs::picture_dir().ok_or("Cannot find Pictures directory")?;
    Ok(pictures.to_string_lossy().to_string())
}

#[tauri::command]
fn save_screenshot(folder: Option<String>, filename: String, data: Vec<u8>) -> Result<String, String> {
    // If party folder exists, save there (on Desktop)
    let save_dir = if let Some(ref f) = folder {
        let desktop = dirs::desktop_dir().ok_or("Cannot find Desktop directory")?;
        let dir = desktop.join(f);
        // Ensure folder exists
        fs::create_dir_all(&dir).map_err(|e| format!("mkdir failed: {}", e))?;
        dir
    } else {
        // Fallback: Pictures directory
        dirs::picture_dir().ok_or("Cannot find Pictures directory")?
    };

    let file_path = save_dir.join(&filename);

    // If file exists, add suffix
    let final_path = if file_path.exists() {
        let stem = file_path.file_stem().unwrap_or_default().to_string_lossy().to_string();
        let ext = file_path.extension().unwrap_or_default().to_string_lossy().to_string();
        let mut i = 1;
        loop {
            let candidate = save_dir.join(format!("{} ({}).{}", stem, i, ext));
            if !candidate.exists() {
                break candidate;
            }
            i += 1;
        }
    } else {
        file_path
    };

    fs::write(&final_path, &data).map_err(|e| format!("Write failed: {}", e))?;
    Ok(final_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_folder_on_desktop,
            get_pictures_dir,
            save_screenshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
