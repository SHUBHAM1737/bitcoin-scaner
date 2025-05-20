import { extractComplexityBadge, extractRiskBadge } from './formatUtils';

/**
 * Formats a list of items for display
 */
export const formatList = (content: string): string => {
  if (!content) return '';
  return content.split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      const formattedItem = item.replace(/^-\s*/, '').replace(/\*\*/g, '');
      
      if (formattedItem.toLowerCase().includes('warning')) {
        return `<div class="bg-red-50 text-red-700 p-4 rounded-xl my-2 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">${formattedItem}</div>`;
      }
      if (formattedItem.toLowerCase().includes('success')) {
        return `<div class="bg-green-50 text-green-700 p-4 rounded-xl my-2 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">${formattedItem}</div>`;
      }
      return `<div class="text-gray-700 p-3 rounded-xl my-2 hover:bg-gray-50 transition-all duration-300">${formattedItem}</div>`;
    })
    .join('');
};

/**
 * Formats token transfers for display
 */
const formatTokenTransfers = (content: string): string => {
  if (!content) return '';
  
  // Split content into groups (each token transfer is a group of related lines)
  const transfers = content.split('\n\n').map(group => group.trim()).filter(group => group);
  
  return transfers.map(transfer => {
    const lines = transfer.split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    return `
      <div class="bg-white/90 border border-amber-200 p-4 mb-3 rounded-lg hover:shadow-md transition-all duration-300">
        ${lines.map(line => {
          const parts = line.split(':');
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (!value) {
            return `<div class="text-gray-700 py-1">${key}</div>`;
          }
          return `
            <div class="flex items-start py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-gray-500 font-medium min-w-[100px]">${key}:</span>
              <span class="text-gray-700 ml-2">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
};

/**
 * Format Bitcoin transaction inputs/outputs
 */
const formatBitcoinSection = (content: string, type: 'Inputs' | 'Outputs'): string => {
  if (!content) return `<div class="text-gray-500 text-center italic p-4">No ${type.toLowerCase()} detected</div>`;
  
  const parts = content.split('\n\n').map(group => group.trim()).filter(group => group);
  
  const iconClass = type === 'Inputs' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
  const iconText = type === 'Inputs' ? '←' : '→';
  
  return parts.map(part => {
    const lines = part.split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    return `
      <div class="bg-white/90 border border-amber-200 p-4 mb-3 rounded-lg hover:shadow-md transition-all duration-300">
        <div class="flex items-center mb-2">
          <div class="px-2 py-1 ${iconClass} rounded-lg text-sm font-medium">${iconText} ${type}</div>
        </div>
        ${lines.map(line => {
          const parts = line.split(':');
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (!value) {
            return `<div class="text-gray-700 py-1">${key}</div>`;
          }
          return `
            <div class="flex items-start py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-gray-500 font-medium min-w-[100px]">${key}:</span>
              <span class="text-gray-700 ml-2">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
};

/**
 * Format Stacks/sBTC section
 */
const formatStacksSection = (content: string, type: string): string => {
  if (!content) return `<div class="text-gray-500 text-center italic p-4">No ${type.toLowerCase()} detected</div>`;
  
  const parts = content.split('\n\n').map(group => group.trim()).filter(group => group);
  
  let iconText = '↔';
  let iconClass = 'bg-indigo-100 text-indigo-800';
  
  if (type.includes('STX')) {
    iconText = 'STX';
    iconClass = 'bg-indigo-100 text-indigo-800';
  } else if (type.includes('sBTC')) {
    iconText = '₿';
    iconClass = 'bg-amber-100 text-amber-800';
  } else if (type.includes('Contract')) {
    iconText = '📄';
    iconClass = 'bg-purple-100 text-purple-800';
  }
  
  return parts.map(part => {
    const lines = part.split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    return `
      <div class="bg-white/90 border ${type.includes('sBTC') ? 'border-amber-200' : 'border-indigo-200'} p-4 mb-3 rounded-lg hover:shadow-md transition-all duration-300">
        <div class="flex items-center mb-2">
          <div class="px-2 py-1 ${iconClass} rounded-lg text-sm font-medium">${iconText} ${type}</div>
        </div>
        ${lines.map(line => {
          const parts = line.split(':');
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (!value) {
            return `<div class="text-gray-700 py-1">${key}</div>`;
          }
          return `
            <div class="flex items-start py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-gray-500 font-medium min-w-[100px]">${key}:</span>
              <span class="text-gray-700 ml-2">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
};

/**
 * Format transfer section based on Bitcoin or Stacks network
 */
export const formatTransferSection = (content: string): string => {
  if (!content) return '<div class="text-gray-500 text-center italic p-4">No transfers detected</div>';
  
  const parts = content.split('---Sub Section---');
  let html = '';
  
  parts.forEach(part => {
    const trimmedPart = part.trim();
    
    // Bitcoin sections
    if (trimmedPart.includes('Inputs:')) {
      html += `<div class="bg-gradient-to-r from-amber-50 to-amber-100/50 backdrop-blur-sm border-l-4 border-amber-500 p-4 mb-4 rounded-xl hover:shadow-lg transition-all duration-300">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">💰</span>
          <span>Bitcoin Inputs</span>
        </h4>
        ${formatBitcoinSection(trimmedPart.replace('Inputs:', '').trim(), 'Inputs')}
      </div>`;
    }
    else if (trimmedPart.includes('Outputs:')) {
      html += `<div class="bg-gradient-to-r from-green-50 to-green-100/50 backdrop-blur-sm border-l-4 border-green-500 p-4 mb-4 rounded-xl hover:shadow-lg transition-all duration-300">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">💰</span>
          <span>Bitcoin Outputs</span>
        </h4>
        ${formatBitcoinSection(trimmedPart.replace('Outputs:', '').trim(), 'Outputs')}
      </div>`;
    }
    
    // Stacks sections
    else if (trimmedPart.includes('STX Transfers:')) {
      html += `<div class="bg-gradient-to-r from-indigo-50 to-indigo-100/50 backdrop-blur-sm border-l-4 border-indigo-500 p-4 mb-4 rounded-xl hover:shadow-lg transition-all duration-300">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">💸</span>
          <span>STX Transfers</span>
        </h4>
        ${formatStacksSection(trimmedPart.replace('STX Transfers:', '').trim(), 'STX Transfers')}
      </div>`;
    }
    else if (trimmedPart.includes('sBTC Operations:')) {
      html += `<div class="bg-gradient-to-r from-amber-50 to-amber-100/50 backdrop-blur-sm border-l-4 border-amber-500 p-4 mb-4 rounded-xl hover:shadow-lg transition-all duration-300">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">₿</span>
          <span>sBTC Operations</span>
        </h4>
        ${formatStacksSection(trimmedPart.replace('sBTC Operations:', '').trim(), 'sBTC Operations')}
      </div>`;
    }
    else if (trimmedPart.includes('Contract Interactions:')) {
      html += `<div class="bg-gradient-to-r from-purple-50 to-purple-100/50 backdrop-blur-sm border-l-4 border-purple-500 p-4 mb-4 rounded-xl hover:shadow-lg transition-all duration-300">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">📝</span>
          <span>Contract Interactions</span>
        </h4>
        ${formatStacksSection(trimmedPart.replace('Contract Interactions:', '').trim(), 'Contract Interactions')}
      </div>`;
    }
  });
  
  return html || '<div class="text-gray-500 text-center italic p-4">No transfers detected</div>';
};

/**
 * Main function to format the AI assistant's message
 */
export const formatAssistantMessage = (content: string): string => {
  if (!content) return '';
  
  const sections = content.split('---Section---');
  let formattedContent = '';
  
  sections.forEach(section => {
    const trimmedSection = section.trim();
    
    if (trimmedSection.includes('TRANSACTION OVERVIEW:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-amber-100 p-2 rounded-xl">🔍</span>
          <span>Transaction Overview</span>
          ${extractComplexityBadge(trimmedSection)}
        </h3>
        ${formatList(trimmedSection.replace('TRANSACTION OVERVIEW:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('NETWORK DETAILS:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-blue-100 p-2 rounded-xl">🌐</span>
          <span>Network Details</span>
        </h3>
        ${formatList(trimmedSection.replace('NETWORK DETAILS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('TRANSFER ANALYSIS:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-amber-100 p-2 rounded-xl">↔️</span>
          <span>Transfer Analysis</span>
        </h3>
        ${formatTransferSection(trimmedSection.replace('TRANSFER ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('FEE ANALYSIS:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-green-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-green-100 p-2 rounded-xl">⛽</span>
          <span>Fee Analysis</span>
        </h3>
        ${formatList(trimmedSection.replace('FEE ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('SECURITY ASSESSMENT:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-red-100 p-2 rounded-xl">🛡️</span>
          <span>Security Assessment</span>
          ${extractRiskBadge(trimmedSection)}
        </h3>
        ${formatList(trimmedSection.replace('SECURITY ASSESSMENT:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('ADDITIONAL INSIGHTS:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-gray-100 p-2 rounded-xl">💡</span>
          <span>Additional Insights</span>
        </h3>
        ${formatList(trimmedSection.replace('ADDITIONAL INSIGHTS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('INFORMATION:')) {
      formattedContent += `<div class="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 bg-gray-100 p-2 rounded-xl">💡</span>
          <span>Information</span>
        </h3>
        ${formatList(trimmedSection.replace('INFORMATION:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('graph TD;') || trimmedSection.includes('graph LR;') || trimmedSection.includes('sequenceDiagram')) {
      formattedContent += `<div class="mermaid">${trimmedSection}</div>`;
    }
  });
  
  return formattedContent || `<div class="text-gray-700 whitespace-pre-wrap">${content}</div>`;
};