#!/usr/bin/env tsx
/**
 * Test signal handling behavior
 */
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess: ChildProcess | null = null;

console.log('Test PID:', process.pid);
console.log('Press Ctrl+C to test SIGINT handling...\n');

// Set up signal handlers FIRST before spawning
process.on('SIGINT', () => {
  console.log('\n[SIGINT] Received interrupt signal');
  console.log('[SIGINT] serverProcess exists?', !!serverProcess);
  console.log('[SIGINT] serverProcess.pid?', serverProcess?.pid);
  
  if (serverProcess) {
    console.log('[SIGINT] Attempting to kill server...');
    try {
      // Try to kill the process
      const killed = serverProcess.kill('SIGTERM');
      console.log('[SIGINT] Kill command sent, result:', killed);
    } catch (e) {
      console.log('[SIGINT] Error killing:', e);
    }
  }
  
  // Give it a moment to clean up
  setTimeout(() => {
    console.log('[SIGINT] Checking for remaining processes on port 3001...');
    const check = spawn('lsof', ['-i', ':3001'], { stdio: 'pipe' });
    check.stdout?.on('data', (data) => {
      console.log('[SIGINT] Still running:', data.toString());
    });
    check.on('close', () => {
      console.log('[SIGINT] Exiting...');
      process.exit(1);
    });
  }, 1000);
});

// Now spawn the server
serverProcess = spawn('tsx', ['server/index.ts'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'test'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

console.log('Spawned server with PID:', serverProcess.pid);

serverProcess.stdout?.on('data', (data: Buffer) => {
  const output = data.toString().trim();
  if (output.includes('Server is running')) {
    console.log('✓ Server started successfully');
    console.log('\nNow press Ctrl+C to test cleanup...');
  }
});

serverProcess.stderr?.on('data', (data: Buffer) => {
  console.error('Server stderr:', data.toString().trim());
});

serverProcess.on('exit', (code, signal) => {
  console.log(`Server process exited with code ${code} and signal ${signal}`);
});

// Keep the process alive
setInterval(() => {
  // Just keep running
}, 1000);