'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a safe, typed API to the renderer process via window.electron.
 * Never expose raw ipcRenderer to the renderer — keep this minimal.
 */
contextBridge.exposeInMainWorld('electron', {
  /** Fetch the backend API base URL stored in the main process */
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),

  /** Send HTML string to native print dialog */
  printReceipt: (htmlContent) => ipcRenderer.invoke('print-receipt', htmlContent),

  /** Platform info */
  platform: process.platform,
});
