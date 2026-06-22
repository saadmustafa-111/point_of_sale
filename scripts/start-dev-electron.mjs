import { spawn } from 'node:child_process';

const env = { ...process.env, NODE_ENV: 'development' };
delete env.ELECTRON_RUN_AS_NODE;

const command = process.platform === 'win32' ? 'electron.cmd' : 'electron';
const child = spawn(command, ['.'], {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
