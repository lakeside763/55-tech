# Arbitrage Detection Library

A comprehensive TypeScript library for detecting arbitrage opportunities in sports betting odds across multiple bookmakers.

## 🎯 Overview

This library analyzes odds data from multiple bookmakers to identify arbitrage opportunities where you can guarantee profit regardless of the outcome by placing bets across different bookmakers. It supports both API data fetching and local file analysis.

## ✨ Features

- **Multi-source Data Loading**: Fetch live odds from API or analyze local data files
- **Comprehensive Analysis**: Analyzes all markets and outcomes across active bookmakers
- **Arbitrage Detection**: Identifies profitable betting opportunities with guaranteed returns
- **Detailed Reporting**: Provides profit calculations and optimal bet distributions
- **Export Functionality**: Saves results to JSON for further analysis
- **TypeScript Support**: Full type safety and IntelliSense support

## 🚀 Quick Start

### Prerequisites

- Node.js 14.0.0 or higher
- pnpm package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd arbitrage-detection-library
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API credentials:
   ```bash
   BASE_URL=https://api.oddspapi.io
   API_KEY=your_actual_api_key_here
   ```

### Basic Usage

#### Analyze Local Data
```bash
pnpm start
# Analyzes data from market-odds.json
```

#### Fetch Live Data from API
```typescript
import { calculateArbitrage } from './index';

// Fetch live odds for a specific fixture
const fixtureId = 'id1000040663594285';
const verbose = false; // Show detailed logging
const result = await calculateArbitrage(fixtureId, verbose);
console.log(`Found ${result.analysis.totalOpportunities} opportunities`);
```

## 📊 Example Output - console

```
================================================================================
ARBITRAGE ANALYSIS SUMMARY
================================================================================
Fixture: FK Buducnost Podgorica vs Haverfordwest County AFC
Tournament: UEFA Youth League (Soccer)
Markets analyzed: 251
Active bookmakers: 96
Opportunities found: 25

1. Market 101
   Profit: 62.48%
   Total Implied Probability: 61.55%
   Optimal Bet Distribution (for $100 total):
     - Outcome 101: $26.00 at bet365 (odds: 6.25)
     - Outcome 102: $42.76 at bet365 (odds: 3.8)
     - Outcome 103: $31.25 at betonline.ag (odds: 5.2)
   Guaranteed Profit: $62.48 on $100 stake
```

## 🛠️ API Reference

### Core Functions

#### `calculateArbitrage(fixtureId?, verbose?)`
Main function to analyze arbitrage opportunities.

**Parameters:**
- `fixtureId` (optional): Fixture ID to fetch from API. If not provided, uses local data
- `verbose` (optional): Enable detailed logging. Default: `false`

**Returns:** `Promise<ArbitrageAnalysisResult>`

#### `loadOddsData(fixtureId?)`
Loads odds data from API or local file.

**Parameters:**
- `fixtureId` (optional): Fixture ID for API fetch

**Returns:** `Promise<OddsData>`

### Data Types

#### `ArbitrageOpportunity`
```typescript
interface ArbitrageOpportunity {
  market: string;
  outcomes: Array<{
    outcomeId: string;
    bookmaker: string;
    odds: number;
    impliedProbability: number;
  }>;
  totalImpliedProbability: number;
  arbitragePercentage: number;
  betDistribution: Array<{
    outcomeId: string;
    bookmaker: string;
    betPercentage: number;
    requiredStake: number;
  }>;
}
```

## 📁 Project Structure

```
├── core.ts              # Core arbitrage analysis logic
├── index.ts             # Main entry point and calculation function
├── types.ts             # TypeScript type definitions
├── utils.ts             # Utility functions for display and export
├── market-odds.json     # Sample odds data file
├── .env.example         # Environment variables template
└── README.md            # This file
```

### Result output sample - json file(arbitrage.json)
```
{
  "fixture": {
    "fixtureId": "id1000232463448499",
    "participant1": "FK Buducnost Podgorica",
    "participant2": "Haverfordwest County AFC",
    "tournament": "UEFA Youth League",
    "sport": "Soccer"
  },
  "analysis": {
    "analyzedMarkets": 87,
    "totalActiveBookmakers": 19,
    "totalOpportunities": 5,
    "opportunities": [
      {
        "market": "101",
        "outcomes": [
          {
            "outcomeId": "101",
            "bookmaker": "18bet",
            "odds": 1.3,
            "impliedProbability": 0.7692307692307692
          },
          {
            "outcomeId": "102",
            "bookmaker": "sportybet",
            "odds": 7,
            "impliedProbability": 0.14285714285714285
          },
          {
            "outcomeId": "103",
            "bookmaker": "3et",
            "odds": 15,
            "impliedProbability": 0.06666666666666667
          }
        ],
        "totalImpliedProbability": 0.9787545787545786,
        "arbitragePercentage": 2.170658682634746,
        "betDistribution": [
          {
            "outcomeId": "101",
            "bookmaker": "18bet",
            "betPercentage": 78.59281437125749,
            "requiredStake": 78.59281437125749
          },
          {
            "outcomeId": "102",
            "bookmaker": "sportybet",
            "betPercentage": 14.595808383233535,
            "requiredStake": 14.595808383233535
          },
          {
            "outcomeId": "103",
            "bookmaker": "3et",
            "betPercentage": 6.811377245508983,
            "requiredStake": 6.811377245508983
          }
        ]
      },
      {
        "market": "1010",
        "outcomes": [
          {
            "outcomeId": "1010",
            "bookmaker": "18bet",
            "odds": 1.69,
            "impliedProbability": 0.591715976331361
          },
          {
            "outcomeId": "1011",
            "bookmaker": "vave",
            "odds": 2.55,
            "impliedProbability": 0.3921568627450981
          }
        ],
        "totalImpliedProbability": 0.9838728390764591,
        "arbitragePercentage": 1.6391509433962188,
        "betDistribution": [
          {
            "outcomeId": "1010",
            "bookmaker": "18bet",
            "betPercentage": 60.141509433962256,
            "requiredStake": 60.141509433962256
          },
          {
            "outcomeId": "1011",
            "bookmaker": "vave",
            "betPercentage": 39.85849056603774,
            "requiredStake": 39.85849056603774
          }
        ]
      },
      {
        "market": "1060",
        "outcomes": [
          {
            "outcomeId": "1060",
            "bookmaker": "18bet",
            "odds": 1.84,
            "impliedProbability": 0.5434782608695652
          },
          {
            "outcomeId": "1061",
            "bookmaker": "mystake",
            "odds": 2.36,
            "impliedProbability": 0.42372881355932207
          }
        ],
        "totalImpliedProbability": 0.9672070744288872,
        "arbitragePercentage": 3.3904761904761958,
        "betDistribution": [
          {
            "outcomeId": "1060",
            "bookmaker": "18bet",
            "betPercentage": 56.19047619047619,
            "requiredStake": 56.19047619047619
          },
          {
            "outcomeId": "1061",
            "bookmaker": "mystake",
            "betPercentage": 43.80952380952382,
            "requiredStake": 43.80952380952382
          }
        ]
      },
      {
        "market": "10242",
        "outcomes": [
          {
            "outcomeId": "10242",
            "bookmaker": "3et",
            "odds": 6.4,
            "impliedProbability": 0.15625
          },
          {
            "outcomeId": "10243",
            "bookmaker": "dafabet",
            "odds": 2.41,
            "impliedProbability": 0.41493775933609955
          }
        ],
        "totalImpliedProbability": 0.5711877593360996,
        "arbitragePercentage": 75.07377979568672,
        "betDistribution": [
          {
            "outcomeId": "10242",
            "bookmaker": "3et",
            "betPercentage": 27.355278093076052,
            "requiredStake": 27.355278093076052
          },
          {
            "outcomeId": "10243",
            "bookmaker": "dafabet",
            "betPercentage": 72.64472190692395,
            "requiredStake": 72.64472190692395
          }
        ]
      },
      {
        "market": "10244",
        "outcomes": [
          {
            "outcomeId": "10244",
            "bookmaker": "3et",
            "odds": 28,
            "impliedProbability": 0.03571428571428571
          },
          {
            "outcomeId": "10245",
            "bookmaker": "dafabet",
            "odds": 2.34,
            "impliedProbability": 0.4273504273504274
          }
        ],
        "totalImpliedProbability": 0.4630647130647131,
        "arbitragePercentage": 115.95253790375742,
        "betDistribution": [
          {
            "outcomeId": "10244",
            "bookmaker": "3et",
            "betPercentage": 7.712590639419907,
            "requiredStake": 7.712590639419907
          },
          {
            "outcomeId": "10245",
            "bookmaker": "dafabet",
            "betPercentage": 92.2874093605801,
            "requiredStake": 92.2874093605801
          }
        ]
      }
    ]
  },
  "timestamp": "2025-10-07T08:44:51.544Z"
}
```

