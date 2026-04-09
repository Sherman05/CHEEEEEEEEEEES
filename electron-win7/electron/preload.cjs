// Preload script — exposes a minimal, typed API to the renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('win:minimize'),
  close: () => ipcRenderer.invoke('win:close'),
  setAlwaysOnTop: (on) => ipcRenderer.invoke('win:set-always-on-top', on),
  saveScreenshot: (folder, filename, data) =>
    ipcRenderer.invoke('fs:save-screenshot', {
      folder,
      filename,
      data: Array.from(new Uint8Array(data)),
    }),
  openReadme: () => ipcRenderer.invoke('app:open-readme'),
});
