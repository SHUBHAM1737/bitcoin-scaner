// app/services/bitcoinAnalyzerService.ts
import { BITCOIN_NETWORKS, STACKS_NETWORKS, SBTC_CONTRACT_ADDRESS, SBTC_BRIDGE_CONTRACT_ADDRESS } from '../config/blockchain';
import { validateBitcoinAddress, validateStacksAddress, isTransactionHash, getTransactionType } from '../utils/addressValidator';
import { formatStacksTransaction, isSbtcTransaction } from '../utils/stacksFormatter';
import { StacksApiService } from './stacksApiService';

interface AnalysisInput {
  input: string;
  network?: 'bitcoin' | 'stacks';
  subNetwork?: 'mainnet' | 'testnet';
}

interface AnalysisResult {
  type: 'transaction' | 'address' | 'question';
  network: 'bitcoin' | 'stacks';
  subNetwork: 'mainnet' | 'testnet';
  input: string;
  data: any;
  error?: string;
}

/**
 * Service for analyzing Bitcoin and Stacks blockchain data
 */
export class BitcoinAnalyzerService {
  /**
   * Analyze a user input and determine its type and which network to use
   */
  static async analyzeInput({ input, network = 'bitcoin', subNetwork = 'mainnet' }: AnalysisInput): Promise<AnalysisResult> {
    try {
      const trimmedInput = input.trim();
      
      // First determine if this is a transaction hash
      if (isTransactionHash(trimmedInput)) {
        const txType = getTransactionType(trimmedInput);
        
        // If user didn't specify a network but we detected one from the hash, use it
        if (txType === 'bitcoin' && network !== 'bitcoin') {
          network = 'bitcoin';
        } else if (txType === 'stacks' && network !== 'stacks') {
          network = 'stacks';
        }
        
        return await this.analyzeTransaction(trimmedInput, network, subNetwork);
      }
      
      // Check if this is a Bitcoin address
      if (validateBitcoinAddress(trimmedInput)) {
        return await this.analyzeAddress(trimmedInput, 'bitcoin', subNetwork);
      }
      
      // Check if this is a Stacks address
      if (validateStacksAddress(trimmedInput)) {
        return await this.analyzeAddress(trimmedInput, 'stacks', subNetwork);
      }
      
      // If we got here, it's probably a question
      return {
        type: 'question',
        network,
        subNetwork,
        input: trimmedInput,
        data: null
      };
    } catch (error) {
      console.error('Error in analyzeInput:', error);
      return {
        type: 'question',
        network,
        subNetwork,
        input,
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
  
  /**
   * Analyze a transaction hash
   */
  static async analyzeTransaction(
    txHash: string,
    network: 'bitcoin' | 'stacks' = 'bitcoin',
    subNetwork: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<AnalysisResult> {
    try {
      let data;
      
      if (network === 'bitcoin') {
        // Bitcoin transaction analysis
        // Normalize transaction hash (remove 0x prefix if present)
        const normalizedTxHash = txHash.startsWith('0x') ? txHash.substring(2) : txHash;
        
        try {
          // Use mempool.space API directly through our proxy
          // Properly encode the URL to avoid issues
          const baseUrl = subNetwork === 'mainnet' 
            ? 'https://mempool.space/api' 
            : 'https://mempool.space/testnet/api';
            
          const apiEndpoint = `${baseUrl}/tx/${normalizedTxHash}`;
          const encodedUrl = encodeURIComponent(apiEndpoint);
          
          console.log('Fetching Bitcoin transaction from:', apiEndpoint);
          
          // Use absolute URL format
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
          
          const response = await fetch(requestUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Bitcoin transaction: ${response.statusText}`);
          }
          
          data = await response.json();
          
          // Add sBTC detection logic
          if (data.vout) {
            // This is a simplified approach - in production you would need a more robust detection system
            data.isSbtcRelated = data.vout.some((output: any) => {
              // Example known sBTC-related addresses (these are just placeholders)
              const knownSbtcAddresses = [
                'bc1qycrcnj7qmjy5xzczp90c8yf43v2fgd0pqnzcjn',
                'bc1q6u9kch327eza7aewns9tfs74d54y9wz75jgus8'
              ];
              
              return output.scriptpubkey_address && knownSbtcAddresses.includes(output.scriptpubkey_address);
            });
          }
        } catch (btcError) {
          console.error('Error fetching from Mempool.space API:', btcError);
          
          // Attempt to use Blockstream API as a fallback
          try {
            const blockstreamBase = subNetwork === 'mainnet' 
              ? 'https://blockstream.info/api' 
              : 'https://blockstream.info/testnet/api';
              
            const blockstreamEndpoint = `${blockstreamBase}/tx/${normalizedTxHash}`;
            const encodedBlockstreamUrl = encodeURIComponent(blockstreamEndpoint);
            
            console.log('Trying fallback: Fetching from Blockstream API:', blockstreamEndpoint);
            
            // Use absolute URL format
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const fallbackRequestUrl = `${origin}/api/blockchain-data?url=${encodedBlockstreamUrl}`;
            
            const blockstreamResponse = await fetch(fallbackRequestUrl);
            
            if (!blockstreamResponse.ok) {
              throw new Error(`Failed to fetch from Blockstream API: ${blockstreamResponse.statusText}`);
            }
            
            data = await blockstreamResponse.json();
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw btcError; // Throw the original error if fallback also fails
          }
        }
      } else {
        // Stacks transaction analysis
        const stacksApi = new StacksApiService(subNetwork);
        
        // Normalize transaction hash if needed (ensure it has 0x prefix)
        const normalizedTxHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
        
        try {
          // Fetch transaction data using the updated StacksApiService
          console.log(`Fetching Stacks transaction: ${normalizedTxHash}`);
          const txData = await stacksApi.getTransaction(normalizedTxHash);
          
          // Format the transaction data
          data = formatStacksTransaction(txData);
          
          // Add extra information about sBTC if applicable
          if (data.isSbtc) {
            console.log('sBTC transaction detected, fetching additional data...');
            // In a production app, you might fetch additional data about the sBTC operation
            // such as the associated Bitcoin transaction, deposit/withdrawal status, etc.
          }
        } catch (stacksError) {
          console.error('Error fetching Stacks transaction:', stacksError);
          throw stacksError;
        }
      }
      
      return {
        type: 'transaction',
        network,
        subNetwork,
        input: txHash,
        data
      };
    } catch (error) {
      console.error(`Error analyzing ${network} transaction:`, error);
      return {
        type: 'transaction',
        network,
        subNetwork,
        input: txHash,
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
  
  /**
   * Analyze an address
   */
  static async analyzeAddress(
    address: string,
    network: 'bitcoin' | 'stacks' = 'bitcoin',
    subNetwork: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<AnalysisResult> {
    try {
      let data;
      
      if (network === 'bitcoin') {
        // Bitcoin address analysis
        try {
          // Use mempool.space API for address data
          const baseUrl = subNetwork === 'mainnet' 
            ? 'https://mempool.space/api' 
            : 'https://mempool.space/testnet/api';
            
          const apiEndpoint = `${baseUrl}/address/${address}`;
          const encodedUrl = encodeURIComponent(apiEndpoint);
          
          console.log('Fetching Bitcoin address from:', apiEndpoint);
          
          // Use absolute URL format
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
          
          const response = await fetch(requestUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Bitcoin address: ${response.statusText}`);
          }
          
          data = await response.json();
          
          // Check for sBTC interactions
          if (data.txs) {
            const knownSbtcAddresses = [
              'bc1qycrcnj7qmjy5xzczp90c8yf43v2fgd0pqnzcjn',  // example only
              'bc1q6u9kch327eza7aewns9tfs74d54y9wz75jgus8'   // example only
            ];
            
            data.sbtcInteractions = data.txs.filter((tx: any) => {
              if (!tx.vout) return false;
              
              return tx.vout.some((output: any) => 
                output.scriptpubkey_address && knownSbtcAddresses.includes(output.scriptpubkey_address)
              );
            });
          }
        } catch (btcError) {
          console.error('Error fetching from Mempool.space API:', btcError);
          
          // Try Blockstream API as fallback
          try {
            const blockstreamBase = subNetwork === 'mainnet' 
              ? 'https://blockstream.info/api' 
              : 'https://blockstream.info/testnet/api';
              
            const blockstreamEndpoint = `${blockstreamBase}/address/${address}`;
            const encodedBlockstreamUrl = encodeURIComponent(blockstreamEndpoint);
            
            console.log('Trying fallback: Fetching from Blockstream API:', blockstreamEndpoint);
            
            // Use absolute URL format
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const fallbackRequestUrl = `${origin}/api/blockchain-data?url=${encodedBlockstreamUrl}`;
            
            const blockstreamResponse = await fetch(fallbackRequestUrl);
            
            if (!blockstreamResponse.ok) {
              throw new Error(`Failed to fetch from Blockstream API: ${blockstreamResponse.statusText}`);
            }
            
            data = await blockstreamResponse.json();
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw btcError; // Throw the original error if fallback also fails
          }
        }
      } else {
        // Stacks address analysis
        try {
          const stacksApi = new StacksApiService(subNetwork);
          
          // Fetch address data
          console.log(`Fetching Stacks address data: ${address}`);
          const addressData = await stacksApi.getAddressData(address);
          
          // Process the data for display
          data = {
            balance: addressData.balance,
            transactions: addressData.transactions.results.map(formatStacksTransaction)
          };
          
          // Check for sBTC interactions
          data.sbtcInteractions = data.transactions.filter((tx: any) => tx.isSbtc);
        } catch (stacksError) {
          console.error('Error fetching Stacks address:', stacksError);
          throw stacksError;
        }
      }
      
      return {
        type: 'address',
        network,
        subNetwork,
        input: address,
        data
      };
    } catch (error) {
      console.error(`Error analyzing ${network} address:`, error);
      return {
        type: 'address',
        network,
        subNetwork,
        input: address,
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
  
  /**
   * Get information about sBTC operations
   */
  static async getSbtcOperations(
    subNetwork: 'mainnet' | 'testnet' = 'mainnet',
    limit = 20
  ): Promise<any> {
    try {
      const stacksApi = new StacksApiService(subNetwork);
      const operations = await stacksApi.getSbtcOperations(limit);
      
      return operations;
    } catch (error) {
      console.error('Error fetching sBTC operations:', error);
      throw error;
    }
  }
  
  /**
   * Get information about sBTC contract
   */
  static async getSbtcContract(
    subNetwork: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<any> {
    try {
      const contractId = SBTC_CONTRACT_ADDRESS[subNetwork];
      
      // This is a simplified approach - in production you would parse the contract interface
      const apiUrl = STACKS_NETWORKS[subNetwork].apiUrl;
      const endpoint = `${apiUrl}/v2/contracts/interface/${contractId}`;
      const encodedUrl = encodeURIComponent(endpoint);
      
      // Use absolute URL format
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      const response = await fetch(requestUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sBTC contract: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sBTC contract:', error);
      throw error;
    }
  }
}