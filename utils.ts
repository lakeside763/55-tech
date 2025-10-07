import * as fs from 'fs';
import { ArbitrageAnalysisResult } from "./types";

/**
 * Displays arbitrage analysis results in a formatted way
 */
export function displayResults(result: ArbitrageAnalysisResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('ARBITRAGE ANALYSIS SUMMARY');
  console.log('='.repeat(80));

  console.log(`Fixture: ${result.fixture.participant1} vs ${result.fixture.participant2}`);
  console.log(`Tournament: ${result.fixture.tournament} (${result.fixture.sport})`);
  console.log(`Markets analyzed: ${result.analysis.analyzedMarkets}`);
  console.log(`Active bookmakers: ${result.analysis.totalActiveBookmakers}`);
  console.log(`Opportunities found: ${result.analysis.totalOpportunities}\n`);

  if (result.analysis.totalOpportunities === 0) {
    console.log('No arbitrage opportunities found.');
    return;
  }

  result.analysis.opportunities.forEach((opportunity, index) => {
    console.log(`${index + 1}. Market ${opportunity.market}`);
    console.log(`   Profit: ${opportunity.arbitragePercentage.toFixed(2)}%`);
    console.log(`   Total Implied Probability: ${(opportunity.totalImpliedProbability * 100).toFixed(2)}%`);
    console.log(`   Optimal Bet Distribution (for $100 total):`);
    
    opportunity.betDistribution.forEach(bet => {
      const outcome = opportunity.outcomes.find(o => o.outcomeId === bet.outcomeId);
      console.log(`     - Outcome ${bet.outcomeId}: $${bet.requiredStake.toFixed(2)} at ${bet.bookmaker} (odds: ${outcome?.odds})`);
    });
    
    const guaranteedProfit = 100 * (opportunity.arbitragePercentage / 100);
    console.log(`   Guaranteed Profit: $${guaranteedProfit.toFixed(2)} on $100 stake\n`);
  });
}

/**
 * Exports results to JSON file
 */
export function exportToJson(result: ArbitrageAnalysisResult, fileName: string = 'market-arbitrage-results.json'): void {
  try {
    fs.writeFileSync(fileName, JSON.stringify(result, null, 2));
    console.log(`Results exported to ${fileName}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to export results: ${errorMessage}`);
  }
}