/**
 * Shared test server utilities using tree-kill for proper cleanup
 * 
 * Provides consistent server spawning and cleanup for all test suites,
 * preventing zombie processes and port conflicts.
 */
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// tree-kill doesn't have types, so we need to use createRequire in ESM
const require = createRequire(import.meta.url);
const kill = require('tree-kill');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestServerOptions {
  port?: number;
  env?: Record<string, string>;
  verbose?: boolean;
  startupTimeout?: number;
}

export class TestServer {
  private serverProcess: ChildProcess | null = null;
  private port: number;
  private verbose: boolean;
  private startupTimeout: number;
  private cleanupInProgress = false;

  constructor(options: TestServerOptions = {}) {
    this.port = options.port || 3001;
    this.verbose = options.verbose || false;
    this.startupTimeout = options.startupTimeout || 30000;
    
    // Set up signal handlers for proper cleanup
    this.setupSignalHandlers();
  }

  /**
   * Start the test server
   */
  async start(env: Record<string, string> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log('Starting Express server...');
      
      this.serverProcess = spawn('tsx', ['server/index.ts'], {
        cwd: path.join(__dirname, '..', '..'),
        env: {
          ...process.env,
          PORT: String(this.port),
          NODE_ENV: 'test',
          ...env
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        // Don't detach - we want it in our process group
        detached: false
      });

      if (!this.serverProcess.pid) {
        return reject(new Error('Failed to spawn server process'));
      }

      this.log(`Server process spawned with PID: ${this.serverProcess.pid}`);

      let serverReady = false;
      const startupTimer = setTimeout(() => {
        if (!serverReady) {
          this.kill();
          reject(new Error(`Server failed to start within ${this.startupTimeout}ms`));
        }
      }, this.startupTimeout);

      this.serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (this.verbose) {
          console.log('[Server]:', output.trim());
        }
        
        if (output.includes('Server is running') && !serverReady) {
          serverReady = true;
          clearTimeout(startupTimer);
          this.log('✓ Server started successfully');
          // Give it a moment to fully initialize
          setTimeout(resolve, 1000);
        }
      });

      this.serverProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (this.verbose) {
          console.error('[Server Error]:', output.trim());
        }
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(startupTimer);
        reject(error);
      });

      this.serverProcess.on('exit', (code, signal) => {
        this.log(`Server process exited with code ${code} and signal ${signal}`);
        this.serverProcess = null;
      });
    });
  }

  /**
   * Stop the test server gracefully
   */
  async stop(): Promise<void> {
    if (!this.serverProcess || !this.serverProcess.pid) {
      this.log('No server process to stop');
      return;
    }

    if (this.cleanupInProgress) {
      this.log('Cleanup already in progress');
      return;
    }

    this.cleanupInProgress = true;
    const pid = this.serverProcess.pid;
    
    return new Promise((resolve) => {
      this.log(`Stopping server process ${pid} and its children...`);
      
      // Use tree-kill to kill the process and all its children
      kill(pid, 'SIGTERM', (err?: Error) => {
        if (err) {
          this.log(`Error during graceful shutdown: ${err.message}`);
          // Try force kill
          kill(pid, 'SIGKILL', () => {
            this.serverProcess = null;
            this.cleanupInProgress = false;
            resolve();
          });
        } else {
          this.log('✓ Server stopped gracefully');
          this.serverProcess = null;
          this.cleanupInProgress = false;
          resolve();
        }
      });

      // Fallback timeout - force kill if graceful shutdown takes too long
      setTimeout(() => {
        if (this.serverProcess) {
          this.log('Graceful shutdown timed out, force killing...');
          kill(pid, 'SIGKILL', () => {
            this.serverProcess = null;
            this.cleanupInProgress = false;
            resolve();
          });
        }
      }, 5000);
    });
  }

  /**
   * Kill the server immediately
   */
  kill(): void {
    if (!this.serverProcess || !this.serverProcess.pid) {
      return;
    }

    const pid = this.serverProcess.pid;
    this.log(`Force killing server process ${pid}`);
    
    try {
      kill(pid, 'SIGKILL');
    } catch (err) {
      this.log(`Error killing process: ${err}`);
    }
    
    this.serverProcess = null;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.serverProcess !== null && this.serverProcess.pid !== undefined;
  }

  /**
   * Get the server process PID
   */
  getPid(): number | undefined {
    return this.serverProcess?.pid;
  }

  /**
   * Get the server URL
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Set up signal handlers for cleanup
   */
  private setupSignalHandlers(): void {
    // Use 'once' to avoid multiple registrations
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    
    signals.forEach(signal => {
      process.once(signal, () => {
        console.log(`\n[TestServer] Received ${signal}, cleaning up...`);
        
        if (this.serverProcess && this.serverProcess.pid) {
          // Synchronous kill for immediate effect
          try {
            kill(this.serverProcess.pid, 'SIGKILL');
          } catch (err) {
            // Process might already be dead
          }
        }
        
        // Exit with proper code
        process.exit(signal === 'SIGINT' ? 130 : 1);
      });
    });
  }

  private log(message: string): void {
    if (this.verbose || message.includes('Error') || message.includes('✓')) {
      console.log(`[TestServer] ${message}`);
    }
  }
}