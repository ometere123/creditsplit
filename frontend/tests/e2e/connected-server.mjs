import { spawn } from 'node:child_process';

const child = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3110'], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_CONTRACT_ADDRESS: '0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D' },
  shell: true,
  stdio: 'inherit',
});

const stop = () => {
  if (!child.killed) child.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
child.on('exit', (code) => { process.exitCode = code ?? 1; });
