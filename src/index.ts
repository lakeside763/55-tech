import 'dotenv/config';
import { analyzeMarket, analyzeMarketTopK, getActiveBookmakers, getAllMarkets, loadOddsData } from "./core";
import { ArbitrageAnalysisResult, ArbitrageOpportunity } from "./types";
import { displayResults, exportToJson } from "./utils";

export async function calculateArbitrage(
  fixtureId?: string, 
  topk?: number, 
  verbose: boolean = false
): Promise<ArbitrageAnalysisResult> {
  try {
    // Load odds data (from API if fixtureId provided, otherwise from file)
    const oddsData = await loadOddsData(fixtureId);
    
    if (verbose) {
      console.log(`Data source: ${fixtureId ? `API (fixture: ${fixtureId})` : 'Local file (market-data.json)'}`);
      console.log(`Analyzing fixture: ${oddsData.participant1Name} vs ${oddsData.participant2Name}`);
      console.log(`Tournament: ${oddsData.tournamentName} (${oddsData.sportName})`);
    }

    if (!oddsData.bookmakerOdds || Object.keys(oddsData.bookmakerOdds).length === 0) {
      throw new Error('No bookmaker odds data available. The fixture may have finished or not started yet.');
    }

    // Get active bookmakers
    const activeBookmakers = getActiveBookmakers(oddsData);
    
    if (verbose) {
      console.log(`Active bookmakers: ${activeBookmakers.join(', ')}`);
    }

    // Get all available markets
    const allMarkets = getAllMarkets(oddsData, activeBookmakers);
    
    if (verbose) {
      console.log(`Available markets: ${Array.from(allMarkets).join(', ')}`);
    }

    // Analyze each market for arbitrage opportunities
    const arbitrageOpportunities: ArbitrageOpportunity[] = [];

    if (topk && topk > 1) {
      allMarkets.forEach(marketId => {
        const opportunity = analyzeMarketTopK(marketId, oddsData, activeBookmakers, {
          topk: topk || 3,
          verbose: true,
          includeBetDistribution: true,
          maxResults: 20,
        });
        if (opportunity.length > 0) {
          arbitrageOpportunities.push(...opportunity);
        }
      });
    } else {
      allMarkets.forEach(marketId => {
        const opportunity = analyzeMarket(marketId, oddsData, activeBookmakers, verbose);
        if (opportunity) {
          arbitrageOpportunities.push(opportunity);
        }
      });
    }

    // Return structured result
    return {
      fixture: {
        fixtureId: oddsData.fixtureId,
        participant1: oddsData.participant1Name,
        participant2: oddsData.participant2Name,
        tournament: oddsData.tournamentName,
        sport: oddsData.sportName
      },
      analysis: {
        analyzedMarkets: allMarkets.size,
        totalActiveBookmakers: activeBookmakers.length,
        totalOpportunities: arbitrageOpportunities.length,
        opportunities: arbitrageOpportunities
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Arbitrage calculation failed: ${errorMessage}`);
  }
}

if (require.main === module) {
  (async () => {
    try {
      // Run analysis with verbose output
      // Default to local file loading to avoid API issues

      // To test API loading, uncomment the line below:
      const fixtureId = undefined; // and pass fixtureId to calculateArbitrage - id1000232463448499
      const topk = 3; // Set desired top-K value or null for standard analysis
      const result = await calculateArbitrage(fixtureId, topk, false);

      // Display formatted results
      displayResults(result);
      
      // Export to JSON
      const filename = topk && topk > 1 ? `./src/arbitrage-results-topk.json` : './src/arbitrage-results.json';
      exportToJson(result, filename);

      console.log(`
        ${topk && topk > 1 ? `Top-${topk} Market analysis` : 'Best odds Market analysis'} completed.
        Markets analyzed: ${result.analysis.analyzedMarkets}, 
        Active bookmakers: ${result.analysis.totalActiveBookmakers}, 
        Opportunities found: ${result.analysis.totalOpportunities}
      `);
        
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      process.exit(1);
    }
  })();
}