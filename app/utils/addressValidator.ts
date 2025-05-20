/**
 * Validates a Bitcoin address
 * We're using simple regex patterns here, but in a production app you'd use a library
 * like 'bitcoin-address-validation'
 */
export function validateBitcoinAddress(address: string): boolean {
  // If address is not a string or empty, it's not valid
  if (typeof address !== 'string' || !address) {
    return false;
  }
  
  // Basic validation for different Bitcoin address formats
  
  // P2PKH addresses start with 1
  const p2pkhRegex = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // P2SH addresses start with 3
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // Bech32 addresses start with bc1
  const bech32Regex = /^bc1[a-zA-HJ-NP-Z0-9]{25,89}$/;
  
  // Testnet addresses start with m, n, or 2
  const testnetRegex = /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // Testnet bech32 addresses start with tb1
  const testnetBech32Regex = /^tb1[a-zA-HJ-NP-Z0-9]{25,89}$/;
  
  return (
    p2pkhRegex.test(address) || 
    p2shRegex.test(address) || 
    bech32Regex.test(address) ||
    testnetRegex.test(address) ||
    testnetBech32Regex.test(address)
  );
}

/**
 * Validates a Stacks address
 * Stacks addresses start with 'SP' for mainnet and 'ST' for testnet
 */
export function validateStacksAddress(address: string): boolean {
  // If address is not a string or empty, it's not valid
  if (typeof address !== 'string' || !address) {
    return false;
  }
  
  // Mainnet addresses start with SP
  const mainnetRegex = /^SP[A-Z0-9]{33}$/;
  
  // Testnet addresses start with ST
  const testnetRegex = /^ST[A-Z0-9]{33}$/;
  
  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Determines if a string is likely a transaction hash
 */
export function isTransactionHash(str: string): boolean {
  // Bitcoin transaction IDs are 64 hex chars
  const bitcoinTxRegex = /^[0-9a-f]{64}$/i;
  
  // Stacks transaction IDs start with "0x" followed by 64 hex chars
  const stacksTxRegex = /^0x[0-9a-f]{64}$/i;
  
  return bitcoinTxRegex.test(str) || stacksTxRegex.test(str);
}

/**
 * Determine the type of hash (bitcoin or stacks)
 */
export function getTransactionType(txHash: string): 'bitcoin' | 'stacks' | 'unknown' {
  // Bitcoin transaction IDs are 64 hex chars
  if (/^[0-9a-f]{64}$/i.test(txHash)) {
    return 'bitcoin';
  }
  
  // Stacks transaction IDs start with "0x" followed by 64 hex chars
  if (/^0x[0-9a-f]{64}$/i.test(txHash)) {
    return 'stacks';
  }
  
  return 'unknown';
}