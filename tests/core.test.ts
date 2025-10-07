import { 
  getActiveBookmakers, 
  getAllMarkets, 
  getMarketOutcomes, 
  analyzeMarket 
} from '../core';
import { OddsData } from '../types';

// Mock data for testing
const mockOddsData: OddsData = {
  fixtureId: "test_fixture_123",
  participant1Name: "Team A",
  participant2Name: "Team B", 
  sportName: "Soccer",
  tournamentName: "Test League",
  bookmakerOdds: {
    "bookmaker1": {
      bookmakerIsActive: true,
      bookmakerFixtureId: "test_123",
      fixturePath: "test-path",
      markets: {
        "101": {
          bookmakerMarketId: "101",
          outcomes: {
            "101": {
              players: {
                "0": {
                  active: true,
                  price: 2.5,
                  bookmakerOutcomeId: "outcome_101",
                  changedAt: "2025-10-07T10:00:00Z",
                  playerName: "Team A"
                }
              }
            },
            "102": {
              players: {
                "0": {
                  active: true,
                  price: 2.5,
                  bookmakerOutcomeId: "outcome_102", 
                  changedAt: "2025-10-07T10:00:00Z",
                  playerName: "Team B"
                }
              }
            }
          }
        }
      }
    },
    "bookmaker2": {
      bookmakerIsActive: true,
      bookmakerFixtureId: "test_123",
      fixturePath: "test-path-2",
      markets: {
        "101": {
          bookmakerMarketId: "101",
          outcomes: {
            "101": {
              players: {
                "0": {
                  active: true,
                  price: 2.1,
                  bookmakerOutcomeId: "outcome_101_b2",
                  changedAt: "2025-10-07T10:00:00Z",
                  playerName: "Team A"
                }
              }
            },
            "102": {
              players: {
                "0": {
                  active: true,
                  price: 2.1,
                  bookmakerOutcomeId: "outcome_102_b2",
                  changedAt: "2025-10-07T10:00:00Z", 
                  playerName: "Team B"
                }
              }
            }
          }
        }
      }
    },
    "inactive_bookmaker": {
      bookmakerIsActive: false,
      bookmakerFixtureId: "test_123",
      fixturePath: "inactive-path",
      markets: {}
    }
  }
};

describe('Core Arbitrage Functions', () => {
  
  describe('getActiveBookmakers', () => {
    test('should return only active bookmakers', () => {
      const activeBookmakers = getActiveBookmakers(mockOddsData);
      
      expect(activeBookmakers).toHaveLength(2);
      expect(activeBookmakers).toContain('bookmaker1');
      expect(activeBookmakers).toContain('bookmaker2');
      expect(activeBookmakers).not.toContain('inactive_bookmaker');
    });

    test('should return empty array when no active bookmakers', () => {
      const dataWithNoActiveBookmakers: OddsData = {
        ...mockOddsData,
        bookmakerOdds: {
          "inactive1": { ...mockOddsData.bookmakerOdds.inactive_bookmaker }
        }
      };
      
      const result = getActiveBookmakers(dataWithNoActiveBookmakers);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAllMarkets', () => {
    test('should return all unique markets from active bookmakers', () => {
      const activeBookmakers = getActiveBookmakers(mockOddsData);
      const markets = getAllMarkets(mockOddsData, activeBookmakers);
      
      expect(markets.size).toBe(1);
      expect(markets.has('101')).toBe(true);
    });

    test('should ignore markets from inactive bookmakers', () => {
      const allBookmakers = Object.keys(mockOddsData.bookmakerOdds);
      const markets = getAllMarkets(mockOddsData, allBookmakers);
      
      // Should still only return markets from active bookmakers
      expect(markets.size).toBe(1);
    });
  });

  describe('getMarketOutcomes', () => {
    test('should return all outcomes for a specific market', () => {
      const activeBookmakers = getActiveBookmakers(mockOddsData);
      const outcomes = getMarketOutcomes('101', mockOddsData, activeBookmakers);
      
      expect(outcomes.size).toBe(2);
      expect(outcomes.has('101')).toBe(true);
      expect(outcomes.has('102')).toBe(true);
    });

    test('should return empty set for non-existent market', () => {
      const activeBookmakers = getActiveBookmakers(mockOddsData);
      const outcomes = getMarketOutcomes('999', mockOddsData, activeBookmakers);
      
      expect(outcomes.size).toBe(0);
    });
  });

  describe('analyzeMarket', () => {
    test('should detect arbitrage opportunity with favorable odds', () => {
      // Create data with clear arbitrage opportunity
      const arbitrageData: OddsData = {
        ...mockOddsData,
        bookmakerOdds: {
          "bookmaker1": {
            ...mockOddsData.bookmakerOdds.bookmaker1,
            markets: {
              "101": {
                bookmakerMarketId: "101",
                outcomes: {
                  "101": {
                    players: {
                      "0": {
                        active: true,
                        price: 2.2, // High odds for Team A
                        bookmakerOutcomeId: "outcome_101",
                        changedAt: "2025-10-07T10:00:00Z",
                        playerName: "Team A"
                      }
                    }
                  },
                  "102": {
                    players: {
                      "0": {
                        active: true,
                        price: 2.2, // High odds for Team B  
                        bookmakerOutcomeId: "outcome_102",
                        changedAt: "2025-10-07T10:00:00Z",
                        playerName: "Team B"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const activeBookmakers = getActiveBookmakers(arbitrageData);
      const opportunity = analyzeMarket('101', arbitrageData, activeBookmakers, false);
      
      expect(opportunity).not.toBeNull();
      if (opportunity) {
        expect(opportunity.arbitragePercentage).toBeGreaterThan(0);
        expect(opportunity.totalImpliedProbability).toBeLessThan(1);
        expect(opportunity.betDistribution).toHaveLength(2);
      }
    });

    test('should return null when no arbitrage opportunity exists', () => {
      const activeBookmakers = getActiveBookmakers(mockOddsData);
      const opportunity = analyzeMarket('101', mockOddsData, activeBookmakers, false);
      
      // With odds of 2.5 and 2.1, implied probabilities are too high for arbitrage
      expect(opportunity).toBeNull();
    });

    test('should return null for market with less than 2 outcomes', () => {
      const singleOutcomeData: OddsData = {
        ...mockOddsData,
        bookmakerOdds: {
          "bookmaker1": {
            ...mockOddsData.bookmakerOdds.bookmaker1,
            markets: {
              "101": {
                bookmakerMarketId: "101",
                outcomes: {
                  "101": {
                    players: {
                      "0": {
                        active: true,
                        price: 1.5,
                        bookmakerOutcomeId: "outcome_101",
                        changedAt: "2025-10-07T10:00:00Z",
                        playerName: "Team A"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const activeBookmakers = getActiveBookmakers(singleOutcomeData);
      const opportunity = analyzeMarket('101', singleOutcomeData, activeBookmakers, false);
      
      expect(opportunity).toBeNull();
    });
  });

});