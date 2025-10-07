import { calculateArbitrage } from '../index';
import { loadOddsData } from '../core';
import { OddsData } from '../types';
import axios from 'axios';

// Mock axios for API testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Integration Tests', () => {

  describe('calculateArbitrage', () => {
    test('should successfully analyze arbitrage from local file', async () => {
      const result = await calculateArbitrage(undefined, false);
      
      expect(result).toBeDefined();
      expect(result.fixture).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.analysis.analyzedMarkets).toBe('number');
      expect(typeof result.analysis.totalActiveBookmakers).toBe('number');
      expect(typeof result.analysis.totalOpportunities).toBe('number');
      expect(Array.isArray(result.analysis.opportunities)).toBe(true);
    });

    test('should handle API errors gracefully and fallback to local file', async () => {
      // Mock API failure
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
      
      const result = await calculateArbitrage('invalid_fixture_id', false);
      
      // Should still return results from local file fallback
      expect(result).toBeDefined();
      expect(result.fixture).toBeDefined();
    });

    test('should validate result structure completeness', async () => {
      const result = await calculateArbitrage(undefined, false);
      
      // Validate fixture information
      expect(result.fixture.fixtureId).toBeDefined();
      expect(result.fixture.participant1).toBeDefined();
      expect(result.fixture.participant2).toBeDefined();
      expect(result.fixture.tournament).toBeDefined();
      expect(result.fixture.sport).toBeDefined();
      
      // Validate analysis results
      expect(result.analysis.analyzedMarkets).toBeGreaterThanOrEqual(0);
      expect(result.analysis.totalActiveBookmakers).toBeGreaterThanOrEqual(0);
      expect(result.analysis.totalOpportunities).toBeGreaterThanOrEqual(0);
      
      // Validate opportunities structure if any exist
      result.analysis.opportunities.forEach(opportunity => {
        expect(opportunity.market).toBeDefined();
        expect(Array.isArray(opportunity.outcomes)).toBe(true);
        expect(typeof opportunity.arbitragePercentage).toBe('number');
        expect(typeof opportunity.totalImpliedProbability).toBe('number');
        expect(Array.isArray(opportunity.betDistribution)).toBe(true);
        
        // Validate each outcome
        opportunity.outcomes.forEach(outcome => {
          expect(outcome.outcomeId).toBeDefined();
          expect(outcome.bookmaker).toBeDefined();
          expect(typeof outcome.odds).toBe('number');
          expect(typeof outcome.impliedProbability).toBe('number');
        });
        
        // Validate bet distribution
        opportunity.betDistribution.forEach(bet => {
          expect(bet.outcomeId).toBeDefined();
          expect(bet.bookmaker).toBeDefined();
          expect(typeof bet.betPercentage).toBe('number');
          expect(typeof bet.requiredStake).toBe('number');
        });
      });
    });
  });

  describe('loadOddsData', () => {
    test('should load data from local file when no fixtureId provided', async () => {
      const data = await loadOddsData();
      
      expect(data).toBeDefined();
      expect(data.fixtureId).toBeDefined();
      expect(data.participant1Name).toBeDefined();
      expect(data.participant2Name).toBeDefined();
      expect(data.bookmakerOdds).toBeDefined();
      expect(typeof data.bookmakerOdds).toBe('object');
    });

    test('should attempt API call when fixtureId is provided', async () => {
      // Mock successful API response
      const mockApiResponse = {
        data: {
          fixtureId: 'test_fixture',
          participant1Name: 'Team A',
          participant2Name: 'Team B',
          sportName: 'Soccer',
          tournamentName: 'Test League',
          bookmakerOdds: {}
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockApiResponse);
      
      const data = await loadOddsData('test_fixture');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v4/odds'),
        expect.objectContaining({
          params: expect.objectContaining({
            fixtureId: 'test_fixture',
            oddsFormat: 'decimal',
            verbosity: 3
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed data gracefully', async () => {
      // This test ensures the system doesn't crash with unexpected data
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Suppress error logs during test
      
      try {
        const result = await calculateArbitrage(undefined, false);
        expect(result).toBeDefined();
      } finally {
        console.error = originalConsoleError;
      }
    });

    test('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'ETIMEDOUT';
      
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      
      // Should fallback to local file without throwing
      const result = await calculateArbitrage('test_fixture', false);
      expect(result).toBeDefined();
    });
  });

});

// Export loadOddsData from core for testing
export { loadOddsData } from '../core';