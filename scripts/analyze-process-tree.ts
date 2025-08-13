#!/usr/bin/env tsx
/**
 * Diagnostic tool to understand process tree creation
 */
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Parent PID:', process.pid);

// Spawn server like our tests do
const serverProcess = spawn('tsx', ['server/index.ts'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'test'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

console.log('Spawned process PID:', serverProcess.pid);

serverProcess.stdout?.on('data', (data: Buffer) => {
  const output = data.toString();
  if (output.includes('Server is running')) {
    console.log('Server started successfully');
    
    // Check process tree after 1 second
    setTimeout(() => {
      console.log('\n=== Process Tree ===');
      spawn('pstree', ['-p', String(process.pid)], { stdio: 'inherit' });
      
      setTimeout(() => {
        console.log('\n=== Attempting cleanup ===');
        console.log('Killing with SIGTERM to PID:', serverProcess.pid);
        serverProcess.kill('SIGTERM');
        
        setTimeout(() => {
          console.log('\n=== After SIGTERM ===');
          spawn('pstree', ['-p', String(process.pid)], { stdio: 'inherit' });
          
          // Check if any processes still on port
          spawn('lsof', ['-i', ':3001'], { stdio: 'inherit' });
          
          setTimeout(() => {
            console.log('\n=== Force cleanup ===');
            process.exit(0);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 1000);
  }
});

serverProcess.stderr?.on('data', (data: Buffer) => {
  console.error('Server stderr:', data.toString());
});