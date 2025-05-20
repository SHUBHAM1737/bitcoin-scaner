// app/utils/sbtcAnalyzer.ts
import { SBTC_CONTRACT_ADDRESS } from '@/app/config/blockchain';

// Operation types
export type SbtcOperationType = 'deposit' | 'withdrawal' | 'transfer' | 'unknown';

// Interface for an sBTC operation
export interface SbtcOperation {
  txId: string;
  type: SbtcOperationType;
  sender: string;
  recipient?: string;
  amount: string;
  status: 'pending' | 'complete' | 'failed';
  timestamp: string;
  blockHeight?: number;
  bitcoinTxId?: string;
  fee?: string;
  memo?: string;
  contractId?: string;
  functionName?: string;
  gasCostAnalysis?: {
    costInSTX: string;
    costInUSD: string;
    comparison: 'low' | 'average' | 'high';
    optimization?: string;
  };
}

/**
 * Analyzes a Stacks transaction to determine if it's an sBTC operation
 * and extracts detailed information about the operation
 */
export const analyzeSbtcOperation = (tx: any, network: 'mainnet' | 'testnet' = 'mainnet'): SbtcOperation | null => {
  // If there's no transaction data, return null
  if (!tx) return null;
  
  // Check if this is potentially an sBTC transaction
  const sbtcContractAddress = SBTC_CONTRACT_ADDRESS[network];
  
  let isSbtcOperation = false;
  let operationType: SbtcOperationType = 'unknown';
  let contractId = '';
  let functionName = '';
  let recipient = '';
  let amount = '0';
  let bitcoinTxId = '';
  let memo = '';
  
  // Check if it's a contract call
  if (tx.tx_type === 'contract_call' && tx.contract_call) {
    contractId = tx.contract_call.contract_id;
    functionName = tx.contract_call.function_name;
    
    // Check if it's related to sBTC
    if (
      contractId.includes(sbtcContractAddress) ||
      contractId.toLowerCase().includes('sbtc') ||
      contractId.toLowerCase().includes('wrapped-bitcoin')
    ) {
      isSbtcOperation = true;
      
      // Determine operation type based on function name
      const fn = functionName.toLowerCase();
      if (fn.includes('deposit') || fn.includes('mint') || fn.includes('wrap')) {
        operationType = 'deposit';
      } else if (fn.includes('withdraw') || fn.includes('burn') || fn.includes('unwrap')) {
        operationType = 'withdrawal';
      } else if (fn.includes('transfer')) {
        operationType = 'transfer';
      }
      
      // Extract arguments like recipient and amount
      if (tx.contract_call.function_args) {
        for (const arg of tx.contract_call.function_args) {
          if ((arg.name === 'recipient' || arg.name === 'to') && arg.repr) {
            recipient = arg.repr.replace(/['"]/g, '');
          }
          if ((arg.name === 'amount' || arg.name === 'value') && arg.repr) {
            // Try to parse the amount
            const match = arg.repr.match(/(\d+)/);
            if (match) {
              amount = match[0];
            }
          }
          if (arg.name === 'memo' && arg.repr) {
            try {
              // Try to decode memo from hex
              if (arg.repr.startsWith('0x')) {
                const hex = arg.repr.slice(2);
                memo = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
              } else {
                memo = arg.repr;
              }
            } catch (e) {
              console.warn('Failed to decode memo:', e);
            }
          }
        }
      }
    }
  }
  
  // Check if it's a token transfer
  else if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
    const assetId = tx.token_transfer.asset_identifier;
    
    if (
      assetId && (
        assetId.includes(sbtcContractAddress) ||
        assetId.toLowerCase().includes('sbtc') ||
        assetId.toLowerCase().includes('wrapped-bitcoin')
      )
    ) {
      isSbtcOperation = true;
      operationType = 'transfer';
      recipient = tx.token_transfer.recipient_address || '';
      amount = tx.token_transfer.amount || '0';
      
      if (tx.token_transfer.memo) {
        try {
          // Try to decode memo from hex
          const hex = tx.token_transfer.memo.startsWith('0x') 
            ? tx.token_transfer.memo.slice(2) 
            : tx.token_transfer.memo;
          memo = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
        } catch (e) {
          console.warn('Failed to decode memo:', e);
        }
      }
    }
  }
  
  // If it's not an sBTC operation, return null
  if (!isSbtcOperation) return null;
  
  // Look for Bitcoin transaction ID in events
  if (tx.events) {
    for (const event of tx.events) {
      if (
        (event.event_type === 'bitcoin_tx_id' || event.event_type === 'print') &&
        event.value
      ) {
        // Try to extract a Bitcoin transaction ID (64 hex chars)
        const btcTxMatch = typeof event.value === 'string' 
          ? event.value.match(/[0-9a-f]{64}/i) 
          : null;
        
        if (btcTxMatch) {
          bitcoinTxId = btcTxMatch[0];
          break;
        }
      }
    }
  }
  
  // Format amount assuming 8 decimal places for sBTC
  const formattedAmount = formatSbtcAmount(amount);
  
  // Calculate gas usage and provide optimization suggestions
  let gasCostAnalysis;
  if (tx.fee_rate) {
    const feeRate = (parseInt(tx.fee_rate) / 1000000).toFixed(6);
    
    // Example fee rate comparisons (these would need to be dynamically fetched in production)
    const lowFee = '0.00010';
    const avgFee = '0.00050';
    const highFee = '0.00090';
    
    // Determine if this fee is low, average, or high
    let comparison: 'low' | 'average' | 'high' = 'average';
    let optimization: string | undefined;
    
    if (parseFloat(feeRate) <= parseFloat(lowFee)) {
      comparison = 'low';
    } else if (parseFloat(feeRate) >= parseFloat(highFee)) {
      comparison = 'high';
      optimization = 'Consider batching multiple sBTC operations together or using a lower fee rate during periods of lower network activity.';
    }
    
    // Mock USD conversion (would need real exchange rate in production)
    const stxToUsd = 0.45; // Example rate
    const usdCost = (parseFloat(feeRate) * stxToUsd).toFixed(4);
    
    gasCostAnalysis = {
      costInSTX: feeRate,
      costInUSD: usdCost,
      comparison,
      optimization
    };
  }
  
  // Build the sBTC operation object
  return {
    txId: tx.tx_id,
    type: operationType,
    sender: tx.sender_address,
    recipient,
    amount: formattedAmount,
    status: tx.tx_status === 'success' ? 'complete' : 
           tx.tx_status === 'pending' ? 'pending' : 'failed',
    timestamp: tx.burn_block_time_iso || new Date().toISOString(),
    blockHeight: tx.block_height,
    bitcoinTxId,
    fee: tx.fee_rate ? (parseInt(tx.fee_rate) / 1000000).toFixed(6) : undefined,
    memo,
    contractId,
    functionName,
    gasCostAnalysis
  };
};

/**
 * Generates specialized insights for different sBTC operation types
 */
export const generateSbtcInsights = (operation: SbtcOperation): string[] => {
  const insights: string[] = [];
  
  // Common insights for all operations
  insights.push(`This is an sBTC ${operation.type} operation involving ${operation.amount} sBTC.`);
  
  // Add specific insights based on operation type
  switch (operation.type) {
    case 'deposit':
      insights.push('sBTC deposits lock real BTC in the Stacks Bitcoin wallet and mint an equivalent amount of sBTC on the Stacks blockchain.');
      if (operation.bitcoinTxId) {
        insights.push(`This operation is linked to a Bitcoin transaction (${operation.bitcoinTxId.substring(0, 8)}...${operation.bitcoinTxId.substring(60)}).`);
      } else {
        insights.push('The linked Bitcoin transaction was not found in the transaction events. This might be a pending operation.');
      }
      break;
      
    case 'withdrawal':
      insights.push('sBTC withdrawals burn sBTC on the Stacks blockchain and release real BTC from the Stacks Bitcoin wallet.');
      if (operation.status === 'pending') {
        insights.push('This withdrawal is still pending. It typically takes 150+ Bitcoin confirmations before BTC is released.');
      } else if (operation.status === 'complete' && operation.bitcoinTxId) {
        insights.push(`The BTC was released in Bitcoin transaction ${operation.bitcoinTxId.substring(0, 8)}...${operation.bitcoinTxId.substring(60)}.`);
      }
      break;
      
    case 'transfer':
      insights.push('sBTC transfers move sBTC between addresses on the Stacks blockchain without affecting the underlying BTC.');
      insights.push('Transfers are fast and typically finalize within minutes, unlike cross-chain operations that require Bitcoin confirmations.');
      break;
      
    default:
      insights.push('This appears to be a custom interaction with the sBTC contract.');
  }
  
  // Add gas optimization insights
  if (operation.gasCostAnalysis) {
    if (operation.gasCostAnalysis.comparison === 'high') {
      insights.push(`The gas cost for this transaction (${operation.gasCostAnalysis.costInSTX} STX, $${operation.gasCostAnalysis.costInUSD}) is relatively high.`);
      if (operation.gasCostAnalysis.optimization) {
        insights.push(operation.gasCostAnalysis.optimization);
      }
    } else if (operation.gasCostAnalysis.comparison === 'low') {
      insights.push(`The gas cost for this transaction (${operation.gasCostAnalysis.costInSTX} STX, $${operation.gasCostAnalysis.costInUSD}) is very efficient.`);
    }
  }
  
  return insights;
};

/**
 * Format sBTC amount (8 decimals)
 */
export const formatSbtcAmount = (amount: string): string => {
  if (!amount || amount === '0') return '0';
  
  // Convert to number for formatting
  const amountNum = parseInt(amount);
  if (isNaN(amountNum)) return '0';
  
  // sBTC has 8 decimal places (like Bitcoin)
  const amountStr = amountNum.toString();
  if (amountStr.length <= 8) {
    return `0.${'0'.repeat(8 - amountStr.length)}${amountStr}`;
  }
  
  const integerPart = amountStr.slice(0, amountStr.length - 8);
  const decimalPart = amountStr.slice(amountStr.length - 8);
  
  return `${integerPart}.${decimalPart}`;
};