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
- npm or pnpm package manager

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

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | API base URL | `https://api.oddspapi.io` |
| `API_KEY` | Your API access key | Required for API calls |

### API Endpoint

The library expects the API to return data in the following format:
```
GET /v4/odds?fixtureId={id}&oddsFormat=decimal&verbosity=3&apiKey={key}
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm start` | Run analysis with default settings |
| `pnpm build` | Compile TypeScript to JavaScript |
| `pnpm test` | Build and run compiled JavaScript |

## 📈 Understanding Arbitrage

Arbitrage opportunities occur when the combined implied probabilities of all outcomes in a market are less than 100%. This happens when different bookmakers offer odds that, when combined optimally, guarantee a profit.

### Key Concepts

- **Implied Probability**: `1 / odds` - what the bookmaker thinks is the chance of an outcome
- **Total Implied Probability**: Sum of all implied probabilities in a market
- **Arbitrage Percentage**: The guaranteed profit percentage
- **Bet Distribution**: Optimal stake allocation across different bookmakers

### Example Calculation

If Team A has odds of 2.1 at Bookmaker 1 and Team B has odds of 2.1 at Bookmaker 2:
- Team A implied probability: 1/2.1 = 47.6%
- Team B implied probability: 1/2.1 = 47.6%
- Total: 95.2% (less than 100% = arbitrage opportunity!)
- Profit: (100% - 95.2%) / 95.2% = 5.04%

## 🚨 Risk Disclaimer

This library is for educational and analytical purposes. Sports betting involves risk, and arbitrage opportunities:

- May have limited time windows
- Could be restricted by bookmaker limits
- Require careful account management
- May violate some bookmakers' terms of service

Always understand the risks and terms before placing any bets.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions, issues, or feature requests:

1. Check existing [Issues](../../issues)
2. Create a new issue with detailed information
3. Include sample data and error messages when reporting bugs

## 🔮 Future Enhancements

- [ ] Real-time odds monitoring
- [ ] Multiple API provider support
- [ ] Web dashboard interface
- [ ] Automated bet placement (with appropriate safeguards)
- [ ] Historical arbitrage tracking
- [ ] Email/SMS notifications for opportunities

---

**Happy arbitrage hunting! 🎯**