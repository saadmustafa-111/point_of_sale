import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const rootDir = process.cwd();

function getStats(target) {
  let bytes = 0;
  let files = 0;

  if (!existsSync(target)) return null;

  const stat = statSync(target);
  if (stat.isFile()) return { bytes: stat.size, files: 1 };

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const fileStat = statSync(fullPath);
        bytes += fileStat.size;
        files += 1;
      }
    }
  }

  walk(target);
  return { bytes, files };
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function printPathSize(label, target) {
  const stats = getStats(target);
  if (!stats) {
    console.log(`${label}: missing (${relative(rootDir, target)})`);
    return;
  }
  console.log(`${label}: ${formatMb(stats.bytes)} (${stats.files} files)`);
}

function packageDirs(nodeModulesDir) {
  if (!existsSync(nodeModulesDir)) return [];

  const dirs = [];
  for (const entry of readdirSync(nodeModulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const packagePath = join(nodeModulesDir, entry.name);
    if (entry.name.startsWith('@')) {
      for (const scoped of readdirSync(packagePath, { withFileTypes: true })) {
        if (scoped.isDirectory()) dirs.push(join(packagePath, scoped.name));
      }
    } else {
      dirs.push(packagePath);
    }
  }
  return dirs;
}

function printLargestPackages(title, nodeModulesDir, limit = 30) {
  console.log('');
  console.log(title);
  if (!existsSync(nodeModulesDir)) {
    console.log(`missing (${relative(rootDir, nodeModulesDir)})`);
    return;
  }

  const rows = packageDirs(nodeModulesDir)
    .map((dir) => ({ dir, stats: getStats(dir) }))
    .filter((item) => item.stats)
    .sort((a, b) => b.stats.bytes - a.stats.bytes)
    .slice(0, limit);

  for (const item of rows) {
    console.log(`${formatMb(item.stats.bytes).padStart(10)}  ${relative(rootDir, item.dir)}`);
  }
}

console.log('Release size report');
console.log('===================');
printPathSize('dist-electron/win-unpacked', join(rootDir, 'dist-electron', 'win-unpacked'));
printPathSize('dist-electron/win-unpacked/resources/backend', join(rootDir, 'dist-electron', 'win-unpacked', 'resources', 'backend'));
printPathSize('dist-electron/win-unpacked/resources/backend/node_modules', join(rootDir, 'dist-electron', 'win-unpacked', 'resources', 'backend', 'node_modules'));
printPathSize('dist-electron/win-unpacked/resources/renderer', join(rootDir, 'dist-electron', 'win-unpacked', 'resources', 'renderer'));
printPathSize('dist-electron/win-unpacked/resources/app.asar', join(rootDir, 'dist-electron', 'win-unpacked', 'resources', 'app.asar'));
printPathSize('release/backend-runtime', join(rootDir, 'release', 'backend-runtime'));
printPathSize('release/backend-runtime/node_modules', join(rootDir, 'release', 'backend-runtime', 'node_modules'));
printPathSize('apps/backend/node_modules', join(rootDir, 'apps', 'backend', 'node_modules'));
printPathSize('apps/backend/dist', join(rootDir, 'apps', 'backend', 'dist'));
printPathSize('apps/renderer/dist', join(rootDir, 'apps', 'renderer', 'dist'));

printLargestPackages('Top 30 largest packages in apps/backend/node_modules', join(rootDir, 'apps', 'backend', 'node_modules'), 30);
printLargestPackages('Top 30 largest packages in release/backend-runtime/node_modules', join(rootDir, 'release', 'backend-runtime', 'node_modules'), 30);
