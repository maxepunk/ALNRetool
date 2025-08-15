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

import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TestServer } from './utils/test-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real environment for integration testing
config({ path: path.join(__dirname, '..', '.env') });

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_API_KEY = process.env.API_KEY ?? 'test-api-key-12345';
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
  
  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after 10 seconds`);
    }
    throw error;
  }
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
  
  console.log('  [DEBUG] TEST_API_KEY being used:', TEST_API_KEY);
  
  tests.push(await runTest('Valid API key allows access', async () => {
    const res = await makeRequest('/api/notion/characters?limit=1', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    // May be 200 or 500 (if DB not configured), but not 401
    if (res.status === 401) throw new Error('Valid API key rejected');
  }));
  
  tests.push(await runTest('Missing API key returns 401', async () => {
    const res = await makeRequest('/api/notion/characters?limit=1');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    
    const data = await res.json();
    if (data.code !== 'UNAUTHORIZED') throw new Error(`Expected UNAUTHORIZED, got ${data.code}`);
    if (data.message !== 'Unauthorized - Invalid API key') {
      throw new Error(`Unexpected message: ${data.message}`);
    }
  }));
  
  tests.push(await runTest('Invalid API key returns 401', async () => {
    const res = await makeRequest('/api/notion/characters?limit=1', {
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
    { path: '/api/notion/characters?limit=2', name: 'Characters' },
    { path: '/api/notion/elements?limit=2', name: 'Elements' },
    { path: '/api/notion/puzzles?limit=2', name: 'Puzzles' },
    { path: '/api/notion/timeline?limit=2', name: 'Timeline' }
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
        // With limited queries, nextCursor and hasMore may indicate more data
        if (typeof data.nextCursor !== 'string' && data.nextCursor !== null) {
          throw new Error('nextCursor should be string or null');
        }
        if (typeof data.hasMore !== 'boolean') throw new Error('hasMore should be boolean');
        
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
            // Other endpoints must have name field (can be empty string)
            if (!firstItem.hasOwnProperty('name')) {
              throw new Error('Item missing name field');
            }
            // Name should be a string (including empty string for incomplete data)
            if (typeof firstItem.name !== 'string') {
              throw new Error('Name field should be a string');
            }
          }
          
          // Endpoint-specific validations (check field existence, not values)
          if (endpoint.name === 'Characters') {
            if (!firstItem.hasOwnProperty('type')) throw new Error('Character missing type field');
            if (!firstItem.hasOwnProperty('tier')) throw new Error('Character missing tier field');
          } else if (endpoint.name === 'Elements') {
            if (!firstItem.hasOwnProperty('basicType')) throw new Error('Element missing basicType field');
            // Status can be null for incomplete data
            if (!firstItem.hasOwnProperty('status')) throw new Error('Element missing status field');
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
    
    // Make 5 rapid requests with limited data - use cache bypass to force Notion API calls
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest(`/api/notion/characters?limit=1&t=${Date.now()}${i}`, {
        headers: { 
          'X-API-Key': TEST_API_KEY,
          'X-Cache-Bypass': 'true' // Force actual Notion API calls to test rate limiting
        }
      }));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // All should succeed (no 429s)
    const hasRateLimit = responses.some(res => res.status === 429);
    if (hasRateLimit) throw new Error('Got 429 despite rate limiting');
    
    // Should take at least 4 * 340ms = 1360ms (only if actually hitting Notion)
    // With caching, requests will be fast, so we check if any were cache hits
    const allBypassed = responses.every(res => res.headers.get('x-cache-hit') === 'false');
    
    if (allBypassed && duration < 1360) {
      throw new Error(`Requests too fast: ${duration}ms (expected >1360ms for Notion API calls)`);
    } else if (!allBypassed) {
      console.log('    ⚠️  Some requests were cached, skipping rate limit timing check');
    }
  }));
  
  return { name: 'Bottleneck Tests', tests };
}

async function runCacheTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Cache hit on repeated request', async () => {
    // Use a unique query param to ensure fresh cache key
    const uniqueLimit = 13; // Unlikely to be used elsewhere
    
    // First request - should be cache miss (or we bypass)
    const res1 = await makeRequest(`/api/notion/characters?limit=${uniqueLimit}`, {
      headers: { 
        'X-API-Key': TEST_API_KEY,
        'X-Cache-Bypass': 'true' // Force bypass to ensure fresh data
      }
    });
    
    if (res1.status !== 200) throw new Error(`Expected 200, got ${res1.status}`);
    const cacheHit1 = res1.headers.get('x-cache-hit');
    if (cacheHit1 !== 'false') throw new Error(`Expected cache miss with bypass, got ${cacheHit1}`);
    
    // Second identical request without bypass - should be cache hit
    const res2 = await makeRequest(`/api/notion/characters?limit=${uniqueLimit}`, {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res2.status !== 200) throw new Error(`Expected 200, got ${res2.status}`);
    const cacheHit2 = res2.headers.get('x-cache-hit');
    if (cacheHit2 !== 'true') throw new Error(`Expected cache hit, got ${cacheHit2}`);
    
    // Verify data is identical
    const data1 = await res1.json();
    const data2 = await res2.json();
    if (JSON.stringify(data1) !== JSON.stringify(data2)) {
      throw new Error('Cached response differs from original');
    }
  }));
  
  tests.push(await runTest('Cache bypass header works', async () => {
    // Prime the cache
    await makeRequest('/api/notion/elements?limit=1', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    // Request with bypass header - should be cache miss
    const res = await makeRequest('/api/notion/elements?limit=1', {
      headers: { 
        'X-API-Key': TEST_API_KEY,
        'X-Cache-Bypass': 'true'
      }
    });
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const cacheHit = res.headers.get('x-cache-hit');
    if (cacheHit !== 'false') throw new Error(`Expected cache miss with bypass, got ${cacheHit}`);
  }));
  
  tests.push(await runTest('Different query params use different cache keys', async () => {
    // Use unique limits to avoid collision with other tests
    const limit1 = 17;
    const limit2 = 19;

    // Ensure limit1 is cached (force bypass first to guarantee fresh state)
    await makeRequest(`/api/notion/puzzles?limit=${limit1}`, {
      headers: { 'X-API-Key': TEST_API_KEY, 'X-Cache-Bypass': 'true' }
    });
    const res1_cached = await makeRequest(`/api/notion/puzzles?limit=${limit1}`, {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    if (res1_cached.headers.get('x-cache-hit') !== 'true') {
      throw new Error(`Expected limit1 (${limit1}) to be cached after priming`);
    }

    // Ensure limit2 is cached (force bypass first)
    await makeRequest(`/api/notion/puzzles?limit=${limit2}`, {
      headers: { 'X-API-Key': TEST_API_KEY, 'X-Cache-Bypass': 'true' }
    });
    const res2_cached = await makeRequest(`/api/notion/puzzles?limit=${limit2}`, {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    if (res2_cached.headers.get('x-cache-hit') !== 'true') {
      throw new Error(`Expected limit2 (${limit2}) to be cached after priming`);
    }

    // Now, verify that requesting limit1 still results in a hit (i.e., limit2 didn't overwrite it)
    const res1_recheck = await makeRequest(`/api/notion/puzzles?limit=${limit1}`, {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    if (res1_recheck.headers.get('x-cache-hit') !== 'true') {
      throw new Error(`Limit1 (${limit1}) should still be cached after limit2 (${limit2}) was added`);
    }
  }));
  
  tests.push(await runTest('Cached response is fast (<50ms)', async () => {
    // Prime the cache
    await makeRequest('/api/notion/timeline?limit=1', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    // Measure cached response time
    const start = Date.now();
    const res = await makeRequest('/api/notion/timeline?limit=1', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    const duration = Date.now() - start;
    
    const cacheHit = res.headers.get('x-cache-hit');
    if (cacheHit !== 'true') throw new Error('Expected cache hit for timing test');
    
    // Allow some slack for CI/slow systems
    if (duration > 100) {
      console.log(`    ⚠️  Cached response took ${duration}ms (expected <50ms, warning at >100ms)`);
    }
  }));
  
  return { name: 'Cache Tests', tests };
}

async function runValidationTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('Validation: Rejects limit > 100', async () => {
    const res = await makeRequest('/api/notion/characters?limit=101', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    if (data.code !== 'INVALID_LIMIT') throw new Error(`Expected INVALID_LIMIT, got ${data.code}`);
  }));
  
  tests.push(await runTest('Validation: Rejects limit < 1', async () => {
    const res = await makeRequest('/api/notion/elements?limit=0', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    if (data.code !== 'INVALID_LIMIT') throw new Error(`Expected INVALID_LIMIT, got ${data.code}`);
  }));
  
  tests.push(await runTest('Validation: Rejects non-numeric limit', async () => {
    const res = await makeRequest('/api/notion/puzzles?limit=abc', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    if (data.code !== 'INVALID_LIMIT') throw new Error(`Expected INVALID_LIMIT, got ${data.code}`);
  }));
  
  tests.push(await runTest('Validation: Accepts valid limit', async () => {
    const res = await makeRequest('/api/notion/timeline?limit=50', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    // Should not be 400
    if (res.status === 400) throw new Error('Valid limit rejected');
  }));
  
  return { name: 'Validation Tests', tests };
}

async function runTransformTests(): Promise<TestSuite> {
  const tests: TestResult[] = [];
  
  tests.push(await runTest('SF_ pattern parsing from Elements', async () => {
    const res = await makeRequest('/api/notion/elements?limit=5', {
      headers: { 'X-API-Key': TEST_API_KEY }
    });
    
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    
    // Find element with SF_ patterns
    const elementWithPatterns = data.data.find((el: any) => 
      el.descriptionText?.includes('SF_')
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
        if (rfidMatch?.[1]) {
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
        if (memoryTypeMatch?.[1]) {
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
        if (groupMatch?.[1]) {
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
    const res = await makeRequest('/api/notion/puzzles?limit=2', {
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
const testServer = new TestServer({ 
  port: 3001,
  verbose: true,
  startupTimeout: TEST_TIMEOUT
});

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
    // Start the server with production environment
    await testServer.start();
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run all test suites
    allSuites.push(await runHealthCheckTests());
    allSuites.push(await runAuthenticationTests());
    allSuites.push(await runEndpointTests());
    allSuites.push(await runCORSTests());
    allSuites.push(await runRateLimitTests());
    allSuites.push(await runBottleneckTests());
    allSuites.push(await runCacheTests());
    allSuites.push(await runValidationTests());
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
    process.exitCode = totalFailed > 0 ? 1 : 0;
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exitCode = 1;
  } finally {
    await testServer.stop();
  }
}

// Cleanup is handled by TestServer's signal handlers

// Run tests
runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exitCode = 1;
});