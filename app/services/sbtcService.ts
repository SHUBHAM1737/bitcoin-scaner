// app/services/sbtcService.ts
import {
  makeContractCall,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  bufferCV,
  broadcastTransaction,
  AnchorMode,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { UserSession } from '@stacks/connect-react';
import { SBTC_CONTRACT_ADDRESS } from '@/app/config/blockchain';

// sBTC contract details
export const SBTC_CONTRACT = {
  mainnet: {
    contractAddress: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    contractName: 'wrapped-bitcoin',
    assetName: 'wrapped-bitcoin'
  },
  testnet: {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'sbtc',
    assetName: 'sbtc'
  }
};

export interface SbtcOperationResult {
  success: boolean;
  txId?: string;
  error?: string;
}

interface SbtcDepositParams {
  btcTxid: string;
  btcVout: number;
  amount: bigint;
  senderBtcAddress: string;
  recipientStxAddress: string;
}

interface SbtcWithdrawParams {
  amount: bigint;
  recipientBtcAddress: string;
}

interface SbtcTransferParams {
  recipient: string;
  amount: bigint;
  memo?: string;
}

/**
 * Service for interacting with sBTC contracts and operations
 */
export class SbtcService {
  private userSession: UserSession;
  private network: 'mainnet' | 'testnet';
  private stacksNetwork: StacksMainnet | StacksTestnet;
  private sbtcContract: {
    contractAddress: string;
    contractName: string;
    assetName: string;
  };

  constructor(userSession: UserSession, network: 'mainnet' | 'testnet' = 'mainnet') {
    this.userSession = userSession;
    this.network = network;
    this.stacksNetwork = network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
    this.sbtcContract = SBTC_CONTRACT[network];
  }

  /**
   * Get the sBTC balance for an address
   */
  async getBalance(address: string): Promise<{ balance: string; balanceAsBigInt: bigint }> {
    try {
      // Get API endpoint based on network
      const apiUrl = this.network === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

      // Get token balance
      const response = await fetch(
        `${apiUrl}/extended/v1/address/${address}/balances`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();
      const contractId = `${this.sbtcContract.contractAddress}.${this.sbtcContract.contractName}`;
      
      // Find sBTC in the fungible tokens
      let sbtcBalance = '0';
      if (data.fungible_tokens) {
        // Find the sBTC token
        const sbtcTokenKey = Object.keys(data.fungible_tokens).find(key => 
          key.includes(contractId));
        
        if (sbtcTokenKey) {
          sbtcBalance = data.fungible_tokens[sbtcTokenKey].balance || '0';
        }
      }

      // Convert to a readable format (8 decimals for sBTC)
      const balanceAsBigInt = BigInt(sbtcBalance);
      const balanceDisplay = this.formatSbtcAmount(balanceAsBigInt);

      return {
        balance: balanceDisplay,
        balanceAsBigInt
      };
    } catch (error) {
      console.error('Error fetching sBTC balance:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated fees for an sBTC operation
   */
  async estimateFee(operationType: 'deposit' | 'withdraw' | 'transfer'): Promise<{
    stxFee: string;
    btcFee?: string;
    estimatedTime: string;
  }> {
    try {
      // Get fee estimates from the API
      const apiUrl = this.network === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

      // Get fee estimates
      const response = await fetch(`${apiUrl}/v2/fees/transfer`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fee estimates: ${response.statusText}`);
      }

      const feeData = await response.json();
      
      // Format and return the fee estimates
      let stxFee = (BigInt(feeData.estimated_cost_scalar) * BigInt(100)).toString();
      
      // Convert to readable format (6 decimals for STX)
      const stxFeeFormatted = (Number(stxFee) / 1_000_000).toFixed(6);
      
      // Estimate BTC fee for deposit and withdrawal operations
      let btcFee;
      if (operationType === 'deposit' || operationType === 'withdraw') {
        // Bitcoin fees from Mempool API
        const btcFeeResponse = await fetch(
          'https://mempool.space/api/v1/fees/recommended'
        );
        
        if (btcFeeResponse.ok) {
          const btcFeeData = await btcFeeResponse.json();
          // Estimate fee for a transaction with 1 input and 2 outputs
          // Bitcoin transaction is approximately 225 bytes for this scenario
          const satsPerByte = operationType === 'deposit'
            ? btcFeeData.fastestFee
            : btcFeeData.halfHourFee;
          
          const estimatedBytes = 225;
          const totalFee = satsPerByte * estimatedBytes;
          btcFee = (totalFee / 100_000_000).toFixed(8);
        }
      }

      // Estimated time based on operation type
      let estimatedTime;
      switch (operationType) {
        case 'deposit':
          estimatedTime = '~1 hour (requires 12 Bitcoin confirmations)';
          break;
        case 'withdraw':
          estimatedTime = '~1-3 hours (requires 150 Bitcoin confirmations)';
          break;
        case 'transfer':
          estimatedTime = '~2 minutes (single Stacks block confirmation)';
          break;
      }

      return {
        stxFee: stxFeeFormatted,
        btcFee,
        estimatedTime,
      };
    } catch (error) {
      console.error(`Error estimating fees for ${operationType}:`, error);
      throw error;
    }
  }

  /**
   * Deposit BTC to mint sBTC
   * Note: In a real implementation, this function would track the Bitcoin transaction
   * that the user would need to make to deposit BTC. For demonstration purposes,
   * we're showing the contract call that would happen after the Bitcoin deposit is detected.
   */
  async depositBtc(params: SbtcDepositParams): Promise<SbtcOperationResult> {
    try {
      if (!this.userSession.isUserSignedIn()) {
        throw new Error('User not authenticated');
      }

      const userData = this.userSession.loadUserData();
      const senderAddress = userData.profile.stxAddress[this.network];

      // This function would typically be called by the sBTC protocol after detecting a Bitcoin deposit
      // For demonstration, we'll create a simulated deposit transaction
      
      // In reality, users don't call deposit directly - they deposit BTC to a special Bitcoin address
      // and the deposit function is called by the peg system
      
      // For demo purposes, we'll create a contract call to a hypothetical function
      const txOptions = {
        contractAddress: this.sbtcContract.contractAddress,
        contractName: this.sbtcContract.contractName,
        functionName: 'deposit',
        functionArgs: [
          bufferCV(Buffer.from(params.btcTxid, 'hex')),
          uintCV(params.btcVout),
          uintCV(params.amount),
          bufferCV(Buffer.from(params.senderBtcAddress)),
          standardPrincipalCV(params.recipientStxAddress),
        ],
        senderAddress,
        network: this.stacksNetwork,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      // Build and broadcast the transaction
      const transaction = await makeContractCall(txOptions);
      
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      if (broadcastResponse.error) {
        return {
          success: false,
          error: broadcastResponse.error
        };
      }

      return {
        success: true,
        txId: broadcastResponse.txid
      };
    } catch (error) {
      console.error('Error in sBTC deposit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in sBTC deposit'
      };
    }
  }

  /**
   * Withdraw sBTC to receive BTC
   */
  async withdrawSbtc(params: SbtcWithdrawParams): Promise<SbtcOperationResult> {
    try {
      if (!this.userSession.isUserSignedIn()) {
        throw new Error('User not authenticated');
      }

      const userData = this.userSession.loadUserData();
      const senderAddress = userData.profile.stxAddress[this.network];

      // Create post-condition to ensure user has the required amount of sBTC
      const postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress,
          FungibleConditionCode.Equal,
          params.amount,
          `${this.sbtcContract.contractAddress}.${this.sbtcContract.contractName}::${this.sbtcContract.assetName}`
        )
      ];

      // Create contract call transaction
      const txOptions = {
        contractAddress: this.sbtcContract.contractAddress,
        contractName: this.sbtcContract.contractName,
        functionName: 'withdraw',
        functionArgs: [
          uintCV(params.amount),
          bufferCV(Buffer.from(params.recipientBtcAddress)),
        ],
        senderAddress,
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        network: this.stacksNetwork,
        anchorMode: AnchorMode.Any,
      };

      // Build and broadcast the transaction
      const transaction = await makeContractCall(txOptions);
      
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      if (broadcastResponse.error) {
        return {
          success: false,
          error: broadcastResponse.error
        };
      }

      return {
        success: true,
        txId: broadcastResponse.txid
      };
    } catch (error) {
      console.error('Error in sBTC withdrawal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in sBTC withdrawal'
      };
    }
  }

  /**
   * Transfer sBTC to another Stacks address
   */
  async transferSbtc(params: SbtcTransferParams): Promise<SbtcOperationResult> {
    try {
      if (!this.userSession.isUserSignedIn()) {
        throw new Error('User not authenticated');
      }

      const userData = this.userSession.loadUserData();
      const senderAddress = userData.profile.stxAddress[this.network];

      // Create post-condition to ensure user has the required amount of sBTC
      const postConditions = [
        makeStandardFungiblePostCondition(
          senderAddress,
          FungibleConditionCode.Equal,
          params.amount,
          `${this.sbtcContract.contractAddress}.${this.sbtcContract.contractName}::${this.sbtcContract.assetName}`
        )
      ];

      // Set up function arguments with optional memo
      const functionArgs = [
        standardPrincipalCV(params.recipient),
        uintCV(params.amount)
      ];

      if (params.memo) {
        functionArgs.push(bufferCV(Buffer.from(params.memo)));
      }

      // Create contract call transaction
      const txOptions = {
        contractAddress: this.sbtcContract.contractAddress,
        contractName: this.sbtcContract.contractName,
        functionName: 'transfer',
        functionArgs,
        senderAddress,
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        network: this.stacksNetwork,
        anchorMode: AnchorMode.Any,
      };

      // Build and broadcast the transaction
      const transaction = await makeContractCall(txOptions);
      
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      if (broadcastResponse.error) {
        return {
          success: false,
          error: broadcastResponse.error
        };
      }

      return {
        success: true,
        txId: broadcastResponse.txid
      };
    } catch (error) {
      console.error('Error in sBTC transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in sBTC transfer'
      };
    }
  }

  /**
   * Get sBTC transaction history for an address
   */
  async getTransactionHistory(address: string): Promise<any[]> {
    try {
      // Get API endpoint based on network
      const apiUrl = this.network === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

      const contractId = `${this.sbtcContract.contractAddress}.${this.sbtcContract.contractName}`;
      
      // Get transactions involving the address and sBTC
      const response = await fetch(
        `${apiUrl}/extended/v1/address/${address}/transactions_with_transfers?limit=50`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter transactions involving sBTC
      const sbtcTransactions = [];
      
      if (data.results && Array.isArray(data.results)) {
        for (const tx of data.results) {
          // Check if this transaction involves the sBTC contract
          const isSbtcTransaction = 
            // For contract calls
            (tx.tx_type === 'contract_call' && 
             tx.contract_call && 
             tx.contract_call.contract_id === contractId) ||
            // For token transfers
            (tx.ft_transfers && 
             tx.ft_transfers.some(transfer => transfer.asset_identifier === contractId));
          
          if (isSbtcTransaction) {
            // Determine the transaction type
            let transactionType = 'unknown';
            let amount = '0';
            let counterparty = '';
            
            if (tx.tx_type === 'contract_call') {
              transactionType = tx.contract_call.function_name;
              
              // Try to extract amount and recipient from contract call
              if (tx.contract_call.function_args) {
                const amountArg = tx.contract_call.function_args.find(
                  arg => arg.name === 'amount' || arg.name === 'value'
                );
                
                const recipientArg = tx.contract_call.function_args.find(
                  arg => arg.name === 'recipient' || arg.name === 'to'
                );
                
                if (amountArg && amountArg.repr) {
                  // Extract numeric value
                  const match = amountArg.repr.match(/(\d+)/);
                  if (match) {
                    amount = match[0];
                  }
                }
                
                if (recipientArg && recipientArg.repr) {
                  // Extract address
                  counterparty = recipientArg.repr.replace(/['"]/g, '');
                }
              }
            } else if (tx.ft_transfers) {
              // Find the sBTC transfer
              const sbtcTransfer = tx.ft_transfers.find(
                transfer => transfer.asset_identifier === contractId
              );
              
              if (sbtcTransfer) {
                transactionType = 'transfer';
                amount = sbtcTransfer.amount;
                
                // Determine counterparty based on direction
                if (sbtcTransfer.sender === address) {
                  counterparty = sbtcTransfer.recipient;
                } else {
                  counterparty = sbtcTransfer.sender;
                }
              }
            }
            
            // Convert amount to readable format
            const formattedAmount = this.formatSbtcAmount(BigInt(amount));
            
            // Add transaction to the list
            sbtcTransactions.push({
              txid: tx.tx_id,
              type: transactionType,
              amount: formattedAmount,
              rawAmount: amount,
              counterparty,
              sender: tx.sender_address,
              timestamp: tx.burn_block_time_iso,
              status: tx.tx_status,
              blockHeight: tx.block_height,
              events: tx.events || []
            });
          }
        }
      }
      
      return sbtcTransactions;
    } catch (error) {
      console.error('Error fetching sBTC transaction history:', error);
      throw error;
    }
  }

  /**
   * Format sBTC amount (8 decimals)
   */
  private formatSbtcAmount(amount: bigint): string {
    const amountStr = amount.toString();
    if (amountStr === '0') return '0';
    
    // sBTC has 8 decimal places (like Bitcoin)
    if (amountStr.length <= 8) {
      return `0.${'0'.repeat(8 - amountStr.length)}${amountStr}`;
    }
    
    const integerPart = amountStr.slice(0, amountStr.length - 8);
    const decimalPart = amountStr.slice(amountStr.length - 8);
    
    return `${integerPart}.${decimalPart}`;
  }
}