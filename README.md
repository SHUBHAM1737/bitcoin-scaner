# BitcoinInsightAI - Advanced Bitcoin Analytics Platform

## Introduction
BitcoinInsightAI is a comprehensive blockchain analytics platform that leverages artificial intelligence to provide detailed transaction analysis across multiple Bitcoin-related technologies. The platform integrates data from Bitcoin, Stacks, sBTC, and various Bitcoin metaprotocols, creating a unified view of the entire Bitcoin ecosystem.

## Key Features

### Core Platform Capabilities

- **AI-Powered Transaction Analysis**: Get detailed breakdowns of transactions with flow visualizations using Mermaid.js diagrams
- **Multi-Chain Support**: Seamlessly switch between Bitcoin and Stacks networks (both mainnet and testnet)
- **Real-Time Data**: Live updates on blockchain metrics including latest blocks, mempool status, and fee estimates
- **Interactive Diagrams**: Transaction flow visualizations with full-screen viewing support
- **Comprehensive Search**: Analyze any Bitcoin or Stacks transaction, address, or block with advanced AI interpretation

### Bitcoin Metaprotocols Explorer (Powered by Rebar Labs)

- **Runes Explorer**: Browse and analyze Bitcoin's Runes protocol with detailed views of etchings, balances, and holders
- **Ordinals Explorer**: Examine inscription data including content, metadata, and transfer history
- **BRC-20 Explorer**: Track BRC-20 token metrics including supply, mint progress, and holder distribution
- **Address Analytics**: View comprehensive metaprotocol activity for any Bitcoin address
- **Rich Visualizations**: Interactive charts and metrics for all supported metaprotocols

### sBTC Integration & Analytics

- **Position Tracking**: Real-time sBTC balance display with interactive historical charts
- **Operation Detection**: Smart classification of deposits, withdrawals, and transfers
- **Cross-Chain Tracking**: Follow transactions across both Bitcoin and Stacks blockchains
- **DeFi Dashboard**: Explore Stacks DeFi protocols supporting sBTC with yield opportunities

### BIP300 Sidechains Integration

- **Multiple Sidechain Support**: Explore BIP300-compatible sidechains including Thunder, zSide, and BitNames
- **Sidechain Explorer**: View blocks, transactions, and addresses on each sidechain
- **Interactive Dashboard**: Manage deposits, withdrawals, and transfers on BIP300 sidechains
- **Two-Way Peg Visualization**: See how Bitcoin moves between the main chain and sidechains
- **Network Statistics**: Monitor the health and activity of each sidechain network

## Technical Implementation

The platform leverages a modern tech stack for robust performance and extensibility:

- **Next.js**: React framework for server-rendered applications with API routes for backend functionality
- **TypeScript**: Type-safe code for improved maintainability and developer experience
- **Tailwind CSS**: Utility-first CSS framework for responsive, customizable design
- **Recharts**: Interactive data visualization components for charts and metrics
- **Mermaid.js**: Diagramming and charting tool for transaction flow visualization
- **OpenAI API**: Advanced natural language processing for transaction analysis
- **Stacks.js**: Stacks blockchain API and wallet interactions

### Integration APIs

The platform integrates with multiple data providers:

- **Rebar Labs API**: Enterprise-grade data access for Bitcoin metaprotocols including Runes, Ordinals, and BRC-20
- **Stacks API**: Access to the Stacks blockchain data and sBTC operations
- **Mempool.space API**: Real-time Bitcoin transaction and block data
- **Layer Two Labs API**: BIP300 sidechain data for Thunder, zSide, and BitNames

## How to Use the Platform

### Exploring Blockchain Data

- View blockchain metrics on the main dashboard
- Browse recent blocks and transactions
- Search for specific transactions, addresses, or blocks
- Switch between Bitcoin, Stacks, and BIP300 networks using the selector

### Transaction Analysis

- Enter a transaction hash in the search bar
- Review the automatically generated transaction flow diagram
- Examine detailed breakdowns of transfers, fees, and security assessment
- View related sBTC operations if applicable

### Address Analysis

- Search for any Bitcoin or Stacks address
- View transaction history and balance information
- For Bitcoin addresses, explore metaprotocol data:
  - Runes balances and activity
  - Ordinals inscriptions
  - BRC-20 token holdings
- For Stacks addresses, access sBTC analytics and DeFi opportunities
- For any address, check BIP300 sidechain transactions

### Metaprotocols Explorer

The integrated metaprotocols explorer provides deep insights into Bitcoin's emerging layer of protocols:

- **Runes**: View all etched runes, their supply metrics, circulation data, and holder distribution
- **Ordinals**: Browse inscriptions with content previews, metadata, and transfer history
- **BRC-20**: Analyze token deployments, minting progress, and holder information

All metaprotocol data is provided through the Rebar Labs API, offering enterprise-grade reliability and comprehensive coverage.

### BIP300 Sidechains Explorer

The BIP300 sidechains explorer provides a window into the emerging world of Bitcoin sidechains:

- **Thunder**: A high-throughput Bitcoin sidechain optimized for scalability
- **zSide**: A privacy-focused sidechain with zCash-like features
- **BitNames**: A Namecoin-like identity and name registration system

The BIP300 integration lets users explore blocks, transactions, and accounts on these sidechains, as well as managing deposits and withdrawals using the BIP300 two-way peg mechanism.

## sBTC Analytics

The sBTC analytics module provides comprehensive insights into the sBTC protocol, which brings Bitcoin to the Stacks blockchain:

- **Balance Tracking**: Monitor sBTC positions and historical changes
- **Operation Classification**: Analyze deposit, withdrawal, and transfer operations
- **Security Assessment**: Evaluate risks and security considerations for sBTC transactions
- **Yield Opportunities**: Discover and analyze potential returns from sBTC in DeFi protocols

## Developer Setup

### Prerequisites

- Node.js 16.x or higher
- Yarn or npm
- API keys for:
  - OpenAI API
  - Rebar Labs API

### Installation

Clone the repository:
```bash
git clone https://github.com/your-username/bitcoin-insight-ai.git
cd bitcoin-insight-ai
```

Install dependencies:
```bash
yarn install
```

Create a .env.local file with the following variables:
```
OPENAI_API_KEY=your-openai-api-key
REBAR_API_KEY=your-rebar-api-key
```

Start the development server:
```bash
yarn dev
```

Open http://localhost:3000 to view the application

## Architecture

The application is structured as follows:

- **app/**: Next.js application directory
  - **components/**: React components for UI elements
  - **api/**: API routes for proxying blockchain data
  - **services/**: Service classes for data fetching and processing
  - **utils/**: Utility functions for formatting and validation
  - **config/**: Configuration files for blockchain networks

### Key Services

- **BitcoinAnalyzerService**: Analyzes Bitcoin and Stacks transactions
- **RebarLabsService**: Interacts with Rebar Labs API for metaprotocol data
- **StacksApiService**: Handles Stacks blockchain data
- **SbtcService**: Manages sBTC operations and analytics
- **BIP300Service**: Interacts with BIP300 sidechains

## Project Status and Roadmap

BitcoinInsightAI is currently in active development with the following roadmap items:

- Advanced multi-wallet support with portfolio tracking
- Expanded DeFi protocol integrations
- Additional yield optimization tools
- Historical performance tracking for metaprotocols
- Mobile-optimized interfaces for on-the-go management
- Integration with additional Bitcoin metaprotocols as they emerge
- Real-time alerting for significant metaprotocol events
- Enhanced BIP300 sidechain support

## Bounties and Integrations

BitcoinInsightAI has successfully integrated several key bounties and partnerships:

1. **Rebar Labs Metaprotocols Integration**: Comprehensive data on Runes, Ordinals, and BRC-20 tokens
2. **sBTC Analytics Integration**: Complete sBTC operations tracking and analysis
3. **BIP300 Sidechains Integration**: Support for Thunder, zSide, and BitNames Bitcoin sidechains
4. **Stacks DeFi Dashboard**: Analysis of yield opportunities for sBTC in Stacks DeFi

## Conclusion

BitcoinInsightAI combines AI-powered analysis with comprehensive blockchain data to provide unparalleled visibility into Bitcoin, Stacks, sBTC, and Bitcoin's emerging metaprotocols ecosystem. By bridging these technologies with advanced analytics and an intuitive interface, we're creating a complete platform for understanding and navigating the evolving Bitcoin landscape.

Our integrations with Rebar Labs, Stacks, and Layer Two Labs enhance this vision by providing deep, reliable insights into Bitcoin's expanding programmability options. Whether you're a developer, investor, or blockchain enthusiast, BitcoinInsightAI offers the tools to understand these complex protocols and their interactions.