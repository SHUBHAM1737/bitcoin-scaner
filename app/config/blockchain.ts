// app/config/blockchain.ts

// Bitcoin network configurations
export const BITCOIN_NETWORKS = {
  mainnet: {
    name: 'Bitcoin Mainnet',
    apiUrl: 'https://mempool.space/api',
    addressUrl: 'https://mempool.space/api/address/',
    txUrl: 'https://mempool.space/api/tx/',
    blockUrl: 'https://mempool.space/api/block/',
    blocksUrl: 'https://mempool.space/api/blocks',
    explorer: 'https://mempool.space/tx/',
    txExplorer: 'https://mempool.space/tx/',
    addressExplorer: 'https://mempool.space/address/',
    mempoolUrl: 'https://mempool.space/api/mempool',
    mempoolRecentTxUrl: 'https://mempool.space/api/mempool/recent',
    feesUrl: 'https://mempool.space/api/v1/fees/recommended',
    utxoUrl: 'https://mempool.space/api/address/{address}/utxo',
    // Fallback APIs
    fallbackApiUrl: 'https://blockstream.info/api',
    fallbackTxUrl: 'https://blockstream.info/api/tx/'
  },
  testnet: {
    name: 'Bitcoin Testnet',
    apiUrl: 'https://mempool.space/testnet/api',
    addressUrl: 'https://mempool.space/testnet/api/address/',
    txUrl: 'https://mempool.space/testnet/api/tx/',
    blockUrl: 'https://mempool.space/testnet/api/block/',
    blocksUrl: 'https://mempool.space/testnet/api/blocks',
    explorer: 'https://mempool.space/testnet/tx/',
    txExplorer: 'https://mempool.space/testnet/tx/',
    addressExplorer: 'https://mempool.space/testnet/address/',
    mempoolUrl: 'https://mempool.space/testnet/api/mempool',
    mempoolRecentTxUrl: 'https://mempool.space/testnet/api/mempool/recent',
    feesUrl: 'https://mempool.space/testnet/api/v1/fees/recommended',
    utxoUrl: 'https://mempool.space/testnet/api/address/{address}/utxo',
    // Fallback APIs
    fallbackApiUrl: 'https://blockstream.info/testnet/api',
    fallbackTxUrl: 'https://blockstream.info/testnet/api/tx/'
  }
};

// Stacks network configurations with proper Hiro API endpoints
export const STACKS_NETWORKS = {
  mainnet: {
    name: 'Stacks Mainnet',
    url: 'https://api.mainnet.hiro.so',
    chainId: 1,
    apiUrl: 'https://api.mainnet.hiro.so',
    broadcastEndpoint: 'https://api.mainnet.hiro.so/v2/transactions',
    transferFeeEstimateEndpoint: 'https://api.mainnet.hiro.so/v2/fees/transfer',
    coreApiUrl: 'https://api.mainnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so/txid/',
    blocksEndpoint: 'https://api.mainnet.hiro.so/extended/v1/block',
    transactionsEndpoint: 'https://api.mainnet.hiro.so/extended/v1/tx',
    addressEndpoint: 'https://api.mainnet.hiro.so/extended/v1/address',
    mempoolEndpoint: 'https://api.mainnet.hiro.so/extended/v1/tx/mempool',
    btcExplorerUrl: 'https://mempool.space/tx/'
  },
  testnet: {
    name: 'Stacks Testnet',
    url: 'https://api.testnet.hiro.so',
    chainId: 2147483648,
    apiUrl: 'https://api.testnet.hiro.so',
    broadcastEndpoint: 'https://api.testnet.hiro.so/v2/transactions',
    transferFeeEstimateEndpoint: 'https://api.testnet.hiro.so/v2/fees/transfer',
    coreApiUrl: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so/testnet/txid/',
    blocksEndpoint: 'https://api.testnet.hiro.so/extended/v1/block',
    transactionsEndpoint: 'https://api.testnet.hiro.so/extended/v1/tx',
    addressEndpoint: 'https://api.testnet.hiro.so/extended/v1/address',
    mempoolEndpoint: 'https://api.testnet.hiro.so/extended/v1/tx/mempool',
    btcExplorerUrl: 'https://mempool.space/testnet/tx/'
  }
};

// Set default network - can be configured based on environment variables
export const DEFAULT_BITCOIN_NETWORK = 'mainnet';
export const DEFAULT_STACKS_NETWORK = 'mainnet';

// sBTC Token Contract address
export const SBTC_CONTRACT_ADDRESS = {
  mainnet: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-bitcoin',
  testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc',
};

// sBTC Bridge contract addresses
export const SBTC_BRIDGE_CONTRACT_ADDRESS = {
  mainnet: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.arkadiko-sbtc-v1-1-bridge',
  testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge',
};

// Default wallet provider for Stacks 
export const DEFAULT_WALLET_PROVIDER = 'wallet-connect';

// RPC URLs for connecting to Stacks blockchain nodes
export const STACKS_RPC_URLS = {
  mainnet: [
    'https://api.mainnet.hiro.so',
    'https://stacks-node-api.mainnet.stacks.co'
  ],
  testnet: [
    'https://api.testnet.hiro.so',
    'https://stacks-node-api.testnet.stacks.co'
  ]
};

// Example Bitcoin addresses for sBTC detection
export const SBTC_BITCOIN_ADDRESSES = {
  mainnet: [
    'bc1qf8psexccdkstyml7bq909889ssddp0wvdkk2j3',
    'bc1qm5m4znsf7gpzmrz5pkvzg4a5xvaztxzzaykk3gqzuyd8h6zvveus5h4j9m'
  ],
  testnet: [
    'tb1qmk25azpr2j0e3mx4s02ergcav0ze4dmpy65qq0'
  ]
};

export const REBAR_API_URL = 'https://api.rebarlabs.io';


// Blockchain fee estimates in case API call fails
export const FALLBACK_FEE_RATE = {
  bitcoin: 20, // sats/vB
  stacks: 0.0001 // STX
};