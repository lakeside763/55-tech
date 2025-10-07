#!/usr/bin/env node

/**
 * Manual Testing Script for Arbitrage Detection
 * Run this to test different scenarios quickly
 */

import { calculateArbitrage } from './index';

async function runManualTests() {
  console.log('🧪 Starting Manual Tests for Arbitrage Detection\n');
  
  try {
    // Test 1: Local file analysis
    console.log('📁 TEST 1: Analyzing local file data');
    console.log('=' .repeat(50));
    const localResult = await calculateArbitrage(undefined, true);
    console.log(`✅ Local Test Result: Found ${localResult.analysis.totalOpportunities} opportunities\n`);
    
    // Test 2: API data analysis (if you have valid fixture IDs)
    console.log('🌐 TEST 2: Analyzing API data');
    console.log('=' .repeat(50));
    
    // Add your test fixture IDs here
    const testFixtureIds = [
      'id1000040663594285',
      // Add more fixture IDs for testing
    ];
    
    for (const fixtureId of testFixtureIds) {
      try {
        console.log(`Testing fixture: ${fixtureId}`);
        const apiResult = await calculateArbitrage(fixtureId, false); // Set to false for less verbose output
        console.log(`✅ API Test Result for ${fixtureId}: Found ${apiResult.analysis.totalOpportunities} opportunities`);
        console.log(`   Markets: ${apiResult.analysis.analyzedMarkets}, Bookmakers: ${apiResult.analysis.totalActiveBookmakers}\n`);
      } catch (error) {
        console.log(`❌ API Test Failed for ${fixtureId}: ${error instanceof Error ? error.message : error}\n`);
      }
    }
    
    // Test 3: Performance test
    console.log('⚡ TEST 3: Performance analysis');
    console.log('=' .repeat(50));
    const startTime = Date.now();
    await calculateArbitrage(undefined, false);
    const endTime = Date.now();
    console.log(`✅ Performance Test: Analysis completed in ${endTime - startTime}ms\n`);
    
  } catch (error) {
    console.error('❌ Manual testing failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runManualTests();
}