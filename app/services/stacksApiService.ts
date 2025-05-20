// app/services/stacksApiService.ts
import { STACKS_NETWORKS } from '@/app/config/blockchain';

export interface StacksTransaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  fee_rate: string;
  nonce: number;
  sender_address: string;
  sponsored: boolean;
  post_condition_mode: string;
  block_hash?: string;
  block_height?: number;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  canonical?: boolean;
  tx_index?: number;
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo?: string;
  };
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args?: any[];
  };
  smart_contract?: {
    contract_id: string;
    source_code: string;
  };
  events?: any[];
  network?: string;
  confirmations?: number;
  contract_details?: any;
}

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
  fungible_tokens: Record<string, { balance: string }>;
  non_fungible_tokens: Record<string, { count: string }>;
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
  tx_count: number;
}

export interface SbtcOperation {
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

  /**
   * Helper to make API requests through our proxy
   */
  private async fetchFromApi(endpoint: string): Promise<any> {
    try {
      // Construct the full URL properly
      const fullUrl = `${this.apiUrl}${endpoint}`;
      
      // Properly encode the URL
      const encodedUrl = encodeURIComponent(fullUrl);
      
      console.log(`Fetching from Stacks API: ${fullUrl}`);
      
      // Use absolute URL format with origin
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      const response = await fetch(requestUrl);
      
      if (!response.ok) {
        throw new Error(`Stacks API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Stacks API:', error);
      throw error;
    }
  }

  /**
   * Fetch a transaction by its ID with enhanced error handling and data enrichment
   */
  async getTransaction(txId: string): Promise<StacksTransaction> {
    try {
      // Ensure transaction ID is properly formatted (should have 0x prefix)
      const normalizedTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
      
      console.log(`Fetching Stacks transaction: ${normalizedTxId} from network: ${this.network}`);
      
      // Fetch the basic transaction data
      const txData = await this.fetchFromApi(`/extended/v1/tx/${normalizedTxId}`);
      
      // Enrich the transaction data with additional context
      let enrichedTxData = { ...txData };
      
      // Add network context
      enrichedTxData.network = this.network;
      
      // Try to fetch additional details based on transaction type
      try {
        if (txData.tx_type === 'contract_call' && txData.contract_call) {
          // For contract calls, get more contract details
          const contractId = txData.contract_call.contract_id;
          const contractParts = contractId.split('.');
          
          if (contractParts.length === 2) {
            try {
              const contractInfo = await this.getContractInfo(contractId);
              enrichedTxData.contract_details = contractInfo;
            } catch (contractError) {
              console.warn(`Could not fetch contract details for ${contractId}:`, contractError);
            }
          }
        }
        
        // For transactions that are already confirmed in a block, get the exact block confirmation count
        if (txData.block_height && txData.block_height > 0) {
          try {
            // Get latest block info to calculate confirmation count
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
        // Continue with the basic transaction data we already have
      }
      
      return enrichedTxData;
    } catch (error) {
      console.error('Error fetching Stacks transaction:', error);
      throw error;
    }
  }

  /**
   * Fetch data for a Stacks address
   */
  async getAddressData(address: string, limit = 20): Promise<StacksAddressData> {
    try {
      const balance = await this.fetchFromApi(`/extended/v1/address/${address}/balances`);
      const transactions = await this.fetchFromApi(`/extended/v1/address/${address}/transactions?limit=${limit}`);
      
      return {
        balance,
        transactions
      };
    } catch (error) {
      console.error('Error fetching Stacks address:', error);
      throw error;
    }
  }

  /**
   * Fetch a block by its hash or height
   */
  async getBlock(hashOrHeight: string | number): Promise<StacksBlock> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/block/${hashOrHeight}`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks block:', error);
      throw error;
    }
  }

  /**
   * Fetch recent blocks
   */
  async getRecentBlocks(limit = 10): Promise<StacksBlock[]> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/block?limit=${limit}`);
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Stacks API');
      }
      
      return data.results;
    } catch (error) {
      console.error('Error fetching recent Stacks blocks:', error);
      throw error;
    }
  }

  /**
   * Fetch recent transactions
   */
  async getRecentTransactions(limit = 10): Promise<StacksTransaction[]> {
    try {
      const data = await this.fetchFromApi(`/extended/v1/tx?limit=${limit}`);
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Stacks API');
      }
      
      return data.results;
    } catch (error) {
      console.error('Error fetching recent Stacks transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch sBTC operations
   * Note: This function identifies sBTC related transactions by filtering
   * contract calls and token transfers that interact with known sBTC contracts
   */
  async getSbtcOperations(limit = 20): Promise<SbtcOperation[]> {
    try {
      // Fetch recent transactions
      const data = await this.fetchFromApi(`/extended/v1/tx?limit=${limit}`);
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Stacks API');
      }
      
      // Known sBTC contract IDs (These should be updated with actual contract IDs)
      const knownSbtcContracts = [
        'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.arkadiko-sbtc-v1-1-bridge',
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc',
        'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-bitcoin',
        'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.sbtc-token'
      ];
      
      // Filter and process sBTC-related transactions
      const sbtcOperations: SbtcOperation[] = [];
      
      for (const tx of data.results) {
        let isSbtcOperation = false;
        let operationType: 'deposit' | 'withdrawal' | 'transfer' = 'transfer';
        let sender = tx.sender_address;
        let recipient = '';
        let amount = '0';
        
        // Check if it's a contract call to a known sBTC contract
        if (tx.tx_type === 'contract_call' && tx.contract_call) {
          const contractId = tx.contract_call.contract_id;
          
          if (knownSbtcContracts.some(id => contractId.includes(id))) {
            isSbtcOperation = true;
            
            // Determine operation type based on function name
            const functionName = tx.contract_call.function_name.toLowerCase();
            
            if (functionName.includes('deposit') || functionName.includes('mint')) {
              operationType = 'deposit';
            } else if (functionName.includes('withdraw') || functionName.includes('burn')) {
              operationType = 'withdrawal';
            }
            
            // Try to extract recipient and amount from function args if available
            if (tx.contract_call.function_args && tx.contract_call.function_args.length > 0) {
              // This is a simplified approach - in production, you'd parse the args more carefully
              const recipientArg = tx.contract_call.function_args.find((arg: any) => 
                arg.name === 'recipient' || arg.name === 'to'
              );
              
              const amountArg = tx.contract_call.function_args.find((arg: any) => 
                arg.name === 'amount' || arg.name === 'value'
              );
              
              if (recipientArg && recipientArg.repr) {
                recipient = recipientArg.repr.replace(/['"]|0x/g, '');
              }
              
              if (amountArg && amountArg.repr) {
                // Extract numeric value from repr
                const match = amountArg.repr.match(/(\d+)/);
                amount = match ? match[0] : '0';
              }
            }
          }
        }
        
        // Check if it's a token transfer of an sBTC token
        else if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
          const assetId = tx.token_transfer.asset_identifier;
          
          if (assetId && knownSbtcContracts.some(id => assetId.includes(id))) {
            isSbtcOperation = true;
            operationType = 'transfer';
            recipient = tx.token_transfer.recipient_address;
            amount = tx.token_transfer.amount;
          }
        }
        
        if (isSbtcOperation) {
          sbtcOperations.push({
            txid: tx.tx_id,
            operation_type: operationType,
            sender,
            recipient: recipient || 'unknown',
            amount,
            status: tx.tx_status === 'success' ? 'completed' : 
                   tx.tx_status === 'pending' ? 'pending' : 'failed',
            timestamp: tx.burn_block_time_iso || new Date().toISOString(),
            bitcoin_tx_id: tx.events?.find((e: any) => e.event_type === 'bitcoin_tx_id')?.value
          });
        }
      }
      
      return sbtcOperations;
    } catch (error) {
      console.error('Error fetching sBTC operations:', error);
      throw error;
    }
  }

  /**
   * Fetch the current mempool information
   */
  async getMempoolInfo() {
    try {
      const data = await this.fetchFromApi(`/extended/v1/tx/mempool`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks mempool:', error);
      throw error;
    }
  }

  /**
   * Get fee estimates
   */
  async getFeeEstimate() {
    try {
      const data = await this.fetchFromApi(`/v2/fees/transfer`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks fee estimate:', error);
      throw error;
    }
  }
  
  /**
   * Fetch contract data
   */
  async getContractInfo(contractId: string) {
    try {
      const data = await this.fetchFromApi(`/v2/contracts/interface/${contractId}`);
      return data;
    } catch (error) {
      console.error('Error fetching Stacks contract info:', error);
      throw error;
    }
  }
}