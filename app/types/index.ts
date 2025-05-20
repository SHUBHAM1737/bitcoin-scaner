// Types used throughout the application

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface TransactionDetails {
  hash: string;
  network: string;
  status: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  fee: string;
}

export interface BitcoinTransferDetails {
  type: 'input' | 'output';
  address: string;
  amount: string;
  txType: string;
  spent?: boolean;
}

export interface StacksTransferDetails {
  type: 'stx' | 'sbtc' | 'contract';
  from: string;
  to: string;
  amount?: string;
  contractId?: string;
  functionName?: string;
  status?: string;
}

export interface BitcoinNetwork {
  name: string;
  apiUrl: string;
  addressUrl: string;
  txUrl: string;
  blockUrl: string;
  explorer: string;
  txExplorer: string;
  addressExplorer: string;
}

export interface StacksNetwork {
  name: string;
  url: string;
  chainId: number;
  apiUrl: string;
  broadcastEndpoint: string;
  transferFeeEstimateEndpoint: string;
  coreApiUrl: string;
  explorerUrl: string;
  btcExplorerUrl: string;
}