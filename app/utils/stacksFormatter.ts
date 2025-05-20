// app/utils/stacksFormatter.ts
import { StacksTransaction, StacksContractCallTransaction, StacksTokenTransferTransaction } from '@/app/services/stacksApiService'; // Ensure StacksTransaction is correctly typed
import { SBTC_CONTRACT_ADDRESS, SBTC_BRIDGE_CONTRACT_ADDRESS } from '@/app/config/blockchain';
import { formatAddress } from './formatUtils'; // Keep this
import { analyzeSbtcOperation, SbtcOperation } from './sbtcAnalyzer'; // Import from sbtcAnalyzer

/**
 * Format the value amount based on the token type
 * For STX, divide by 1000000 (Stacks uses 6 decimal places)
 * For other FTs, you might need different decimal logic or pass decimals.
 */
export const formatStacksValue = (value: string | number | undefined, decimals: number = 6): string => {
  if (value === undefined || value === null || value === '') return '0';
  
  const numValue = typeof value === 'string' ? BigInt(value) : BigInt(Math.round(Number(value))); // Use BigInt for precision with micro-units
  
  if (numValue === 0n) return '0';

  const factor = BigInt(Math.pow(10, decimals));
  const integerPart = numValue / factor;
  const fractionalPart = numValue % factor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, ''); // Remove trailing zeros from decimal part
  return `${integerPart}.${fractionalStr === '' ? '0' : fractionalStr}`;
};

export const formatStacksMemo = (memoHex: string | undefined): string => {
  if (!memoHex || memoHex === '0x' || memoHex === '') return '';
  try {
    const hex = memoHex.startsWith('0x') ? memoHex.slice(2) : memoHex;
    if (hex.length === 0) return '';
    const decoded = Buffer.from(hex, 'hex').toString('utf8');
    return decoded.replace(/\0/g, '').trim(); // Remove null bytes and trim
  } catch (error) {
    console.error('Error decoding memo:', memoHex, error);
    return 'Error decoding memo'; // Or return the hex itself, or an empty string
  }
};

export const isSbtcContract = (contractId: string | undefined, subNetwork: 'mainnet' | 'testnet' = 'mainnet'): boolean => {
  if (!contractId) return false;
  const sbtcContracts = [
    SBTC_CONTRACT_ADDRESS[subNetwork],
    SBTC_BRIDGE_CONTRACT_ADDRESS[subNetwork],
    'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.sbtc-token', // Example, ensure these are correct
    // Add other known sBTC or wrapped Bitcoin contract identifiers
  ];
  return sbtcContracts.some(knownContract => contractId.includes(knownContract));
};

export const isStacksSbtcTransaction = (tx: StacksTransaction, subNetwork: 'mainnet' | 'testnet' = 'mainnet'): boolean => {
  if (!tx) return false;
  if (tx.tx_type === 'contract_call') {
    const ccTx = tx as StacksContractCallTransaction;
    if (ccTx.contract_call && isSbtcContract(ccTx.contract_call.contract_id, subNetwork)) return true;
  }
  if (tx.tx_type === 'token_transfer') {
    const ttTx = tx as StacksTokenTransferTransaction;
    if (ttTx.token_transfer && isSbtcContract(ttTx.token_transfer.asset_identifier, subNetwork)) return true;
  }
  if (tx.events?.some(event => 
      (event.contract_identifier && isSbtcContract(event.contract_identifier, subNetwork)) ||
      (event.asset && event.asset.asset_id && isSbtcContract(event.asset.asset_id, subNetwork)) ||
      (event.asset_identifier && isSbtcContract(event.asset_identifier, subNetwork))
  )) {
    return true;
  }
  return false;
};


export const getTransactionTypeDisplay = (tx: StacksTransaction): string => {
  switch (tx.tx_type) {
    case 'token_transfer':
      const ttTx = tx as StacksTokenTransferTransaction;
      if (ttTx.token_transfer?.asset_identifier?.includes('stx')) { // Heuristic for STX
        return 'STX Transfer';
      }
      // Add more specific FT naming if possible from asset_identifier
      return `Token Transfer (${ttTx.token_transfer?.asset_identifier ? formatAddress(ttTx.token_transfer.asset_identifier.split('::')[1] || ttTx.token_transfer.asset_identifier) : 'Unknown Token'})`;
    case 'contract_call':
      const ccTx = tx as StacksContractCallTransaction;
      if (ccTx.contract_call) {
        if (isStacksSbtcTransaction(tx, tx.network || 'mainnet')) {
            const sbtcOp = analyzeSbtcOperation(tx, tx.network || 'mainnet');
            if (sbtcOp) return `sBTC ${sbtcOp.type.charAt(0).toUpperCase() + sbtcOp.type.slice(1)}`;
            return 'sBTC Operation';
        }
        return `Contract Call: ${ccTx.contract_call.function_name || 'Unknown Function'}`;
      }
      return 'Contract Call';
    case 'smart_contract':
      return 'Contract Deployment';
    case 'coinbase':
      return 'Coinbase';
    case 'poison-microblock': // Hiro API can return this
      return 'Poison Microblock';
    default:
      return tx.tx_type ? tx.tx_type.charAt(0).toUpperCase() + tx.tx_type.slice(1).replace(/_/g, ' ') : 'Unknown Transaction';
  }
};


export const formatStacksTransaction = (tx: StacksTransaction | null) => {
  if (!tx) {
    console.warn('formatStacksTransaction received null or undefined transaction');
    return { /* return a default empty-like structure or throw error */
      id: 'Unknown', type: 'Unknown', status: 'Unknown', sender: 'Unknown', senderFull: 'Unknown',
      blockHeight: undefined, timestamp: 'Unknown', fee: '0', isSbtc: false, value: '0', recipient: '',
      memo: '', contractId: '', functionName: '', sbtcDetails: null, confirmations: 0, network: 'mainnet',
      contract_call_details: null, token_transfer_details: null, raw_tx: null
    };
  }

  const networkType = tx.network || 'mainnet';
  const txTypeDisplay = getTransactionTypeDisplay(tx);
  
  let confirmations = tx.confirmations || 0;
  if (!confirmations && tx.block_height && tx.block_height > 0 && tx.tx_status === 'success') {
    confirmations = 1; // At least 1 if in a block and successful
  }
  
  let formattedTimestamp = 'Unknown';
  if (tx.burn_block_time_iso) {
    try {
      formattedTimestamp = new Date(tx.burn_block_time_iso).toLocaleString();
    } catch (e) { formattedTimestamp = tx.burn_block_time_iso; }
  } else if (tx.burn_block_time) {
    try {
      formattedTimestamp = new Date(tx.burn_block_time * 1000).toLocaleString();
    } catch (e) { formattedTimestamp = `${tx.burn_block_time}`; }
  }

  const formattedTx: any = { // Use 'any' for flexibility or define a very comprehensive type
    id: tx.tx_id || 'Unknown',
    type: txTypeDisplay,
    status: tx.tx_status || 'Unknown',
    sender: formatAddress(tx.sender_address || 'Unknown'),
    senderFull: tx.sender_address || 'Unknown',
    blockHeight: tx.block_height,
    timestamp: formattedTimestamp,
    fee: formatStacksValue(tx.fee_rate || '0'), // fee_rate is in microSTX
    isSbtc: isStacksSbtcTransaction(tx, networkType as 'mainnet' | 'testnet'),
    value: '0', // This will be for STX transfers
    recipient: '',
    memo: '',
    contractId: '',
    functionName: '',
    args: [],
    sbtcDetails: null,
    confirmations: confirmations,
    network: networkType,
    raw_tx: tx, // Include the raw transaction for debugging or deeper AI inspection
  };

  // Populate STX transfer details
  if (tx.stx_transfers && tx.stx_transfers.length > 0) {
    // Summing up all STX transfers if multiple, or taking the first.
    // For simplicity, let's take the primary (first) transfer or sum if relevant for the use case.
    let totalStxTransferred = 0n;
    tx.stx_transfers.forEach(stxTx => totalStxTransferred += BigInt(stxTx.amount || '0'));
    formattedTx.value = formatStacksValue(totalStxTransferred.toString()); // Already in microSTX

    if (tx.stx_transfers.length === 1) {
        formattedTx.recipient = tx.stx_transfers[0].recipient || 'Unknown';
        if (tx.stx_transfers[0].memo) {
            formattedTx.memo = formatStacksMemo(tx.stx_transfers[0].memo);
        }
    } else if (tx.stx_transfers.length > 1) {
        formattedTx.recipient = "Multiple Recipients"; // Or aggregate logic
        // Memo handling for multiple transfers can be complex, maybe list them or take first.
    }
  }

  // Populate contract call details
  if (tx.tx_type === 'contract_call') {
    const ccTx = tx as StacksContractCallTransaction;
    if (ccTx.contract_call) {
        formattedTx.contractId = ccTx.contract_call.contract_id || 'Unknown';
        formattedTx.functionName = ccTx.contract_call.function_name || 'Unknown';
        formattedTx.args = ccTx.contract_call.function_args?.map(arg => ({
            name: arg.name || 'unnamed',
            type: arg.type || 'unknown',
            value: arg.repr || 'unknown'
        })) || [];
    }
  }

  // Populate smart contract deployment details
  else if (tx.tx_type === 'smart_contract') {
    const scTx = tx as StacksSmartContractTransaction;
    if (scTx.smart_contract) {
        formattedTx.contractId = scTx.smart_contract.contract_id || 'Unknown';
        // Could add source_code if needed, but it's large: scTx.smart_contract.source_code
    }
  }

  // Populate FT transfer details (distinct from STX value)
  if (tx.ft_transfers && tx.ft_transfers.length > 0) {
    formattedTx.ft_transfer_details = tx.ft_transfers.map(ft_tx => ({
        asset_identifier: ft_tx.asset_identifier || 'Unknown Asset',
        recipient_address: ft_tx.recipient || 'Unknown Recipient',
        sender_address: ft_tx.sender || 'Unknown Sender',
        amount: ft_tx.amount, // Raw amount
        // formatted_amount: formatStacksValue(ft_tx.amount, appropriate_decimals_for_asset), // Need decimals for each FT
    }));
  }
  
  // Populate sBTC specific info using sbtcAnalyzer
  if (formattedTx.isSbtc) {
    const sbtcAnalysis = analyzeSbtcOperation(tx, networkType as 'mainnet' | 'testnet');
    if (sbtcAnalysis) {
        formattedTx.sbtcDetails = {
            type: sbtcAnalysis.type,
            amount: sbtcAnalysis.amount, // This is sBTC amount
            sender: sbtcAnalysis.sender,
            recipient: sbtcAnalysis.recipient || 'N/A',
            status: sbtcAnalysis.status,
            bitcoinTxId: sbtcAnalysis.bitcoinTxId || 'N/A',
            fee: sbtcAnalysis.fee, // STX fee for the sBTC op
            memo: sbtcAnalysis.memo,
            contractId: sbtcAnalysis.contractId,
            functionName: sbtcAnalysis.functionName,
            gasCostAnalysis: sbtcAnalysis.gasCostAnalysis
        };
        // If the primary value of the tx is sBTC, you might want to reflect that in `formattedTx.value`
        // or have a separate field for primary asset value.
        // For now, `formattedTx.value` is for STX. sBTC value is in `sbtcDetails.amount`.
    }
  }

  return formattedTx;
};