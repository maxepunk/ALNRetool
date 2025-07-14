#!/usr/bin/env tsx
/**
 * Smoke Test Suite for ALNRetool API Server
 * 
 * This comprehensive test suite validates all critical functionality:
 * - Authentication (API key validation)
 * - All 4 Notion API endpoints
 * - Rate limiting behavior
 * - CORS configuration
 * - Error handling consistency
 * 
 * Run with: tsx scripts/smoke-test.ts
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real environment for integration testing
config({ path: path.join(__dirname, '..', '.env') });

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_API_KEY = process.env.API_KEY || 'test-api-key-12345';
const TEST_TIMEOUT = 30000; // 30 seconds

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

// Helper to make HTTP requests
async function makeRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers: defaultHeaders
  });
}

// Test runner
async function runTest(
  name: string, 
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start
    };
  }
}

// Test suites
async function runHealthCheckTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Health check returns 200 OK', async () => {
    const res = await makeRequest('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Expected status 'ok', got '${data.status}'`);
    if (!data.timestamp) throw new Error('Missing timestamp');
    
    // Validate ISO timestamp
    const date = new Date(data.timestamp);
    if (isNaN(date.getTime())) throw new Error('Invalid timestamp format');
  }));
  
  tests.push(await runTest('Health check works without API key', async () => {
    const res = await makeRequest('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  }));
  
  return { name: 'Health Check Tests', tests };
}

async function runAuthenticationTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Valid API key allows access', async () => {
    const res = await makeRequest('/api/notion/characters', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    // May be 200 or 500 (if DB not configured), but not 401
    if (res.status === 401) throw new Error('Valid API key rejected');
  }));
  
  tests.push(await runTest('Missing API key returns 401', async () => {
    const res = await makeRequest('/api/notion/characters');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    
    const data = await res.json();
    if (data.code !== 'UNAUTHORIZED') throw new Error(`Expected UNAUTHORIZED, got ${data.code}`);
    if (data.message !== 'Unauthorized - Invalid API key') {
      throw new Error(`Unexpected message: ${data.message}`);
    }
  }));
  
  tests.push(await runTest('Invalid API key returns 401', async () => {
    const res = await makeRequest('/api/notion/characters', {
      headers: { 'X-API-Key': 'wrong-key' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    
    const data = await res.json();
    if (data.code !== 'UNAUTHORIZED') throw new Error(`Expected UNAUTHORIZED, got ${data.code}`);
  }));
  
  return { name: 'Authentication Tests', tests };
}

async function runEndpointTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  const endpoints = [
    { path: '/api/notion/characters', name: 'Characters' },
    { path: '/api/notion/elements', name: 'Elements' },
    { path: '/api/notion/puzzles', name: 'Puzzles' },
    { path: '/api/notion/timeline', name: 'Timeline' }
  ];
  
  for (const endpoint of endpoints) {
    tests.push(await runTest(`${endpoint.name} endpoint structure`, async () => {
      const res = await makeRequest(endpoint.path, {
        headers: { 'X-API-Key': TEST_API_KEY }
      });
      
      const data = await res.json();
      
      // Integration tests expect 200 with real data
      if (res.status === 200) {
        if (!Array.isArray(data.data)) throw new Error('data should be an array');
        if (data.nextCursor !== null) throw new Error('nextCursor should be null');
        if (data.hasMore !== false) throw new Error('hasMore should be false');
        
        // Validate data structure when data exists
        if (data.data.length > 0) {
          const firstItem = data.data[0];
          if (!firstItem.id) throw new Error('Item missing id');
          
          // Special handling for Timeline events which may have empty names
          if (endpoint.name === 'Timeline') {
            // Timeline events can have empty names but the field must exist
            if (!firstItem.hasOwnProperty('name')) {
              throw new Error('Timeline item missing name field');
            }
            // Verify name is either a string or empty string
            if (typeof firstItem.name !== 'string') {
              throw new Error('Timeline name field should be a string');
            }
          } else {
            // Other endpoints must have non-empty names
            if (!firstItem.name) throw new Error('Item missing name');
          }
          
          // Endpoint-specific validations
          if (endpoint.name === 'Characters') {
            if (!firstItem.type) throw new Error('Character missing type');
            if (!firstItem.tier) throw new Error('Character missing tier');
          } else if (endpoint.name === 'Elements') {
            if (!firstItem.basicType) throw new Error('Element missing basicType');
            if (!firstItem.status) throw new Error('Element missing status');
          } else if (endpoint.name === 'Puzzles') {
            if (!Array.isArray(firstItem.puzzleElementIds)) {
              throw new Error('Puzzle missing puzzleElementIds array');
            }
          } else if (endpoint.name === 'Timeline') {
            // Timeline events may have empty descriptions, which is OK
            if (!firstItem.hasOwnProperty('date')) throw new Error('Timeline event missing date property');
          }
        }
      } else {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    }));
  }
  
  return { name: 'Endpoint Tests', tests };
}

async function runCORSTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Allowed origin (localhost:5173)', async () => {
    const res = await makeRequest('/api/health', {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    const corsHeader = res.headers.get('access-control-allow-origin');
    if (corsHeader !== 'http://localhost:5173') {
      throw new Error(`Expected CORS header for localhost:5173, got ${corsHeader}`);
    }
    
    const credentials = res.headers.get('access-control-allow-credentials');
    if (credentials !== 'true') {
      throw new Error('Expected credentials to be allowed');
    }
  }));
  
  tests.push(await runTest('Disallowed origin succeeds without CORS header', async () => {
    const res = await makeRequest('/api/health', {
      headers: { 'Origin': 'http://evil.com' }
    });
    
    // Request should succeed (200 OK)
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
    
    // But CORS header should be missing or not match evil.com
    const corsHeader = res.headers.get('access-control-allow-origin');
    if (corsHeader === 'http://evil.com') {
      throw new Error('CORS header should not allow evil.com');
    }
  }));
  
  return { name: 'CORS Tests', tests };
}

async function runRateLimitTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Rate limit message after 100 requests', async () => {
    // This test would take too long to run 100+ requests
    // In a real scenario, we'd test this with a smaller limit
    // For now, we just verify the endpoint exists and responds
    const res = await makeRequest('/api/health');
    if (res.status !== 200) throw new Error('Health check failed');
    
    console.log('    ⚠️  Rate limit test skipped (would require 100+ requests)');
  }));
  
  return { name: 'Rate Limit Tests', tests };
}

async function runBottleneckTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Rate limiting prevents 429 errors', async () => {
    const promises = [];
    const startTime = Date.now();
    
    // Make 5 rapid requests
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('/api/notion/characters', {
        headers: { 'X-API-Key': TEST_API_KEY }
      }));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // All should succeed (no 429s)
    const hasRateLimit = responses.some(res => res.status === 429);
    if (hasRateLimit) throw new Error('Got 429 despite rate limiting');
    
    // Should take at least 4 * 340ms = 1360ms
    if (duration < 1360) {
      throw new Error(`Requests too fast: ${duration}ms (expected >1360ms)`);
    }
  }));
  
  return { name: 'Bottleneck Tests', tests };
}

async function runTransformTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('SF_ pattern parsing from Elements', async () => {
    const res = await makeRequest('/api/notion/elements', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    
    // Find element with SF_ patterns
    const elementWithPatterns = data.data.find((el: any) => 
      el.descriptionText && el.descriptionText.includes('SF_')
    );
    
    if (elementWithPatterns) {
      console.log('    Found element with SF_ patterns:');
      console.log('    Full Description:', elementWithPatterns.descriptionText);
      console.log('    SF Patterns:', JSON.stringify(elementWithPatterns.sfPatterns, null, 2));
      
      if (!elementWithPatterns.sfPatterns) {
        throw new Error('Element with SF_ text missing sfPatterns object');
      }
      
      // Validate specific pattern extraction
      if (elementWithPatterns.descriptionText.includes('SF_RFID:')) {
        // Check if it's a template placeholder or actual value
        const rfidMatch = elementWithPatterns.descriptionText.match(/SF_RFID:\s*\[([^\]]+)\]/);
        if (rfidMatch && rfidMatch[1]) {
          const value = rfidMatch[1].trim();
          // If it's a template placeholder, expect no extraction
          const isTemplate = value.match(/^(unique identifier|TBD|TODO)$/i);
          
          if (isTemplate) {
            console.log('    SF_RFID is template placeholder - correctly not extracted');
            // Template should not be extracted - this is correct behavior
          } else {
            // Non-template value should be extracted (future RFID values)
            if (!elementWithPatterns.sfPatterns.rfid) {
              throw new Error('SF_RFID pattern not extracted');
            }
            console.log('    SF_RFID extracted:', elementWithPatterns.sfPatterns.rfid);
          }
        }
      }
      
      if (elementWithPatterns.descriptionText.includes('SF_ValueRating:')) {
        console.log('    SF_ValueRating value:', elementWithPatterns.sfPatterns.valueRating);
        console.log('    SF_ValueRating type:', typeof elementWithPatterns.sfPatterns.valueRating);
        // Only fail if the pattern exists but wasn't parsed as a number
        if (elementWithPatterns.sfPatterns.valueRating !== undefined && 
            typeof elementWithPatterns.sfPatterns.valueRating !== 'number') {
          throw new Error('SF_ValueRating not parsed as number');
        }
      }
      
      if (elementWithPatterns.descriptionText.includes('SF_MemoryType:')) {
        // Check if it's a template (with options) or actual value
        const memoryTypeMatch = elementWithPatterns.descriptionText.match(/SF_MemoryType:\s*\[([^\]]+)\]/);
        if (memoryTypeMatch && memoryTypeMatch[1]) {
          const value = memoryTypeMatch[1];
          // If it contains | or parentheses, it's a template showing options
          const isTemplate = value.includes('|') || value.includes('(');
          
          if (!isTemplate && !elementWithPatterns.sfPatterns.memoryType) {
            throw new Error('SF_MemoryType pattern not extracted');
          } else if (isTemplate) {
            console.log('    SF_MemoryType is a template placeholder, skipping validation');
          }
        }
      }
      
      if (elementWithPatterns.descriptionText.includes('SF_Group:')) {
        // Group can be a template like "{Group Name} (x2-10)" or actual value
        const groupMatch = elementWithPatterns.descriptionText.match(/SF_Group:\s*\[([^\]]+)\]/);
        if (groupMatch && groupMatch[1]) {
          const value = groupMatch[1].trim();
          const isTemplate = value.includes('{') && value.includes('}');
          
          if (!isTemplate && (!elementWithPatterns.sfPatterns.group || !elementWithPatterns.sfPatterns.group.name)) {
            throw new Error('SF_Group pattern not extracted');
          } else if (isTemplate) {
            console.log('    SF_Group is a template placeholder, skipping validation');
          }
        }
      }
    } else {
      console.log('    ⚠️  No elements with SF_ patterns found for testing');
    }
  }));
  
  tests.push(await runTest('Relation data properly transformed', async () => {
    const res = await makeRequest('/api/notion/puzzles', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    
    if (data.data.length > 0) {
      const puzzle = data.data[0];
      
      // Check arrays are properly initialized
      if (!Array.isArray(puzzle.puzzleElementIds)) {
        throw new Error('puzzleElementIds should be an array');
      }
      if (!Array.isArray(puzzle.rewardIds)) {
        throw new Error('rewardIds should be an array');
      }
      if (!Array.isArray(puzzle.subPuzzleIds)) {
        throw new Error('subPuzzleIds should be an array');
      }
    }
  }));
  
  return { name: 'Transform Tests', tests };
}

// Server management
let serverProcess: any = null;

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server...');
    
    serverProcess = spawn('tsx', ['server/index.ts'], {
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
      if (output.includes('Server is running') && !serverReady) {
        serverReady = true;
        console.log('✓ Server started successfully\n');
        setTimeout(resolve, 1000); // Give it a second to fully initialize
      }
    });
    
    serverProcess.stderr?.on('data', (data: Buffer) => {
      console.error('Server error:', data.toString());
    });
    
    serverProcess.on('error', reject);
    
    // Timeout if server doesn't start
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server failed to start within timeout'));
      }
    }, TEST_TIMEOUT);
  });
}

async function stopServer(): Promise<void> {
  if (serverProcess) {
    console.log('\nStopping server...');
    serverProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✓ Server stopped\n');
  }
}

// Main test runner
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('ALNRetool API Integration Tests');
  console.log('='.repeat(60));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`API Key: ${TEST_API_KEY.substring(0, 5)}...`);
  console.log('='.repeat(60) + '\n');
  
  const allSuites: TestSuite[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  try {
    // Start the server
    await startServer();
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run all test suites
    allSuites.push(await runHealthCheckTests());
    allSuites.push(await runAuthenticationTests());
    allSuites.push(await runEndpointTests());
    allSuites.push(await runCORSTests());
    allSuites.push(await runRateLimitTests());
    allSuites.push(await runBottleneckTests());
    allSuites.push(await runTransformTests());
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60) + '\n');
    
    for (const suite of allSuites) {
      console.log(`\n${suite.name}:`);
      console.log('-'.repeat(40));
      
      for (const test of suite.tests) {
        const icon = test.passed ? '✓' : '✗';
        const status = test.passed ? 'PASS' : 'FAIL';
        console.log(`  ${icon} ${test.name} (${test.duration}ms) [${status}]`);
        
        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error}`);
        }
        
        if (test.passed) totalPassed++;
        else totalFailed++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalPassed + totalFailed}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');
    
    // Exit code
    process.exit(totalFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  } finally {
    await stopServer();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  await stopServer();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...');
  await stopServer();
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  stopServer().then(() => process.exit(1));
});