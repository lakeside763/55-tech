#!/usr/bin/env node

/**
 * Test Data Analysis Script
 * Tests the implementation with different sample data files
 */

import * as fs from 'fs';
import * as path from 'path';
import { calculateArbitrage } from './index';
import { OddsData } from './types';

async function testWithSampleData() {
  console.log('🧪 Testing with Sample Data Files\n');
  
  const testDataDir = path.join(__dirname, '../test-data');
  const testFiles = fs.readdirSync(testDataDir).filter(file => file.endsWith('.json'));
  
  for (const file of testFiles) {
    try {
      console.log(`📄 Testing with: ${file}`);
      console.log('=' .repeat(50));
      
      const filePath = path.join(testDataDir, file);
      const testData: OddsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Temporarily replace the original market-odds.json
      const originalFile = 'market-odds.json';
      const backupFile = 'market-odds.backup.json';
      
      // Backup original
      if (fs.existsSync(originalFile)) {
        fs.copyFileSync(originalFile, backupFile);
      }
      
      // Write test data
      fs.writeFileSync(originalFile, JSON.stringify(testData, null, 2));
      
      // Run analysis
      const result = await calculateArbitrage(undefined, false);
      
      console.log(`✅ Analysis Results for ${file}:`);
      console.log(`   Fixture: ${result.fixture.participant1} vs ${result.fixture.participant2}`);
      console.log(`   Markets: ${result.analysis.analyzedMarkets}`);
      console.log(`   Bookmakers: ${result.analysis.totalActiveBookmakers}`);
      console.log(`   Opportunities: ${result.analysis.totalOpportunities}`);
      
      if (result.analysis.totalOpportunities > 0) {
        const bestProfit = Math.max(...result.analysis.opportunities.map((o: any) => o.arbitragePercentage));
        console.log(`   🎯 Arbitrage found! Best profit: ${bestProfit.toFixed(2)}%`);
      } else {
        console.log(`   📊 No arbitrage opportunities detected`);
      }
      
      // Restore original file
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, originalFile);
        fs.unlinkSync(backupFile);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error testing ${file}:`, error);
    }
  }
}

// Test specific scenarios
async function testEdgeCases() {
  console.log('🔬 Testing Edge Cases\n');
  
  const edgeCases = [
    {
      name: 'Single Bookmaker',
      data: {
        fixtureId: 'edge_case_1',
        participant1Name: 'Team A',
        participant2Name: 'Team B',
        sportName: 'Soccer',
        tournamentName: 'Test',
        bookmakerOdds: {
          'single_bookmaker': {
            bookmakerIsActive: true,
            bookmakerFixtureId: 'test',
            fixturePath: 'test',
            markets: {
              '101': {
                bookmakerMarketId: '101',
                outcomes: {
                  '101': {
                    players: {
                      '0': {
                        active: true,
                        price: 1.5,
                        bookmakerOutcomeId: 'outcome1',
                        changedAt: '2025-10-07T10:00:00Z',
                        playerName: 'Team A'
                      }
                    }
                  },
                  '102': {
                    players: {
                      '0': {
                        active: true,
                        price: 3.0,
                        bookmakerOutcomeId: 'outcome2',
                        changedAt: '2025-10-07T10:00:00Z',
                        playerName: 'Team B'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      name: 'No Active Bookmakers',
      data: {
        fixtureId: 'edge_case_2',
        participant1Name: 'Team A',
        participant2Name: 'Team B',
        sportName: 'Soccer',
        tournamentName: 'Test',
        bookmakerOdds: {
          'inactive_bookmaker': {
            bookmakerIsActive: false,
            bookmakerFixtureId: 'test',
            fixturePath: 'test',
            markets: {}
          }
        }
      }
    }
  ];
  
  for (const testCase of edgeCases) {
    try {
      console.log(`🧩 Testing: ${testCase.name}`);
      
      // Backup and replace data
      const originalFile = 'market-odds.json';
      const backupFile = 'market-odds.backup.json';
      
      if (fs.existsSync(originalFile)) {
        fs.copyFileSync(originalFile, backupFile);
      }
      
      fs.writeFileSync(originalFile, JSON.stringify(testCase.data, null, 2));
      
      const result = await calculateArbitrage(undefined, false);
      console.log(`   ✅ Handled gracefully: ${result.analysis.totalOpportunities} opportunities found`);
      
      // Restore
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, originalFile);
        fs.unlinkSync(backupFile);
      }
      
    } catch (error) {
      console.error(`   ❌ Error in ${testCase.name}:`, error);
    }
  }
}

if (require.main === module) {
  (async () => {
    await testWithSampleData();
    await testEdgeCases();
    console.log('🎉 All tests completed!');
  })();
}