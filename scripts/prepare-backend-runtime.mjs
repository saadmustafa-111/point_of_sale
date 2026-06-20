import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';

const rootDir = process.cwd();
const backendDir = join(rootDir, 'apps', 'backend');
const runtimeDir = join(rootDir, 'release', 'backend-runtime');
const homeDir = join(rootDir, 'release', '.home');
const prismaCacheDir = join(rootDir, 'release', '.prisma-cache');

function run(command, args, options = {}) {
  console.log(`[backend-runtime] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      HOME: homeDir,
      PRISMA_ENGINES_CACHE_DIR: prismaCacheDir,
      XDG_CACHE_HOME: join(rootDir, 'release', '.cache'),
    },
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
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
run('npx', ['prisma', 'generate', '--schema', 'prisma/schema.prisma'], { cwd: runtimeDir });
cleanRuntimeTree(runtimeDir);

const runtimeStats = getStats(runtimeDir);
const nodeModulesStats = getStats(join(runtimeDir, 'node_modules'));

console.log(`[backend-runtime] Created ${relative(rootDir, runtimeDir)}`);
console.log(`[backend-runtime] Total size: ${formatMb(runtimeStats.bytes)} (${runtimeStats.files} files)`);
console.log(`[backend-runtime] node_modules size: ${formatMb(nodeModulesStats.bytes)} (${nodeModulesStats.files} files)`);
