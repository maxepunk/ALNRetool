#!/usr/bin/env tsx
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '..', '.env') });

console.log('Starting server test...');
console.log('API_KEY from env:', process.env.API_KEY?.substring(0, 10) + '...');

const serverProcess = spawn('tsx', ['server/index.ts'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'test'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverReady = false;

serverProcess.stdout?.on('data', (data: Buffer) => {
  const output = data.toString();
  console.log('[stdout]:', output.trim());
  if (output.includes('Server is running') && !serverReady) {
    serverReady = true;
    console.log('✓ Server started successfully');
    
    // Test a request
    fetch('http://localhost:3001/api/health')
      .then(res => {
        console.log('Health check status:', res.status);
        process.exit(0);
      })
      .catch(err => {
        console.error('Health check failed:', err);
        process.exit(1);
      });
  }
});

serverProcess.stderr?.on('data', (data: Buffer) => {
  console.log('[stderr]:', data.toString().trim());
});

serverProcess.on('error', (err) => {
  console.error('Server process error:', err);
  process.exit(1);
});

setTimeout(() => {
  if (!serverReady) {
    console.error('Server failed to start within 10 seconds');
    serverProcess.kill();
    process.exit(1);
  }
}, 10000);