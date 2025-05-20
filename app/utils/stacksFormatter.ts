// app/utils/stacksFormatter.ts
import { StacksTransaction } from '@/app/services/stacksApiService';
import { SBTC_CONTRACT_ADDRESS, SBTC_BRIDGE_CONTRACT_ADDRESS } from '@/app/config/blockchain';
import { formatAddress } from './formatUtils';

/**
 * Format the value amount based on the token type
 * For STX, divide by 1000000 (Stacks uses 6 decimal places)
 */
export const formatStacksValue = (value: string | number | undefined, decimals: number = 6): string => {
  if (!value && value !== 0) return '0';
  
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return (numValue / Math.pow(10, decimals)).toFixed(decimals);
};

/**
 * Format memo from hex to string if present
 */
export const formatStacksMemo = (memoHex: string | undefined): string => {
  if (!memoHex || memoHex === '0x') return '';
  
  try {
    // Remove 0x prefix if present
    const hex = memoHex.startsWith('0x') ? memoHex.slice(2) : memoHex;
    
    // Convert hex to string
    const decoded = Buffer.from(hex, 'hex').toString('utf8');
    
    // Remove null bytes
    return decoded.replace(/\0/g, '').trim();
  } catch (error) {
    console.error('Error decoding memo:', error);
    return '';
  }
};

/**
 * Check if a contract ID is related to sBTC
 */
export const isSbtcContract = (contractId: string | undefined, subNetwork: 'mainnet' | 'testnet' = 'mainnet'): boolean => {
  if (!contractId) return false;
  
  // Known sBTC contract IDs
  const sbtcContracts = [
    SBTC_CONTRACT_ADDRESS[subNetwork],
    SBTC_BRIDGE_CONTRACT_ADDRESS[subNetwork],
    // Add any other known sBTC contracts here
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-bitcoin',
    'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.sbtc-token'
  ];
  
  return sbtcContracts.some(contract => contractId.includes(contract));
};

/**
 * Determine if a transaction is sBTC-related
 */
export const isSbtcTransaction = (tx: StacksTransaction, subNetwork: 'mainnet' | 'testnet' = 'mainnet'): boolean => {
  // Check if it's a contract call to an sBTC contract
  if (tx.tx_type === 'contract_call' && tx.contract_call) {
    return isSbtcContract(tx.contract_call.contract_id, subNetwork);
  }
  
  // Check if it's a token transfer of an sBTC token
  if (tx.tx_type === 'token_transfer' && tx.token_transfer && tx.token_transfer.asset_identifier) {
    return isSbtcContract(tx.token_transfer.asset_identifier, subNetwork);
  }
  
  // Check events for sBTC-related activity
  if (tx.events && tx.events.length > 0) {
    return tx.events.some(event => {
      if (event.asset_identifier) {
        return isSbtcContract(event.asset_identifier, subNetwork);
      }
      if (event.contract_identifier) {
        return isSbtcContract(event.contract_identifier, subNetwork);
      }
      return false;
    });
  }
  
  return false;
};

/**
 * Determine the transaction type and return a human-readable string
 */
export const getTransactionTypeDisplay = (tx: StacksTransaction): string => {
  switch (tx.tx_type) {
    case 'token_transfer':
      return 'STX Transfer';
    case 'contract_call':
      if (tx.contract_call) {
        // Check if it's an sBTC operation
        const contractId = tx.contract_call.contract_id.toLowerCase();
        
        if (contractId.includes('sbtc') || contractId.includes('bridge') || contractId.includes('bitcoin')) {
          const functionName = tx.contract_call.function_name.toLowerCase();
          
          if (functionName.includes('deposit') || functionName.includes('mint')) {
            return 'sBTC Deposit';
          } else if (functionName.includes('withdraw') || functionName.includes('burn')) {
            return 'sBTC Withdrawal';
          } else if (functionName.includes('transfer')) {
            return 'sBTC Transfer';
          }
          
          return 'sBTC Operation';
        }
        
        return `Contract Call: ${tx.contract_call.function_name}`;
      }
      return 'Contract Call';
    case 'smart_contract':
      return 'Contract Deployment';
    case 'coinbase':
      return 'Coinbase';
    default:
      return tx.tx_type.charAt(0).toUpperCase() + tx.tx_type.slice(1).replace(/_/g, ' ');
  }
};

/**
 * Extract sBTC operation details from a transaction
 */
export const extractSbtcOperationDetails = (tx: StacksTransaction) => {
  if (!isSbtcTransaction(tx)) {
    return null;
  }
  
  let operationType = 'Unknown';
  let amount = '0';
  let recipient = '';
  let bitcoinTxId = '';
  
  // Extract information from contract call
  if (tx.tx_type === 'contract_call' && tx.contract_call) {
    const functionName = tx.contract_call.function_name.toLowerCase();
    
    if (functionName.includes('deposit') || functionName.includes('mint')) {
      operationType = 'Deposit';
    } else if (functionName.includes('withdraw') || functionName.includes('burn')) {
      operationType = 'Withdrawal';
    } else if (functionName.includes('transfer')) {
      operationType = 'Transfer';
    }
    
    // Try to extract amount and recipient from function args
    if (tx.contract_call.function_args) {
      const amountArg = tx.contract_call.function_args.find(arg => 
        arg.name === 'amount' || arg.name === 'value'
      );
      
      const recipientArg = tx.contract_call.function_args.find(arg => 
        arg.name === 'recipient' || arg.name === 'to'
      );
      
      if (amountArg && amountArg.repr) {
        // Try to extract numeric value (this is a simple approach, adjust as needed)
        const match = amountArg.repr.match(/(\d+)/);
        if (match) {
          amount = match[0];
        }
      }
      
      if (recipientArg && recipientArg.repr) {
        // Extract address (remove quotes, 0x, etc.)
        recipient = recipientArg.repr.replace(/['"]|0x/g, '');
      }
    }
  }
  
  // Extract information from token transfer
  else if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
    operationType = 'Transfer';
    amount = tx.token_transfer.amount || '0';
    recipient = tx.token_transfer.recipient_address || '';
  }
  
  // Look for Bitcoin transaction ID in events
  if (tx.events) {
    const btcTxEvent = tx.events.find(event => 
      event.event_type === 'bitcoin_tx_id' || 
      (event.event_type === 'print' && event.value && event.value.includes('tx'))
    );
    
    if (btcTxEvent && btcTxEvent.value) {
      bitcoinTxId = typeof btcTxEvent.value === 'string' ? 
        btcTxEvent.value.replace(/['"]|0x/g, '') : 
        '';
    }
  }
  
  return {
    operationType,
    amount: formatStacksValue(amount),
    sender: tx.sender_address,
    recipient: recipient || 'Unknown',
    status: tx.tx_status === 'success' ? 'Completed' : 
           tx.tx_status === 'pending' ? 'Pending' : 'Failed',
    bitcoinTxId
  };
};

/**
 * Format a full Stacks transaction for display with improved data handling
 */
export const formatStacksTransaction = (tx: StacksTransaction) => {
  // Handle null or undefined tx
  if (!tx) {
    console.error('Received null or undefined transaction to format');
    return {
      id: 'Unknown',
      type: 'Unknown',
      status: 'Unknown',
      sender: 'Unknown',
      senderFull: 'Unknown',
      blockHeight: undefined,
      timestamp: undefined,
      fee: '0',
      isSbtc: false,
      value: '0',
      recipient: 'Unknown',
      memo: '',
      contractId: '',
      functionName: '',
      sbtcDetails: null,
      confirmations: 0,
      network: 'mainnet'
    };
  }

  // Extract network from tx data if available (added by our enhanced getTransaction method)
  const networkType = tx.network || 'mainnet';
  
  // Get formatted transaction type
  const txType = getTransactionTypeDisplay(tx);
  
  // Calculate confirmations if block_height is available
  let confirmations = 0;
  if (tx.confirmations) {
    // Use pre-calculated confirmations if available
    confirmations = tx.confirmations;
  } else if (tx.block_height && tx.block_height > 0) {
    // Otherwise set to 1 for confirmed transactions
    confirmations = 1;
  }
  
  // Format timestamp
  let formattedTimestamp = 'Unknown';
  if (tx.burn_block_time_iso) {
    try {
      formattedTimestamp = new Date(tx.burn_block_time_iso).toLocaleString();
    } catch (e) {
      console.warn('Failed to format timestamp:', e);
      formattedTimestamp = tx.burn_block_time_iso;
    }
  } else if (tx.burn_block_time) {
    try {
      formattedTimestamp = new Date(tx.burn_block_time * 1000).toLocaleString();
    } catch (e) {
      console.warn('Failed to format timestamp from unix time:', e);
      formattedTimestamp = `${tx.burn_block_time}`;
    }
  }
  
  // Initialize the formatted transaction object with safe defaults
  const formattedTx = {
    id: tx.tx_id || 'Unknown',
    type: txType || 'Unknown',
    status: tx.tx_status || 'Unknown',
    sender: formatAddress(tx.sender_address || 'Unknown'),
    senderFull: tx.sender_address || 'Unknown',
    blockHeight: tx.block_height !== undefined ? tx.block_height : undefined,
    timestamp: formattedTimestamp,
    fee: formatStacksValue(tx.fee_rate || '0'),
    isSbtc: isSbtcTransaction(tx, networkType as 'mainnet' | 'testnet'),
    value: '0',
    recipient: '',
    memo: '',
    contractId: '',
    functionName: '',
    sbtcDetails: null,
    confirmations: confirmations,
    network: networkType
  };
  
  // Add token transfer specific info
  if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
    formattedTx.value = formatStacksValue(tx.token_transfer.amount || '0');
    formattedTx.recipient = tx.token_transfer.recipient_address || 'Unknown';
    
    if (tx.token_transfer.memo) {
      formattedTx.memo = formatStacksMemo(tx.token_transfer.memo);
    }
  }
  
  // Add contract call specific info
  else if (tx.tx_type === 'contract_call' && tx.contract_call) {
    formattedTx.contractId = tx.contract_call.contract_id || 'Unknown';
    formattedTx.functionName = tx.contract_call.function_name || 'Unknown';
    
    // Extract contract arguments if available
    if (tx.contract_call.function_args && tx.contract_call.function_args.length > 0) {
      formattedTx.args = tx.contract_call.function_args.map(arg => {
        return {
          name: arg.name || 'unnamed',
          type: arg.type || 'unknown',
          value: arg.repr || 'unknown'
        };
      });
    }
    
    // Add contract details if available (added by our enhanced getTransaction method)
    if (tx.contract_details) {
      formattedTx.contractDetails = tx.contract_details;
    }
  }
  
  // Add smart contract specific info
  else if (tx.tx_type === 'smart_contract' && tx.smart_contract) {
    formattedTx.contractId = tx.smart_contract.contract_id || 'Unknown';
  }
  
  // Add sBTC specific info if applicable
  if (formattedTx.isSbtc) {
    formattedTx.sbtcDetails = extractSbtcOperationDetails(tx);
  }
  
  return formattedTx;
};