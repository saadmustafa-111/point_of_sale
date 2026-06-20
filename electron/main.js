'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const https = require('https');

const isDev = process.env.NODE_ENV === 'development';
const RENDERER_URL = 'http://localhost:5173';
const RENDERER_BUILD = isDev
  ? path.join(__dirname, '../apps/renderer/dist/index.html')
  : path.join(process.resourcesPath, 'renderer', 'dist', 'index.html');
const BACKEND_PORT = 3000;
const DEFAULT_SERVER_HOSTNAME = 'SHOP-SERVER';
const DEFAULT_API_URL = `http://${DEFAULT_SERVER_HOSTNAME}:${BACKEND_PORT}/api/v1`;

let mainWindow;
let backendProcess = null;
let freshDatabaseCreated = false;

// ── Database path setup ───────────────────────────────────────────────────────
function getDbPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'pos.db');
}

function getDatabaseUrl(dbPath = getDbPath()) {
  return `file:${dbPath.replace(/\\/g, '/')}`;
}

function getConfigPath() {
  return path.join(app.getPath('userData'), 'pos-config.json');
}

function normalizeApiUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

function readConfig() {
  try {
    const file = getConfigPath();
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.warn('[Config] Failed to read config:', err.message);
    return {};
  }
}

function writeConfig(nextConfig) {
  const config = {
    ...readConfig(),
    ...nextConfig,
  };
  if (config.apiUrl) config.apiUrl = normalizeApiUrl(config.apiUrl);
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  return config;
}

function getPrinterSettings() {
  const config = readConfig();
  return {
    defaultPrinter: config.defaultPrinter || '',
    silentPrint: config.silentPrint === true,
    autoPrint: config.autoPrint === true,
  };
}

function writePrinterSettings(settings) {
  const next = {
    defaultPrinter: settings?.defaultPrinter || '',
    silentPrint: settings?.silentPrint === true,
    autoPrint: settings?.autoPrint === true,
  };
  return writeConfig(next);
}

function normalizePrintPayload(payload) {
  if (typeof payload === 'string') {
    return {
      html: payload,
      printerName: undefined,
      silent: undefined,
      width: undefined,
      copies: 1,
    };
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Print payload must be an object with an html string');
  }

  const nestedOptions = payload.options && typeof payload.options === 'object' ? payload.options : {};
  const html = payload.html ?? payload.htmlContent;
  const printerName = payload.printerName ?? payload.deviceName ?? nestedOptions.printerName ?? nestedOptions.deviceName;
  const silent = payload.silent ?? nestedOptions.silent;
  const width = payload.width ?? nestedOptions.width;
  const copies = payload.copies ?? nestedOptions.copies ?? 1;

  if (typeof html !== 'string' || html.trim().length === 0) {
    throw new TypeError('Print payload html must be a non-empty string');
  }
  if (printerName !== undefined && typeof printerName !== 'string') {
    throw new TypeError('Print payload printerName must be a string when provided');
  }
  if (silent !== undefined && typeof silent !== 'boolean') {
    throw new TypeError('Print payload silent must be a boolean when provided');
  }
  if (width !== undefined && !['58mm', '80mm', 'a4'].includes(width)) {
    throw new TypeError('Print payload width must be 58mm, 80mm, or a4');
  }

  const parsedCopies = Number(copies);
  return {
    html,
    printerName,
    silent,
    width,
    copies: Number.isInteger(parsedCopies) && parsedCopies > 0 ? parsedCopies : 1,
  };
}

function generateTestPrintHTML(width = '80mm') {
  const paper = ['58mm', '80mm', 'a4'].includes(width) ? width : '80mm';
  if (paper === 'a4') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Printer Test</title>
      <style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#111}.box{border:1px solid #111;padding:24px}</style>
      </head><body><div class="box"><h1>POS Printer Test</h1><p>If this page prints, A4 printing is configured correctly.</p><p>${new Date().toLocaleString()}</p></div></body></html>`;
  }

  const bodyWidth = paper === '58mm' ? 219 : 302;
  const fontSize = paper === '58mm' ? '10px' : '11px';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Printer Test</title>
    <style>@page{size:${paper} auto;margin:0}body{width:${paper};font-family:'Courier New',monospace;font-size:${fontSize};padding:${paper === '58mm' ? '2mm' : '4mm'};color:#000}.line{border-top:1px dashed #000;margin:8px 0}</style>
    </head><body><div style="width:${bodyWidth}px"><div style="text-align:center;font-weight:bold">POS PRINTER TEST</div><div class="line"></div><div>Paper: ${paper}</div><div>Date: ${new Date().toLocaleString()}</div><div class="line"></div><div>Item A x1 <span style="float:right">Rs.100</span></div><div>Item B x2 <span style="float:right">Rs.200</span></div><div class="line"></div><div style="font-weight:bold">TOTAL <span style="float:right">Rs.300</span></div><div class="line"></div><div style="text-align:center">Print OK</div></div></body></html>`;
}

async function printHtmlPayload(rawPayload) {
  let payload;
  try {
    payload = normalizePrintPayload(rawPayload);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const printerSettings = getPrinterSettings();
  const printerName = payload.printerName || printerSettings.defaultPrinter || undefined;
  const silent = payload.silent ?? printerSettings.silentPrint;

  let printWin;
  try {
    printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true },
    });

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`;
    await printWin.loadURL(dataUrl);

    return await new Promise((resolve) => {
      printWin.webContents.print({
        silent,
        deviceName: printerName,
        printBackground: true,
        copies: payload.copies,
        margins: { marginType: 'none' },
      }, (success, failureReason) => {
        if (success) resolve({ success: true });
        else resolve({ success: false, error: failureReason || 'Print failed' });
      });
    });
  } catch (err) {
    console.error('[Print] Failed:', err);
    return { success: false, error: err.message || 'Print failed' };
  } finally {
    if (printWin && !printWin.isDestroyed()) printWin.close();
  }
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const values of Object.values(interfaces)) {
    for (const item of values || []) {
      if (item.family === 'IPv4' && !item.internal) {
        addresses.push(item.address);
      }
    }
  }
  return addresses;
}

function getServerInfo() {
  const hostname = os.hostname();
  const lanIps = getLanAddresses();
  const lanUrls = lanIps.map((ip) => `http://${ip}:${BACKEND_PORT}/api/v1`);
  return {
    hostname,
    defaultHostname: DEFAULT_SERVER_HOSTNAME,
    port: BACKEND_PORT,
    hostnameUrl: `http://${hostname}:${BACKEND_PORT}/api/v1`,
    shopServerUrl: DEFAULT_API_URL,
    lanIps,
    lanUrls,
  };
}

function ensureDatabase() {
  const dbDest = getDbPath();
  const created = !fs.existsSync(dbDest);

  fs.mkdirSync(path.dirname(dbDest), { recursive: true });

  if (created) {
    fs.closeSync(fs.openSync(dbDest, 'a'));
    console.log('[DB] Created empty production database at', dbDest);
  }

  if (!isDev) {
    runPrismaMigrations(dbDest);
  }

  return created;
}

function runPrismaMigrations(dbPath) {
  const backendDir = path.join(process.resourcesPath, 'backend');
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  const prismaCli = path.join(backendDir, 'node_modules', 'prisma', 'build', 'index.js');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}`);
  }

  if (!fs.existsSync(prismaCli)) {
    throw new Error(`Prisma CLI not found at ${prismaCli}`);
  }

  console.log('[DB] Running Prisma migrations for', dbPath);
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schemaPath], {
    cwd: backendDir,
    env: {
      ...process.env,
      DATABASE_URL: getDatabaseUrl(dbPath),
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
    encoding: 'utf-8',
  });

  if (result.stdout) console.log('[DB]', result.stdout.trim());
  if (result.stderr) console.error('[DB ERR]', result.stderr.trim());

  if (result.status !== 0) {
    throw new Error(`Prisma migrations failed with exit code ${result.status}`);
  }
}

// ── Start NestJS backend ──────────────────────────────────────────────────────
function startBackend() {
  if (backendProcess) return;
  if (isDev) return;

  const backendDir = path.join(process.resourcesPath, 'backend');
  const dbPath = getDbPath();

  const env = {
    ...process.env,
    DATABASE_URL: getDatabaseUrl(dbPath),
    JWT_SECRET: 'pos_super_secret_2026_change_me',
    PORT: String(BACKEND_PORT),
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1',
    POS_FRESH_DB: freshDatabaseCreated ? '1' : '0',
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

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// ── Wait for backend to accept connections ────────────────────────────────────
function waitForBackend(retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`http://localhost:${BACKEND_PORT}/api/v1/health`, () => {
        resolve();
      }).on('error', () => {
        if (n <= 0) return reject(new Error('Backend did not start in time'));
        setTimeout(() => attempt(n - 1), 500);
      });
    };
    attempt(retries);
  });
}

function testConnection(apiUrl) {
  const base = normalizeApiUrl(apiUrl);
  if (!base) return Promise.resolve({ ok: false, error: 'API URL is required' });

  return new Promise((resolve) => {
    let healthUrl;
    try {
      healthUrl = new URL(`${base}/health`);
    } catch (_) {
      resolve({ ok: false, error: 'Invalid API URL' });
      return;
    }

    const client = healthUrl.protocol === 'https:' ? https : http;
    const req = client.get(healthUrl, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ ok: true, status: res.statusCode, data: JSON.parse(body) });
          } catch (_) {
            resolve({ ok: true, status: res.statusCode });
          }
        } else {
          resolve({ ok: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Connection timed out' });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
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
  const config = readConfig();
  const appMode = config.appMode;

  if (appMode === 'server') {
    freshDatabaseCreated = ensureDatabase();
    startBackend();
    if (!config.apiUrl) {
      writeConfig({ apiUrl: `http://localhost:${BACKEND_PORT}/api/v1` });
    }
  }

  if (!isDev && appMode === 'server') {
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
ipcMain.handle('get-api-url', () => {
  const config = readConfig();
  return config.apiUrl || null;
});

ipcMain.handle('set-api-url', (_, apiUrl) => {
  const config = writeConfig({ apiUrl: normalizeApiUrl(apiUrl) });
  return config.apiUrl;
});

ipcMain.handle('get-app-mode', () => readConfig().appMode || null);
ipcMain.handle('set-app-mode', async (_, appMode) => {
  if (!['server', 'client'].includes(appMode)) {
    throw new Error('Invalid app mode');
  }

  const nextConfig = { appMode };
  if (appMode === 'server') {
    nextConfig.apiUrl = `http://localhost:${BACKEND_PORT}/api/v1`;
  } else if (!readConfig().apiUrl) {
    nextConfig.apiUrl = DEFAULT_API_URL;
  }

  const config = writeConfig(nextConfig);

  if (appMode === 'server') {
    freshDatabaseCreated = ensureDatabase();
    startBackend();
    if (!isDev) await waitForBackend();
  } else {
    stopBackend();
  }

  return config.appMode;
});

ipcMain.handle('get-server-info', () => getServerInfo());
ipcMain.handle('test-connection', (_, apiUrl) => testConnection(apiUrl || readConfig().apiUrl || DEFAULT_API_URL));

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('get-printer-settings', () => getPrinterSettings());

ipcMain.handle('set-printer-settings', (_, settings) => {
  const config = writePrinterSettings(settings);
  return {
    defaultPrinter: config.defaultPrinter || '',
    silentPrint: config.silentPrint === true,
    autoPrint: config.autoPrint === true,
  };
});

ipcMain.handle('print-receipt', async (_, payload) => printHtmlPayload(payload));

ipcMain.handle('print-test-page', async (_, payload = {}) => {
  const width = payload?.width || '80mm';
  return printHtmlPayload({
    html: generateTestPrintHTML(width),
    printerName: payload?.printerName,
    silent: payload?.silent,
    width,
    copies: payload?.copies,
  });
});
