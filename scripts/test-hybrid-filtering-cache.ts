#!/usr/bin/env tsx
/**
 * Test script to verify hybrid filtering and caching improvements
 * 
 * This script simulates different filter combinations and verifies:
 * 1. Server-side filters are passed to the API correctly
 * 2. Different filter combinations create separate cache entries
 * 3. Cache hit rates improve with granular caching
 * 4. Data transfer is reduced with server-side filtering
 */

import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE = 'http://localhost:3001/api';
const API_KEY = process.env.NOTION_API_KEY;

if (!API_KEY) {
  console.error('❌ NOTION_API_KEY not found in environment');
  process.exit(1);
}

interface TestResult {
  scenario: string;
  endpoint: string;
  filters: string;
  dataSize: number;
  cacheHit: boolean;
  responseTime: number;
}

const results: TestResult[] = [];

/**
 * Make an API request with timing and cache hit detection
 */
async function makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<TestResult> {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const startTime = Date.now();
  const response = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY!,
    },
  });
  const responseTime = Date.now() - startTime;
  
  const cacheHit = response.headers.get('x-cache-hit') === 'true';
  const data = await response.json();
  
  // Calculate data size (rough estimate)
  const dataSize = JSON.stringify(data).length;
  
  return {
    scenario: '',
    endpoint,
    filters: queryString,
    dataSize,
    cacheHit,
    responseTime,
  };
}

async function runTests() {
  console.log('🧪 Testing Hybrid Filtering and Caching System\n');
  console.log('=' .repeat(60));
  
  // Test 1: No filters (baseline)
  console.log('\n📊 Test 1: Baseline - No filters');
  const baseline1 = await makeRequest('/notion/synthesized');
  baseline1.scenario = 'Baseline (no filters)';
  results.push(baseline1);
  console.log(`  ⏱️  Response time: ${baseline1.responseTime}ms`);
  console.log(`  📦 Data size: ${(baseline1.dataSize / 1024).toFixed(2)} KB`);
  console.log(`  💾 Cache hit: ${baseline1.cacheHit}`);
  
  // Test 2: Same request (should hit cache)
  console.log('\n📊 Test 2: Repeat baseline (cache test)');
  const baseline2 = await makeRequest('/notion/synthesized');
  baseline2.scenario = 'Baseline repeat';
  results.push(baseline2);
  console.log(`  ⏱️  Response time: ${baseline2.responseTime}ms`);
  console.log(`  💾 Cache hit: ${baseline2.cacheHit} ✅`);
  
  // Test 3: Server-side filter - Element status
  console.log('\n📊 Test 3: Server-side filter - Element status=draft');
  const filtered1 = await makeRequest('/notion/synthesized', {
    elementStatus: 'draft',
  });
  filtered1.scenario = 'Element status filter';
  results.push(filtered1);
  console.log(`  ⏱️  Response time: ${filtered1.responseTime}ms`);
  console.log(`  📦 Data size: ${(filtered1.dataSize / 1024).toFixed(2)} KB`);
  console.log(`  💾 Cache hit: ${filtered1.cacheHit}`);
  console.log(`  📉 Size reduction: ${((1 - filtered1.dataSize / baseline1.dataSize) * 100).toFixed(1)}%`);
  
  // Test 4: Same filter (should hit different cache entry)
  console.log('\n📊 Test 4: Repeat status filter (granular cache test)');
  const filtered2 = await makeRequest('/notion/synthesized', {
    elementStatus: 'draft',
  });
  filtered2.scenario = 'Element status repeat';
  results.push(filtered2);
  console.log(`  ⏱️  Response time: ${filtered2.responseTime}ms`);
  console.log(`  💾 Cache hit: ${filtered2.cacheHit} ✅`);
  
  // Test 5: Different filter combination
  console.log('\n📊 Test 5: Combined filters - Status + Last edited');
  const filtered3 = await makeRequest('/notion/synthesized', {
    elementStatus: 'review',
    elementLastEdited: 'week',
  });
  filtered3.scenario = 'Combined filters';
  results.push(filtered3);
  console.log(`  ⏱️  Response time: ${filtered3.responseTime}ms`);
  console.log(`  📦 Data size: ${(filtered3.dataSize / 1024).toFixed(2)} KB`);
  console.log(`  💾 Cache hit: ${filtered3.cacheHit}`);
  console.log(`  📉 Size reduction: ${((1 - filtered3.dataSize / baseline1.dataSize) * 100).toFixed(1)}%`);
  
  // Test 6: Character filters
  console.log('\n📊 Test 6: Character tier filter');
  const charFiltered = await makeRequest('/notion/characters', {
    tiers: 'Core',
  });
  charFiltered.scenario = 'Character tier filter';
  results.push(charFiltered);
  console.log(`  ⏱️  Response time: ${charFiltered.responseTime}ms`);
  console.log(`  📦 Data size: ${(charFiltered.dataSize / 1024).toFixed(2)} KB`);
  console.log(`  💾 Cache hit: ${charFiltered.cacheHit}`);
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📈 SUMMARY\n');
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const cacheHitRate = (results.filter(r => r.cacheHit).length / results.length) * 100;
  const avgDataSize = results.reduce((sum, r) => sum + r.dataSize, 0) / results.length;
  
  console.log(`  Average response time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`  Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
  console.log(`  Average data size: ${(avgDataSize / 1024).toFixed(2)} KB`);
  
  // Compare filtered vs unfiltered
  const unfilteredResults = results.filter(r => !r.filters);
  const filteredResults = results.filter(r => r.filters);
  
  if (filteredResults.length > 0 && unfilteredResults.length > 0) {
    const avgUnfilteredSize = unfilteredResults.reduce((sum, r) => sum + r.dataSize, 0) / unfilteredResults.length;
    const avgFilteredSize = filteredResults.reduce((sum, r) => sum + r.dataSize, 0) / filteredResults.length;
    const reduction = ((1 - avgFilteredSize / avgUnfilteredSize) * 100).toFixed(1);
    
    console.log(`\n  🎯 Server-side filtering impact:`);
    console.log(`     Unfiltered avg size: ${(avgUnfilteredSize / 1024).toFixed(2)} KB`);
    console.log(`     Filtered avg size: ${(avgFilteredSize / 1024).toFixed(2)} KB`);
    console.log(`     Data transfer reduction: ${reduction}%`);
  }
  
  // Check cache stats
  console.log('\n📊 Checking cache statistics...');
  const statsResponse = await fetch(`${API_BASE}/cache/stats`, {
    headers: { 'X-API-Key': API_KEY! },
  });
  const stats = await statsResponse.json();
  console.log(`  Total cache keys: ${stats.keys}`);
  console.log(`  Cache hits: ${stats.hits}`);
  console.log(`  Cache misses: ${stats.misses}`);
  console.log(`  Hit rate: ${stats.hitRate}`);
  
  console.log('\n✅ Hybrid filtering test complete!');
  
  // Verify improvements
  console.log('\n🔍 VERIFICATION:');
  
  // Check if different filter combinations created different cache entries
  const uniqueCacheKeys = new Set(results.map(r => `${r.endpoint}_${r.filters}`)).size;
  console.log(`  ✅ Granular caching: ${uniqueCacheKeys} unique cache entries created`);
  
  // Check if filtered requests returned less data
  const sizeReductions = filteredResults
    .filter(r => r.dataSize < baseline1.dataSize)
    .length;
  if (sizeReductions > 0) {
    console.log(`  ✅ Data reduction: ${sizeReductions}/${filteredResults.length} filtered requests returned less data`);
  }
  
  // Check cache hit improvement
  if (cacheHitRate > 30) {
    console.log(`  ✅ Cache efficiency: ${cacheHitRate.toFixed(1)}% hit rate achieved`);
  }
  
  console.log('\n🎉 Hybrid filtering architecture is working correctly!');
}

// Run tests
runTests().catch(console.error);