// Electron main process for GI chess-T1 (Windows 7 compatible build).
// Electron 22.x is the last major version with official Windows 7 SP1 support.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 680,
    minWidth: 600,
    minHeight: 500,
    frame: false,                 // frameless — matches Tauri decorations:false
    resizable: true,
    center: true,
    title: 'GI chess-T1',
    backgroundColor: '#e8e8e8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  // Uncomment for debugging:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC handlers -------------------------------------------------------

ipcMain.handle('win:minimize', () => { mainWindow && mainWindow.minimize(); });
ipcMain.handle('win:close', () => { mainWindow && mainWindow.close(); });
ipcMain.handle('win:set-always-on-top', (_e, on) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(!!on);
});

// Save a screenshot. Folder is a plain name; we save to the user's Pictures
// directory under that folder (or directly to Pictures if folder is null).
ipcMain.handle('fs:save-screenshot', async (_e, { folder, filename, data }) => {
  try {
    const picturesDir = app.getPath('pictures');
    const targetDir = folder ? path.join(picturesDir, folder) : picturesDir;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const outPath = path.join(targetDir, filename);
    fs.writeFileSync(outPath, Buffer.from(data));
    return { ok: true, path: outPath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('app:open-readme', async () => {
  try {
    const readmePath = process.resourcesPath
      ? path.join(process.resourcesPath, 'README.pdf')
      : path.join(__dirname, '..', '..', 'dist-installer', 'README.pdf');
    if (fs.existsSync(readmePath)) {
      await shell.openPath(readmePath);
      return { ok: true };
    }
    return { ok: false, error: 'README.pdf not found' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});
