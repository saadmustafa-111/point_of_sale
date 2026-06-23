const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const result = spawnSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    encoding: 'utf8',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`Ad-hoc macOS codesign failed for ${appPath}`);
  }

  const enginesDir = path.join(
    appPath,
    'Contents',
    'Resources',
    'backend',
    'node_modules',
    '@prisma',
    'engines',
  );

  if (fs.existsSync(enginesDir)) {
    for (const entry of fs.readdirSync(enginesDir)) {
      if (!entry.startsWith('schema-engine') && !entry.startsWith('libquery_engine')) continue;

      const enginePath = path.join(enginesDir, entry);
      fs.chmodSync(enginePath, 0o755);

      const signResult = spawnSync('codesign', ['--force', '--sign', '-', enginePath], {
        encoding: 'utf8',
      });

      if (signResult.stdout) process.stdout.write(signResult.stdout);
      if (signResult.stderr) process.stderr.write(signResult.stderr);
      if (signResult.status !== 0) {
        throw new Error(`Ad-hoc macOS codesign failed for Prisma engine ${enginePath}`);
      }
    }
  }

  console.log(`[afterPack] Ad-hoc signed ${appPath}`);
};
