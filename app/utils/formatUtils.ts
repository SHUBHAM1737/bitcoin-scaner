/**
 * Formats an address for display by shortening it
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  
  // For Bitcoin-style addresses (generally longer)
  if (address.startsWith('1') || 
      address.startsWith('3') || 
      address.startsWith('bc1') || 
      address.startsWith('tb1') || 
      address.startsWith('m') || 
      address.startsWith('n') || 
      address.startsWith('2')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  // For Stacks addresses (SP or ST prefix plus 33 chars)
  if (address.startsWith('SP') || address.startsWith('ST')) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  // For Stacks transactions (0x prefix)
  if (address.startsWith('0x')) {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }
  
  // Default format for other address types
  if (address.length > 16) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  return address;
};

/**
 * Formats a number with appropriate decimal places
 */
export const formatValue = (value: string | number | undefined, decimals: number = 6): string => {
  if (value === undefined || value === null) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN case
  if (isNaN(numValue)) return '0';
  
  // Format based on size
  if (numValue === 0) return '0';
  if (numValue < 0.000001) return numValue.toExponential(2);
  
  return numValue.toFixed(decimals);
};

/**
 * Extracts complexity badge from the message content
 */
export const extractComplexityBadge = (content: string): string => {
  const complexityMatch = content.match(/complexity score: (Simple|Moderate|Complex|Very Complex)/i);
  if (!complexityMatch) return '';
  
  const complexity = complexityMatch[1].toLowerCase();
  const colorClass = {
    'simple': 'bg-green-100 text-green-800 border border-green-200',
    'moderate': 'bg-blue-100 text-blue-800 border border-blue-200',
    'complex': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'very complex': 'bg-red-100 text-red-800 border border-red-200'
  }[complexity] || 'bg-gray-100 text-gray-800 border border-gray-200';

  return `<span class="ml-auto px-4 py-1.5 text-sm font-medium rounded-full ${colorClass}">${complexityMatch[1]}</span>`;
};

/**
 * Extracts risk badge from the message content
 */
export const extractRiskBadge = (content: string): string => {
  const riskMatch = content.match(/risk level: (Low|Medium|High)/i);
  if (!riskMatch) return '';
  
  const risk = riskMatch[1].toLowerCase();
  const colorClass = {
    'low': 'bg-green-100 text-green-800 border border-green-200',
    'medium': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'high': 'bg-red-100 text-red-800 border border-red-200'
  }[risk] || 'bg-gray-100 text-gray-800 border border-gray-200';

  return `<span class="ml-auto px-4 py-1.5 text-sm font-medium rounded-full ${colorClass}">${riskMatch[1]} Risk</span>`;
};

/**
 * Format date from timestamp with proper error handling
 */
export const formatDate = (timestamp: number | string | undefined | null): string => {
  if (timestamp === undefined || timestamp === null) return 'Unknown';
  
  try {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) // Assuming UNIX timestamp (seconds)
      : new Date(timestamp);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
};