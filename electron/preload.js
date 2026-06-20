'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function normalizePrintPayload(payloadOrHtml, options = {}) {
  if (typeof payloadOrHtml === 'string') {
    return {
      html: payloadOrHtml,
      printerName: options.printerName || options.deviceName,
      silent: options.silent,
      width: options.width,
      copies: options.copies,
    };
  }
  return payloadOrHtml;
}

const electronAPI = {
  /** Fetch the backend API base URL stored in the main process */
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  setApiUrl: (apiUrl) => ipcRenderer.invoke('set-api-url', apiUrl),
  getAppMode: () => ipcRenderer.invoke('get-app-mode'),
  setAppMode: (mode) => ipcRenderer.invoke('set-app-mode', mode),
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  testConnection: (apiUrl) => ipcRenderer.invoke('test-connection', apiUrl),

  /** Send HTML string to native print dialog */
  printReceipt: (payloadOrHtml, options) => ipcRenderer.invoke('print-receipt', normalizePrintPayload(payloadOrHtml, options)),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getPrinterSettings: () => ipcRenderer.invoke('get-printer-settings'),
  setPrinterSettings: (settings) => ipcRenderer.invoke('set-printer-settings', settings),
  printTestPage: (payload) => ipcRenderer.invoke('print-test-page', payload),

  /** Platform info */
  platform: process.platform,
};

/**
 * Expose safe, typed APIs to the renderer process.
 * Keep window.electron for backwards compatibility with existing renderer code.
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('electron', electronAPI);
