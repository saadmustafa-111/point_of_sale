'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
const RENDERER_URL = 'http://localhost:5173';
const RENDERER_BUILD = path.join(__dirname, '../apps/renderer/dist/index.html');
const BACKEND_PORT = 3000;

let mainWindow;
let backendProcess = null;

// ── Database path setup ───────────────────────────────────────────────────────
function getDbPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'pos.db');
}

function ensureDatabase() {
  const dbDest = getDbPath();
  if (!fs.existsSync(dbDest)) {
    const seed = isDev
      ? path.join(__dirname, '../apps/backend/prisma/pos.db')
      : path.join(process.resourcesPath, 'pos.db');
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, dbDest);
      console.log('[DB] Copied seed database to', dbDest);
    } else {
      console.warn('[DB] No seed DB found at', seed);
    }
  }
}

// ── Start NestJS backend ──────────────────────────────────────────────────────
function startBackend() {
  if (isDev) return;

  const backendDir = path.join(process.resourcesPath, 'backend');
  const dbPath = getDbPath();

  const env = {
    ...process.env,
    DATABASE_URL: `file:${dbPath}`,
    JWT_SECRET: 'pos_super_secret_2026_change_me',
    PORT: String(BACKEND_PORT),
    NODE_ENV: 'production',
  };

  console.log('[Backend] Starting from', backendDir);
  backendProcess = spawn(process.execPath, ['dist/main.js'], {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (d) => console.log('[Backend]', d.toString().trim()));
  backendProcess.stderr.on('data', (d) => console.error('[Backend ERR]', d.toString().trim()));
  backendProcess.on('exit', (code) => console.log('[Backend] Exited with code', code));
  backendProcess.on('error', (err) => console.error('[Backend] Failed to start:', err));
}

// ── Wait for backend to accept connections ────────────────────────────────────
function waitForBackend(retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`http://localhost:${BACKEND_PORT}/api/v1`, () => {
        resolve();
      }).on('error', () => {
        if (n <= 0) return reject(new Error('Backend did not start in time'));
        setTimeout(() => attempt(n - 1), 500);
      });
    };
    attempt(retries);
  });
}

// ── Create Electron window ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    frame: true,
    show: false,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(RENDERER_BUILD);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  ensureDatabase();
  startBackend();

  if (!isDev) {
    try {
      await waitForBackend();
      console.log('[App] Backend ready');
    } catch (e) {
      console.error('[App] Backend failed to start:', e.message);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) { backendProcess.kill(); backendProcess = null; }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) { backendProcess.kill(); backendProcess = null; }
});

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-api-url', () => `http://localhost:${BACKEND_PORT}`);

ipcMain.handle('print-receipt', async (_, htmlContent) => {
  // Write to a temp file to avoid data URL length limits
  const tmpFile = path.join(os.tmpdir(), `pos-invoice-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, htmlContent, 'utf-8');

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true },
  });

  await printWin.loadURL(`file://${tmpFile}`);

  return new Promise((resolve) => {
    printWin.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
      printWin.close();
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve({ success, reason });
    });
  });
});
