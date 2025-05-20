// app/services/stacksApiService.ts
import { STACKS_NETWORKS } from '@/app/config/blockchain';

export interface StacksTxBase {
  tx_id: string;
  nonce: number;
  fee_rate: string;
  sender_address: string;
  sponsored: boolean;
  post_condition_mode: string;
  post_conditions?: any[]; // Consider defining this further if needed
  anchor_mode: string; // Corrected: AnchorMode is a type, not a direct value here from API
  tx_status: string;
  block_hash?: string;
  block_height?: number;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  canonical?: boolean;
  tx_index?: number;
  tx_type: string; // e.g., "contract_call", "token_transfer", "smart_contract"
  confirmations?: number; // Often calculated
  network?: 'mainnet' | 'testnet'; // Added by our service
  contract_details?: any; // Added by our service
}

export interface StacksContractCallTransaction extends StacksTxBase {
  tx_type: 'contract_call';
  contract_call: {
    contract_id: string;
    function_name: string;
    function_signature?: string;
    function_args?: Array<{
      hex: string;
      name: string;
      repr: string;
      type: string;
    }>;
  };
}

export interface StacksTokenTransferTransaction extends StacksTxBase {
  tx_type: 'token_transfer';
  token_transfer: {
    recipient_address: string;
    amount: string;
    memo?: string;
    asset_identifier?: string; // Added: Important for identifying the token
  };
}

export interface StacksSmartContractTransaction extends StacksTxBase {
  tx_type: 'smart_contract';
  smart_contract: {
    contract_id: string;
    source_code: string;
  };
}

export interface StacksCoinbaseTransaction extends StacksTxBase {
    tx_type: 'coinbase';
    coinbase_payload: {
        data: string;
    }
}

// Union type for StacksTransaction
export type StacksTransaction = (StacksContractCallTransaction | StacksTokenTransferTransaction | StacksSmartContractTransaction | StacksCoinbaseTransaction | StacksTxBase) & {
  // Common fields that might not be strictly typed by tx_type but are often present
  stx_transfers?: Array<{ // Micro-STX
    amount: string;
    sender: string;
    recipient: string;
    memo?: string;
  }>;
  ft_transfers?: Array<{
    asset_identifier: string;
    amount: string;
    sender: string;
    recipient: string;
    tx_id: string; // Can be redundant
  }>;
  nft_transfers?: Array<{
    asset_identifier: string;
    value: { hex: string; repr: string }; // Often a uint for token ID
    sender: string;
    recipient: string;
    tx_id: string; // Can be redundant
  }>;
  events?: any[]; // Consider defining event structure if used extensively
};


export interface StacksBalance {
  stx: {
    balance: string;
    total_sent: string;
    total_received: string;
    total_fees_sent: string;
    total_miner_rewards_received: string;
    lock_tx_id: string;
    locked: string;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: Record<string, { balance: string; total_sent?: string; total_received?: string; }>;
  non_fungible_tokens: Record<string, { count: string; total_sent?: string; total_received?: string; }>;
}

export interface StacksAddressData {
  balance: StacksBalance;
  transactions: {
    limit: number;
    offset: number;
    total: number;
    results: StacksTransaction[];
  };
}

export interface StacksBlock {
  canonical: boolean;
  height: number;
  hash: string;
  parent_block_hash: string;
  burn_block_time: number;
  burn_block_time_iso: string;
  burn_block_hash: string;
  txs: string[]; // Array of transaction IDs
  // Optional: Add tx_count if the API directly provides it, otherwise calculate from txs.length
  tx_count?: number;
}

export interface SbtcOperation { // This seems like a custom interface for your sBTC logic
  txid: string;
  operation_type: 'deposit' | 'withdrawal' | 'transfer';
  sender: string;
  recipient: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  bitcoin_tx_id?: string;
}

/**
 * Service for interacting with the Stacks blockchain API
 */
export class StacksApiService {
  private readonly apiUrl: string;
  private readonly network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
    this.apiUrl = STACKS_NETWORKS[network].apiUrl;
  }

  private async fetchFromApi(endpoint: string): Promise<any> {
    try {
      const fullUrl = `${this.apiUrl}${endpoint}`;
      const encodedUrl = encodeURIComponent(fullUrl);
      const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      const response = await fetch(requestUrl);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Stacks API Error ${response.status} for ${fullUrl}: ${errorBody}`);
        throw new Error(`Stacks API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from Stacks API endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  async getTransaction(txId: string): Promise<StacksTransaction> {
    try {
      const normalizedTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
      console.log(`Workspaceing Stacks transaction: ${normalizedTxId} from network: ${this.network}`);
      
      const txData = await this.fetchFromApi(`/extended/v1/tx/${normalizedTxId}`) as StacksTransaction;
      
      let enrichedTxData = { ...txData, network: this.network };
      
      try {
        if (txData.tx_type === 'contract_call' && (txData as StacksContractCallTransaction).contract_call) {
          const contractId = (txData as StacksContractCallTransaction).contract_call.contract_id;
          try {
            enrichedTxData.contract_details = await this.getContractInfo(contractId);
          } catch (contractError) {
            console.warn(`Could not fetch contract details for ${contractId}:`, contractError);
          }
        }
        
        if (txData.block_height && txData.block_height > 0) {
          try {
            const latestBlocks = await this.getRecentBlocks(1);
            if (latestBlocks && latestBlocks.length > 0) {
              const latestHeight = latestBlocks[0].height;
              enrichedTxData.confirmations = latestHeight - txData.block_height + 1;
            }
          } catch (blockError) {
            console.warn('Could not fetch block data for confirmations:', blockError);
          }
        }
      } catch (enrichmentError) {
        console.warn('Error during transaction data enrichment:', enrichmentError);
      }
      
      return enrichedTxData;
    } catch (error) {
      console.error('Error fetching Stacks transaction in StacksApiService:', error);
      throw error;
    }
  }

  async getAddressData(address: string, limit = 20): Promise<StacksAddressData> {
    try {
      const balance = await this.fetchFromApi(`/extended/v1/address/${address}/balances`);
      const transactions = await this.fetchFromApi(`/extended/v1/address/${address}/transactions?limit=${limit}&unanchored=true`); // Added unanchored=true
      
      return {
        balance,
        transactions
      };
    } catch (error) {
      console.error('Error fetching Stacks address data:', error);
      throw error;
    }
  }

  async getBlock(hashOrHeight: string | number): Promise<StacksBlock> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/block/${hashOrHeight}`);
      return { ...data, tx_count: data.txs?.length || 0 }; // Ensure tx_count is present
    } catch (error) {
      console.error('Error fetching Stacks block:', error);
      throw error;
    }
  }

  async getRecentBlocks(limit = 10): Promise<StacksBlock[]> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/block?limit=${limit}`);
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format for recent Stacks blocks');
      }
      return data.results.map((block: any) => ({ ...block, tx_count: block.txs?.length || 0 }));
    } catch (error) {
      console.error('Error fetching recent Stacks blocks:', error);
      throw error;
    }
  }

  async getRecentTransactions(limit = 10): Promise<StacksTransaction[]> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/tx?limit=${limit}&unanchored=true`); // Added unanchored=true
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format for recent Stacks transactions');
      }
      return data.results;
    } catch (error) {
      console.error('Error fetching recent Stacks transactions:', error);
      throw error;
    }
  }

  async getSbtcOperations(limit = 20): Promise<SbtcOperation[]> {
    // This method requires a more robust way to identify sBTC ops,
    // likely by querying specific contract events or using a specialized indexer.
    // The previous implementation was a basic filter.
    console.warn("getSbtcOperations current implementation is a placeholder and may not be comprehensive.");
    try {
        const recentTxs = await this.getRecentTransactions(limit * 2); // Fetch more to filter
        const sbtcOps: SbtcOperation[] = [];
        for (const tx of recentTxs) {
            if (isSbtcTransaction(tx, this.network)) { // Assuming isSbtcTransaction is robust
                const details = extractSbtcOperationDetails(tx); // Assuming this gives SbtcOperation like structure
                if (details) {
                    sbtcOps.push({
                        txid: tx.tx_id,
                        operation_type: details.operationType.toLowerCase() as SbtcOperation['operation_type'],
                        sender: details.sender,
                        recipient: details.recipient,
                        amount: details.amount, // This should be sBTC amount
                        status: details.status.toLowerCase() as SbtcOperation['status'],
                        timestamp: tx.burn_block_time_iso || new Date().toISOString(),
                        bitcoin_tx_id: details.bitcoinTxId
                    });
                }
            }
            if (sbtcOps.length >= limit) break;
        }
        return sbtcOps;
    } catch (error) {
        console.error('Error fetching sBTC operations:', error);
        throw error;
    }
  }

  async getMempoolInfo() {
    try {
      const data = await this.fetchFromApi(`/extended/v1/tx/mempool?unanchored=true`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks mempool:', error);
      throw error;
    }
  }

  async getFeeEstimate() {
    try {
      const data = await this.fetchFromApi(`/v2/fees/transfer`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks fee estimate:', error);
      throw error;
    }
  }
  
  async getContractInfo(contractId: string) {
    try {
      // The API endpoint for contract interface might be different or require splitting contract_id
      const parts = contractId.split('.');
      if (parts.length !== 2) throw new Error("Invalid contract ID format for interface lookup.");
      const contractAddress = parts[0];
      const contractName = parts[1];
      const data = await this.fetchFromApi(`/v2/contracts/interface/${contractAddress}/${contractName}`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks contract info:', error);
      throw error; // Rethrow or handle as needed
    }
  }
}

// Helper functions from stacksFormatter (or ensure they are imported and used correctly)
// These are conceptual stubs for what should be in stacksFormatter.ts
function isSbtcTransaction(tx: StacksTransaction, network: 'mainnet' | 'testnet'): boolean {
    // Dummy implementation - replace with actual logic from sbtcAnalyzer.ts or stacksFormatter.ts
    if (!tx) return false;
    const sbtcContractIdPart = network === 'mainnet' ? SBTC_CONTRACT_ADDRESS.mainnet.split('.')[1] : SBTC_CONTRACT_ADDRESS.testnet.split('.')[1];
    if (tx.tx_type === 'contract_call') {
        const ccTx = tx as StacksContractCallTransaction;
        return ccTx.contract_call?.contract_id.includes(sbtcContractIdPart);
    }
    if (tx.tx_type === 'token_transfer') {
        const ttTx = tx as StacksTokenTransferTransaction;
        return ttTx.token_transfer?.asset_identifier?.includes(sbtcContractIdPart) ?? false;
    }
    return false;
}

function extractSbtcOperationDetails(tx: StacksTransaction): any {
    // Dummy implementation - replace with actual logic from sbtcAnalyzer.ts
    if (!isSbtcTransaction(tx, tx.network || 'mainnet')) return null;
    return {
        operationType: 'Transfer', // Example
        amount: '0.123', // Example sBTC amount
        sender: tx.sender_address,
        recipient: 'SP...', // Example
        status: tx.tx_status === 'success' ? 'Completed' : 'Pending',
        bitcoinTxId: 'dummybtctxid...',
    };
}