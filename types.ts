export interface Player {
  active: boolean;
  price: number;
  bookmakerOutcomeId: string;
  changedAt: string;
  limit?: number;
  playerName: string | null;
}

export interface Outcome {
  players: {
    [playerId: string]: Player;
  };
}

export interface Market {
  outcomes: {
    [outcomeId: string]: Outcome;
  };
  bookmakerMarketId: string;
}

export interface Bookmaker {
  bookmakerIsActive: boolean;
  bookmakerFixtureId: string;
  fixturePath: string;
  markets: {
    [marketId: string]: Market;
  };
}

export interface OddsData {
  fixtureId: string;
  participant1Name: string;
  participant2Name: string;
  sportName: string;
  tournamentName: string;
  bookmakerOdds: {
    [bookmakerName: string]: Bookmaker;
  };
}

export interface ArbitrageOpportunity {
  market: string;
  outcomes: {
    outcomeId: string;
    bookmaker: string;
    odds: number;
    impliedProbability: number;
  }[];
  totalImpliedProbability: number;
  arbitragePercentage: number;
  betDistribution: {
    outcomeId: string;
    bookmaker: string;
    betPercentage: number;
    requiredStake: number;
  }[];
}

export interface ArbitrageAnalysisResult {
  fixture: {
    fixtureId: string;
    participant1: string;
    participant2: string;
    tournament: string;
    sport: string;
  };
  analysis: {
    analyzedMarkets: number;
    totalActiveBookmakers: number;
    totalOpportunities: number;
    opportunities: ArbitrageOpportunity[];
  };
  timestamp: string;
}