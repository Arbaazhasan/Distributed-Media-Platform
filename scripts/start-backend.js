import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// In cloud deployment (e.g. Render / Railway):
// - API Gateway runs on process.env.PORT, serving both REST endpoints and Socket.IO signaling
// - Worker Node runs concurrently on the same instance, sharing /tmp for FFmpeg transcoding and Cloudinary upload
const services = [
  { name: 'API-GATEWAY', dir: 'api-gateway', cmd: npmCmd, args: ['start'] },
  { name: 'WORKER-NODE', dir: 'worker-node', cmd: npmCmd, args: ['start'] },
];

console.log('[Cloud Backend Runner] Launching backend services (API Gateway + Socket.IO + Worker Node)...');

services.forEach((service) => {
  const child = spawn(service.cmd, service.args, {
    cwd: path.join(rootDir, service.dir),
    shell: true,
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('error', (err) => {
    console.error(`[${service.name}] Process error:`, err);
  });

  child.on('exit', (code) => {
    console.log(`[${service.name}] Exited with code ${code}`);
  });
});
