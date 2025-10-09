import * as fs from 'fs';
import axios from 'axios';
import { AnalyzeOptions, ArbitrageOpportunity, OddsData, OddsOption, OutcomeOddsMap } from "./types";
import { roundTo2, roundTo4 } from './utils';

// Configuration for API calls
const BASE_URL = process.env.BASE_URL || 'https://api.oddspapi.io';
const API_KEY = process.env.API_KEY || '';

/**
 * Loads odds data either from API (if fixtureId provided) or from local file
 */
export async function loadOddsData(fixtureId?: string): Promise<OddsData> {
  if (fixtureId) {
    console.log('Fetching odds data from API...');
    return await fetchMarketOddsFromAPI(fixtureId);
  } else {
    return loadOddsDataFromFile();
  }
}

/**
 * Fetches odds data from API for a specific fixture
 * Returns data in the same format as market-data.json
 */
async function fetchMarketOddsFromAPI(fixtureId: string): Promise<OddsData> {
  try {
    const response = await axios.get(`${BASE_URL}/v4/odds`, {
      params: {
        fixtureId: fixtureId,
        oddsFormat: 'decimal',
        verbosity: 3,
        apiKey: API_KEY
      }
    });

    // Return the data directly as it should match OddsData format
    return response.data;

  } catch (error) {
    console.log('API fetch failed, falling back to local file...');
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const statusText = error.response?.statusText;
      console.warn(`API Error: ${statusCode} ${statusText}`);
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`API Error: ${errorMessage}`);
    }
    
    // Fall back to local file
    return loadOddsDataFromFile();
  }
}

/**
 * Loads odds data from local JSON file
 */
function loadOddsDataFromFile(): OddsData {
  const fileName = './src/market-data.json';
  
  try {
    const rawData = fs.readFileSync(fileName, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Odds data file not found: ${fileName}. Please ensure the file exists or provide a fixtureId to fetch from API.`);
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load odds data from ${fileName}: ${errorMessage}`);
  }
}

/**
 * Extracts all active bookmakers from the odds data
 */
export function getActiveBookmakers(oddsData: OddsData): string[] {
  return Object.entries(oddsData.bookmakerOdds)
    .filter(([name, bookmaker]) => bookmaker.bookmakerIsActive)
    .map(([name]) => name);
}

/**
 * Extracts all available markets across all bookmakers
 */
export function getAllMarkets(oddsData: OddsData, activeBookmakers: string[]): Set<string> {
  const allMarkets = new Set<string>();
  
  activeBookmakers.forEach(bookmakerName => {
    const bookmaker = oddsData.bookmakerOdds[bookmakerName];
    Object.keys(bookmaker.markets).forEach(marketId => {
        allMarkets.add(marketId);
    });
  });
  
  return allMarkets;
}

/**
 * Gets all possible outcomes for a specific market
 */
export function getMarketOutcomes(marketId: string, oddsData: OddsData, activeBookmakers: string[]): Set<string> {
  const marketOutcomes = new Set<string>();
  
  activeBookmakers.forEach(bookmakerName => {
      const bookmaker = oddsData.bookmakerOdds[bookmakerName];
      if (bookmaker.markets[marketId]) {
        Object.keys(bookmaker.markets[marketId].outcomes).forEach(outcomeId => {
          marketOutcomes.add(outcomeId);
        });
      }
  });
  
  return marketOutcomes;
}

/**
 * Finds the best odds for each outcome across all bookmakers
 */
function findBestOdds(
    marketId: string, 
    marketOutcomes: Set<string>, 
    oddsData: OddsData, 
    activeBookmakers: string[]
): { [outcomeId: string]: { bookmaker: string; odds: number; } } {
    const bestOdds: { [outcomeId: string]: { bookmaker: string; odds: number; } } = {};

    marketOutcomes.forEach(outcomeId => {
      let bestOdd = 0;
      let bestBookmaker = '';

      activeBookmakers.forEach(bookmakerName => {
        const bookmaker = oddsData.bookmakerOdds[bookmakerName];
        const market = bookmaker.markets[marketId];
        
        if (market && market.outcomes[outcomeId]) {
          const outcome = market.outcomes[outcomeId];
          const player = outcome.players["0"];
          
          if (player && player.active && player.price > bestOdd) {
            bestOdd = player.price;
            bestBookmaker = bookmakerName;
          }
        }
      });

      if (bestBookmaker) {
        bestOdds[outcomeId] = { bookmaker: bestBookmaker, odds: bestOdd };
      }
    });

    return bestOdds;
}

/**
 * Calculates arbitrage opportunity from odds data
 */
function calculateArbitrageForMarket(
    marketId: string,
    bestOdds: { [outcomeId: string]: { bookmaker: string; odds: number; } }
): ArbitrageOpportunity | null {
  const impliedProbabilities = Object.entries(bestOdds).map(([outcomeId, data]) => ({
    outcomeId,
    bookmaker: data.bookmaker,
    odds: data.odds,
    impliedProbability: roundTo4(1 / data.odds)
  }));

  let totalImpliedProbability = impliedProbabilities.reduce(
    (sum, item) => sum + item.impliedProbability, 
    0
  );
  totalImpliedProbability = roundTo4(totalImpliedProbability);

  // Check if arbitrage opportunity exists (total implied probability < 1)
  if (totalImpliedProbability >= 1.0) {
    return null;
  }

  const arbitragePercentage = roundTo2(((1 - totalImpliedProbability) / totalImpliedProbability) * 100);

  // Calculate optimal bet distribution for $100 total stake
  const betDistribution = impliedProbabilities.map(item => {
    const betPercentage = roundTo2((item.impliedProbability / totalImpliedProbability) * 100);
    return {
      outcomeId: item.outcomeId,
      bookmaker: item.bookmaker,
      betPercentage,
      requiredStake: betPercentage
    };
  });

  return {
    market: marketId,
    outcomes: impliedProbabilities,
    totalImpliedProbability,
    arbitragePercentage,
    betDistribution
  };
}

/**
 * Analyzes a single market for arbitrage opportunities
 */
export function analyzeMarket(
    marketId: string,
    oddsData: OddsData,
    activeBookmakers: string[],
    verbose: boolean = false
): ArbitrageOpportunity | null {
  if (verbose) {
    console.log(`\n--- Analyzing Market ${marketId} ---`);
  }

  // Get all possible outcomes for this market
  const marketOutcomes = getMarketOutcomes(marketId, oddsData, activeBookmakers);

  if (marketOutcomes.size < 2) {
    if (verbose) {
      console.log(`Market ${marketId} has less than 2 outcomes, skipping`);
    }
    return null;
  }

  if (verbose) {
    console.log(`Market ${marketId} outcomes: ${Array.from(marketOutcomes).join(', ')}`);
  }

  // Find best odds for each outcome
  const bestOdds = findBestOdds(marketId, marketOutcomes, oddsData, activeBookmakers);

  // Check if we have odds for all outcomes
  if (Object.keys(bestOdds).length !== marketOutcomes.size) {
    if (verbose) {
      console.log(`Not all outcomes have odds available for market ${marketId}`);
    }
    return null;
  }

  if (verbose) {
    Object.entries(bestOdds).forEach(([outcomeId, data]) => {
      console.log(`Best odds for outcome ${outcomeId}: ${data.odds} at ${data.bookmaker}`);
    });
  }

  // Calculate arbitrage opportunity
  const opportunity = calculateArbitrageForMarket(marketId, bestOdds);

  if (verbose) {
    const totalImpliedProbability = Object.values(bestOdds)
      .reduce((sum, data) => sum + (1 / data.odds), 0);
    
    console.log(`Total implied probability: ${(totalImpliedProbability * 100).toFixed(2)}%`);
    
    if (opportunity) {
      console.log(`🎯 ARBITRAGE OPPORTUNITY FOUND! Profit: ${opportunity.arbitragePercentage.toFixed(2)}%`);
    } else {
      console.log(`No arbitrage opportunity in market ${marketId}`);
    }
  }

  return opportunity;
}


/**
 * 1 Collects odds per outcome across bookmakers and limits to Top-K.
 */
export function buildTopOutcomeOddsMap(
  marketId: string,
  oddsData: OddsData,
  activeBookmakers: string[],
  topK: number = 3
): OutcomeOddsMap {
  const marketOutcomes = getMarketOutcomes(marketId, oddsData, activeBookmakers);
  const outcomesOdds: OutcomeOddsMap = {};

  for (const outcomeId of marketOutcomes) {
    const allOdds: OddsOption[] = [];

    for (const bookmakerName of activeBookmakers) {
      const market = oddsData.bookmakerOdds[bookmakerName].markets[marketId];
      const player = market?.outcomes[outcomeId]?.players["0"];

      if (player && player.active && player.price > 1) {
        allOdds.push({ bookmaker: bookmakerName, odds: player.price });
      }
    }

    // Sort odds descending odds and limit to Top-K
    outcomesOdds[outcomeId] = allOdds
      .sort((a, b) => b.odds - a.odds)
      .slice(0, topK);
  }

  return outcomesOdds;
}

/**
 * 2️ Generic Cartesian-product generator (iterative, not recursive).
 */
export function generateCombinations<T>(
  arrays: T[][],
  maxCombinations: number = 10000
): T[][] {
  const totalCombinations = arrays.reduce((acc, curr) => acc * curr.length, 1);

  if (totalCombinations > maxCombinations) {
    console.warn(`Warning: Generating ${totalCombinations} combinations exceeds the limit of ${maxCombinations}. Aborting.`);
    return [];
  }

  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

/**
 * 3 Evaluates all bookmaker combinations for arbitrage opportunities.
 */
export function evaluateCombinations(
  marketId: string,
  outcomeIds: string[],
  combos: OddsOption[][],
  includeBetDistribution = false
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const combo of combos) {
    const impliedSum = combo.reduce((sum, option) => sum + (1 / option.odds), 0);

    if (impliedSum < 1) {
      const arbitragePercentage = ((1 - impliedSum) / impliedSum) * 100;

      const outcomes = combo.map((option, i) => ({
        outcomeId: outcomeIds[i],
        bookmaker: option.bookmaker,
        odds: option.odds,
        impliedProbability: parseFloat((1 / option.odds).toFixed(4))
      }));

      let betDistribution: any[] = [];
      if (includeBetDistribution) {
        betDistribution = outcomes.map(item => ({
          outcomeId: item.outcomeId,
          bookmaker: item.bookmaker,
          betPercentage: parseFloat(((item.impliedProbability / impliedSum) * 100).toFixed(2)),
          requiredStake: parseFloat(((item.impliedProbability / impliedSum) * 100).toFixed(2)) // Assuming $100 total stake
        }))
      }

      opportunities.push({
        market: marketId,
        outcomes,
        totalImpliedProbability: parseFloat(impliedSum.toFixed(4)),
        arbitragePercentage: parseFloat(arbitragePercentage.toFixed(2)),
        betDistribution
      });
    }
  }

  return opportunities;
}

export function analyzeMarketTopK(
  marketId: string,
  oddsData: OddsData,
  activeBookmakers: string[],
  options: AnalyzeOptions = {
    topk: 3,
    maxResults: 5,
    verbose: false,
    includeBetDistribution: false
  }
): ArbitrageOpportunity[] {
  let { topk, maxResults, verbose, includeBetDistribution } = options;

  topk = Math.min(Math.max(topk || 3, 1), 3); // Clamp between 1 and 3
  maxResults = Math.min(Math.max(maxResults || 5, 1), 5); // Clamp between 1 and 5

  if (verbose) {
    console.log(`Building outcome odds map for market ${marketId}...`);
  }

  const outcomeOdds = buildTopOutcomeOddsMap(marketId, oddsData, activeBookmakers, topk);
  const outcomeIds = Object.keys(outcomeOdds);

  if (verbose) {
    console.log(`\nAnalyzing market ${marketId} with Top-${topk} odds per outcome.`);
  }

  const oddsArrays = outcomeIds.map(oId => outcomeOdds[oId]);
  const allCombinations = generateCombinations(oddsArrays);

  if (verbose) {
    console.log(`Total combinations to evaluate: ${allCombinations.length}`);
  }

  // Evaluate each combination
  const opportunities = evaluateCombinations(marketId, outcomeIds, allCombinations, includeBetDistribution);

  // Sort by best arbitrage percentage and optionally limit
  const sorted = opportunities.sort((a, b) => b.arbitragePercentage - a.arbitragePercentage);
  return sorted.slice(0, maxResults);
}
