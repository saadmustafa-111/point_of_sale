import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';

const rootDir = process.cwd();
const backendDir = join(rootDir, 'apps', 'backend');
const runtimeDir = join(rootDir, 'release', 'backend-runtime');
const homeDir = join(rootDir, 'release', '.home');
const prismaCacheDir = join(rootDir, 'release', '.prisma-cache');

function runtimeEnv() {
  return {
    ...process.env,
    CHECKPOINT_DISABLE: '1',
    CI: '1',
    HOME: homeDir,
    NO_COLOR: '1',
    PRISMA_CLI_BINARY_TARGETS: process.env.PRISMA_CLI_BINARY_TARGETS || 'darwin,darwin-arm64,windows',
    PRISMA_ENGINES_CACHE_DIR: prismaCacheDir,
    PRISMA_HIDE_UPDATE_MESSAGE: '1',
    XDG_CACHE_HOME: join(rootDir, 'release', '.cache'),
  };
}

function run(command, args, options = {}) {
  console.log(`[backend-runtime] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: runtimeEnv(),
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function hasGeneratedPrismaClient() {
  return (
    existsSync(join(runtimeDir, 'node_modules', '@prisma', 'client')) &&
    existsSync(join(runtimeDir, 'node_modules', '.prisma', 'client'))
  );
}

function generatePrismaClient() {
  const prismaCli = join(runtimeDir, 'node_modules', 'prisma', 'build', 'index.js');

  if (!existsSync(prismaCli)) {
    console.error(`[backend-runtime] Prisma CLI missing at ${prismaCli}`);
    process.exit(1);
  }

  ensurePrismaEngines();

  console.log(`[backend-runtime] node ${relative(runtimeDir, prismaCli)} generate --schema prisma/schema.prisma`);
  const result = spawnSync(process.execPath, [prismaCli, 'generate', '--schema', 'prisma/schema.prisma'], {
    cwd: runtimeDir,
    env: runtimeEnv(),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    if (hasGeneratedPrismaClient()) {
      console.warn(`[backend-runtime] Prisma generate exited with ${result.status}, but the generated client exists. Continuing.`);
      return;
    }

    process.exit(result.status || 1);
  }

  verifyPrismaEngines();
}

function ensurePrismaEngines() {
  const enginesDir = join(runtimeDir, 'node_modules', '@prisma', 'engines');
  const postinstall = join(enginesDir, 'dist', 'scripts', 'postinstall.js');

  if (!existsSync(postinstall)) {
    console.warn('[backend-runtime] Prisma engines postinstall script missing; engine download skipped');
    return;
  }

  console.log('[backend-runtime] Downloading Prisma engines for darwin, darwin-arm64, and windows');
  const result = spawnSync(process.execPath, [postinstall], {
    cwd: enginesDir,
    env: runtimeEnv(),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.warn(`[backend-runtime] Prisma engines postinstall exited with ${result.status}`);
  }
}

function verifyPrismaEngines() {
  const enginesDir = join(runtimeDir, 'node_modules', '@prisma', 'engines');
  const clientDir = join(runtimeDir, 'node_modules', '.prisma', 'client');
  const required = [
    join(enginesDir, 'schema-engine-darwin'),
    join(enginesDir, 'schema-engine-darwin-arm64'),
    join(enginesDir, 'schema-engine-windows.exe'),
    join(clientDir, 'libquery_engine-darwin.dylib.node'),
    join(clientDir, 'libquery_engine-darwin-arm64.dylib.node'),
    join(clientDir, 'query_engine-windows.dll.node'),
  ];

  const missing = required.filter((filePath) => !existsSync(filePath));
  if (missing.length > 0) {
    console.error('[backend-runtime] Missing Prisma engine binaries required for packaged apps:');
    for (const filePath of missing) {
      console.error(`  - ${relative(runtimeDir, filePath)}`);
    }
    process.exit(1);
  }

  console.log('[backend-runtime] Verified Prisma engines for macOS (Intel + Apple Silicon) and Windows');
}

function copyRequiredFiles() {
  rmSync(runtimeDir, { recursive: true, force: true });
  mkdirSync(runtimeDir, { recursive: true });

  cpSync(join(backendDir, 'dist'), join(runtimeDir, 'dist'), { recursive: true });
  cpSync(join(backendDir, 'package.json'), join(runtimeDir, 'package.json'));
  cpSync(join(backendDir, 'package-lock.json'), join(runtimeDir, 'package-lock.json'));
  cpSync(join(backendDir, 'prisma', 'schema.prisma'), join(runtimeDir, 'prisma', 'schema.prisma'));

  const migrationsDir = join(backendDir, 'prisma', 'migrations');
  if (existsSync(migrationsDir)) {
    cpSync(migrationsDir, join(runtimeDir, 'prisma', 'migrations'), { recursive: true });
  }
}

const removableDirectoryNames = new Set([
  '.cache',
  '.github',
  'coverage',
  'doc',
  'docs',
  'example',
  'examples',
  'test',
  'tests',
  '__test__',
  '__tests__',
]);

const removableFileExtensions = new Set([
  '.bak',
  '.db',
  '.db-journal',
  '.log',
  '.map',
  '.md',
  '.sqlite',
  '.sqlite3',
  '.tsbuildinfo',
]);

function shouldRemoveFile(filePath) {
  const lower = filePath.toLowerCase();
  return [...removableFileExtensions].some((ext) => lower.endsWith(ext));
}

function cleanRuntimeTree(dir) {
  if (!existsSync(dir)) return;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const lowerName = entry.name.toLowerCase();

    if (entry.isDirectory()) {
      if (removableDirectoryNames.has(lowerName)) {
        rmSync(fullPath, { recursive: true, force: true });
        continue;
      }
      cleanRuntimeTree(fullPath);
      continue;
    }

    if (entry.isFile() && shouldRemoveFile(fullPath)) {
      rmSync(fullPath, { force: true });
    }
  }
}

function getStats(dir) {
  let bytes = 0;
  let files = 0;

  if (!existsSync(dir)) return { bytes, files };

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const stat = statSync(fullPath);
        bytes += stat.size;
        files += 1;
      }
    }
  }

  walk(dir);
  return { bytes, files };
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

copyRequiredFiles();
run('npm', ['ci', '--omit=dev'], { cwd: runtimeDir });
generatePrismaClient();
cleanRuntimeTree(runtimeDir);

const runtimeStats = getStats(runtimeDir);
const nodeModulesStats = getStats(join(runtimeDir, 'node_modules'));

console.log(`[backend-runtime] Created ${relative(rootDir, runtimeDir)}`);
console.log(`[backend-runtime] Total size: ${formatMb(runtimeStats.bytes)} (${runtimeStats.files} files)`);
console.log(`[backend-runtime] node_modules size: ${formatMb(nodeModulesStats.bytes)} (${nodeModulesStats.files} files)`);
