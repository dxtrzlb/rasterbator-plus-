// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  exportPDF: (dataUrl, options) => ipcRenderer.invoke('export:pdf', dataUrl, options)
});
