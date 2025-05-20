// app/config/endpoints.ts

// Combined endpoint configuration for all blockchain types
export const API_ENDPOINTS = {
    bitcoin: {
      mainnet: {
        base: 'https://mempool.space/api',
        blocks: '/blocks',
        tx: '/tx/',
        address: '/address/',
        fees: '/v1/fees/recommended',
        mempool: '/mempool',
      },
      testnet: {
        base: 'https://mempool.space/testnet/api',
        blocks: '/blocks',
        tx: '/tx/',
        address: '/address/',
        fees: '/v1/fees/recommended',
        mempool: '/mempool',
      },
    },
    stacks: {
      mainnet: {
        base: 'https://api.mainnet.hiro.so',
        blocks: '/extended/v1/block',
        tx: '/extended/v1/tx',
        address: '/extended/v1/address',
        fees: '/v2/fees/transfer',
        mempool: '/extended/v1/tx/mempool',
      },
      testnet: {
        base: 'https://api.testnet.hiro.so',
        blocks: '/extended/v1/block',
        tx: '/extended/v1/tx',
        address: '/extended/v1/address',
        fees: '/v2/fees/transfer',
        mempool: '/extended/v1/tx/mempool',
      },
    },
    sidechain: {
      thunder: {
        base: 'https://api.layertwolabs.com/thunder',
        blocks: '/blocks',
        tx: '/tx',
        address: '/address',
        fees: '/fees',
        mempool: '/mempool',
      },
      zside: {
        base: 'https://api.layertwolabs.com/zside',
        blocks: '/blocks',
        tx: '/tx',
        address: '/address',
        fees: '/fees',
        mempool: '/mempool',
      },
      bitnames: {
        base: 'https://api.layertwolabs.com/bitnames',
        blocks: '/blocks',
        tx: '/tx',
        address: '/address',
        fees: '/fees',
        mempool: '/mempool',
      },
    },
    rebar: {
      base: 'https://api.rebarlabs.io',
      runes: '/runes/v1',
      ordinals: '/ordinals/v1',
      brc20: '/ordinals/v1/brc-20',
    }
  };
  
  // Helper function to get full API endpoint URL
  export function getApiUrl(
    network: 'bitcoin' | 'stacks' | 'sidechain',
    subNetwork: string,
    endpoint: string,
    params?: Record<string, string>
  ): string {
    const networkConfig = API_ENDPOINTS[network];
    if (!networkConfig) {
      throw new Error(`Network "${network}" not supported`);
    }
  
    const subNetworkConfig = networkConfig[subNetwork];
    if (!subNetworkConfig) {
      throw new Error(`SubNetwork "${subNetwork}" not supported for network "${network}"`);
    }
  
    const baseUrl = subNetworkConfig.base;
    const endpointPath = subNetworkConfig[endpoint] || endpoint;
    
    let url = `${baseUrl}${endpointPath}`;
    
    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      url += `?${queryString}`;
    }
    
    return url;
  }