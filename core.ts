import * as fs from 'fs';
import axios from 'axios';
import { ArbitrageOpportunity, OddsData } from "./types";

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
  const fileName = 'market-odds-data.json';
  
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
    impliedProbability: 1 / data.odds
  }));

  const totalImpliedProbability = impliedProbabilities.reduce(
    (sum, item) => sum + item.impliedProbability, 
    0
  );

  // Check if arbitrage opportunity exists (total implied probability < 1)
  if (totalImpliedProbability >= 1.0) {
    return null;
  }

  const arbitragePercentage = ((1 - totalImpliedProbability) / totalImpliedProbability) * 100;

  // Calculate optimal bet distribution for $100 total stake
  const betDistribution = impliedProbabilities.map(item => {
    const betPercentage = (item.impliedProbability / totalImpliedProbability) * 100;
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