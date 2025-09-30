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
const result = await calculateArbitrage('id1000040663594285', true);
console.log(`Found ${result.analysis.totalOpportunities} opportunities`);
```

## 📊 Example Output

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

### API Endpoint

The library expects the API to return data in the following format:
```
GET /v4/odds?fixtureId={id}&oddsFormat=decimal&verbosity=3&apiKey={key}
```

