// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, create_folder_on_desktop, get_pictures_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
