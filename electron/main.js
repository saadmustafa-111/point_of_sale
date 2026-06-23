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
let backendStartPromise = null;
let freshDatabaseCreated = false;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function errorPage(title, message) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${safeTitle}</title>
    <style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f1f5f9;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center}.box{max-width:720px;background:white;border:1px solid #cbd5e1;border-radius:12px;padding:28px;box-shadow:0 12px 40px rgba(15,23,42,.12)}h1{margin:0 0 12px;font-size:22px}pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;color:#334155}</style>
    </head><body><div class="box"><h1>${safeTitle}</h1><pre>${safeMessage}</pre></div></body></html>`;
}

function showRendererError(title, err) {
  const message = err?.message || String(err || 'Unknown renderer load error');
  console.error(`[Renderer] ${title}:`, message);
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorPage(title, message))}`).catch(() => undefined);
  if (!mainWindow.isVisible()) mainWindow.show();
}

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

function getBundledBackendDir() {
  return path.join(process.resourcesPath, 'backend');
}

function resolvePrismaSchemaEngine(backendDir) {
  const enginesDir = path.join(backendDir, 'node_modules', '@prisma', 'engines');
  const candidates = [];

  if (process.platform === 'darwin') {
    candidates.push(
      process.arch === 'arm64' ? 'schema-engine-darwin-arm64' : 'schema-engine-darwin',
      'schema-engine-darwin-arm64',
      'schema-engine-darwin',
    );
  } else if (process.platform === 'win32') {
    candidates.push('schema-engine-windows.exe', 'schema-engine-windows');
  } else {
    throw new Error(`Unsupported platform for Prisma migrations: ${process.platform}`);
  }

  for (const name of [...new Set(candidates)]) {
    const fullPath = path.join(enginesDir, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  throw new Error(
    `Prisma schema engine not found in ${enginesDir} for ${process.platform}/${process.arch}`,
  );
}

function resolvePrismaQueryEngine(backendDir) {
  const names = [];

  if (process.platform === 'darwin') {
    names.push(
      process.arch === 'arm64' ? 'libquery_engine-darwin-arm64.dylib.node' : 'libquery_engine-darwin.dylib.node',
      'libquery_engine-darwin-arm64.dylib.node',
      'libquery_engine-darwin.dylib.node',
    );
  } else if (process.platform === 'win32') {
    names.push('query_engine-windows.dll.node', 'libquery_engine-windows.dll.node');
  } else {
    throw new Error(`Unsupported platform for Prisma query engine: ${process.platform}`);
  }

  const dirs = [
    path.join(backendDir, 'node_modules', '.prisma', 'client'),
    path.join(backendDir, 'node_modules', '@prisma', 'engines'),
    path.join(backendDir, 'node_modules', 'prisma'),
  ];

  for (const name of [...new Set(names)]) {
    for (const dir of dirs) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) return fullPath;
    }
  }

  throw new Error(
    `Prisma query engine not found for ${process.platform}/${process.arch} in bundled backend`,
  );
}

function getPrismaRuntimeEnv(backendDir) {
  const schemaEngine = resolvePrismaSchemaEngine(backendDir);
  const queryEngine = resolvePrismaQueryEngine(backendDir);

  return {
    PRISMA_SCHEMA_ENGINE_BINARY: schemaEngine,
    PRISMA_QUERY_ENGINE_LIBRARY: queryEngine,
  };
}

function ensureDatabase() {
  const dbDest = getDbPath();
  const created = !fs.existsSync(dbDest);

  fs.mkdirSync(path.dirname(dbDest), { recursive: true });

  if (!isDev) {
    runPrismaMigrations(dbDest);
  }

  return created;
}

function runPrismaMigrations(dbPath) {
  const backendDir = getBundledBackendDir();
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  const prismaCli = path.join(backendDir, 'node_modules', 'prisma', 'build', 'index.js');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}`);
  }

  if (!fs.existsSync(prismaCli)) {
    throw new Error(`Prisma CLI not found at ${prismaCli}`);
  }

  const prismaEngines = getPrismaRuntimeEnv(backendDir);

  console.log('[DB] Running Prisma migrations for', dbPath);
  console.log('[DB] Using schema engine', prismaEngines.PRISMA_SCHEMA_ENGINE_BINARY);
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schemaPath], {
    cwd: backendDir,
    env: {
      ...process.env,
      ...prismaEngines,
      DATABASE_URL: getDatabaseUrl(dbPath),
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
    encoding: 'utf-8',
  });

  if (result.stdout) console.log('[DB]', result.stdout.trim());
  if (result.stderr) console.error('[DB ERR]', result.stderr.trim());

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    throw new Error(
      details ? `Prisma migrations failed: ${details}` : `Prisma migrations failed with exit code ${result.status}`,
    );
  }
}

// ── Start NestJS backend ──────────────────────────────────────────────────────
function startBackend() {
  if (backendProcess) return backendProcess;
  if (isDev) return null;

  const backendDir = getBundledBackendDir();
  const dbPath = getDbPath();

  const env = {
    ...process.env,
    ...getPrismaRuntimeEnv(backendDir),
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
  backendProcess.on('exit', (code) => {
    console.log('[Backend] Exited with code', code);
    backendProcess = null;
    backendStartPromise = null;
  });
  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err);
    backendProcess = null;
    backendStartPromise = null;
  });

  return backendProcess;
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  backendStartPromise = null;
}

// ── Wait for backend to accept connections ────────────────────────────────────
function waitForBackend({ retries = 90, intervalMs = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    let lastError = null;
    const attempt = (n) => {
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/v1/health`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
          return;
        }
        lastError = new Error(`Backend health returned HTTP ${res.statusCode}`);
        if (n <= 0) return reject(lastError);
        setTimeout(() => attempt(n - 1), intervalMs);
      });
      req.setTimeout(5000, () => {
        req.destroy(new Error('Backend health check timed out'));
      });
      req.on('error', (err) => {
        lastError = err;
        if (n <= 0) {
          const message = lastError?.message ? `Backend did not start in time: ${lastError.message}` : 'Backend did not start in time';
          return reject(new Error(message));
        }
        setTimeout(() => attempt(n - 1), intervalMs);
      });
    };
    attempt(retries);
  });
}

async function ensureBackendReady() {
  if (isDev) {
    return { ok: true };
  }

  if (backendStartPromise) return backendStartPromise;

  backendStartPromise = (async () => {
    try {
      await waitForBackend({ retries: 2, intervalMs: 250 });
      return { ok: true };
    } catch (_) {
      // The backend is not already listening, so start the bundled runtime.
    }

    try {
      freshDatabaseCreated = ensureDatabase();
      startBackend();
      await waitForBackend();
      return { ok: true };
    } catch (err) {
      const message = err?.message || 'Backend did not start in time';
      console.error('[Backend] Readiness failed:', message);
      return { ok: false, error: message };
    } finally {
      backendStartPromise = null;
    }
  })();

  return backendStartPromise;
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

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`[Renderer console:${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    showRendererError('Renderer process crashed', new Error(details.reason || 'Renderer process exited'));
  });
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    showRendererError('Renderer failed to load', new Error(`${errorDescription} (${errorCode})\n${validatedURL}`));
  });

  if (isDev) {
    mainWindow.loadURL(RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    if (!fs.existsSync(RENDERER_BUILD)) {
      showRendererError('Renderer build not found', new Error(RENDERER_BUILD));
    } else {
      mainWindow.loadFile(RENDERER_BUILD).catch((err) => showRendererError('Renderer failed to load', err));
    }
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
    if (!config.apiUrl) {
      writeConfig({ apiUrl: `http://localhost:${BACKEND_PORT}/api/v1` });
    }
    ensureBackendReady().then((result) => {
      if (result.ok) {
        console.log('[App] Backend ready');
      } else {
        console.error('[App] Backend failed to start:', result.error);
      }
    });
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
    const backend = await ensureBackendReady();
    return {
      mode: config.appMode,
      apiUrl: config.apiUrl,
      backendReady: backend.ok,
      error: backend.error,
    };
  } else {
    stopBackend();
  }

  return {
    mode: config.appMode,
    apiUrl: config.apiUrl,
    backendReady: true,
  };
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
