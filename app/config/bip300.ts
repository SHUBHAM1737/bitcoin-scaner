// app/config/bip300.ts

// BIP300 Sidechain configuration settings
export const BIP300_NETWORKS = {
    thunder: {
      name: 'Thunder',
      description: 'Highly scalable Bitcoin sidechain that can scale to 8 billion users',
      apiUrl: 'https://api.layertwolabs.com/thunder',
      explorerUrl: 'https://explorer.layertwolabs.com/thunder',
      color: 'blue',
      icon: 'zap',
      features: [
        'High transaction throughput',
        'Low fees',
        'Direct Bitcoin security',
        'No custodians or federations'
      ],
      specsUrl: 'https://layertwolabs.com/thunder-specs'
    },
    zside: {
      name: 'zSide',
      description: 'Privacy-focused sidechain with zCash-like features',
      apiUrl: 'https://api.layertwolabs.com/zside',
      explorerUrl: 'https://explorer.layertwolabs.com/zside',
      color: 'purple',
      icon: 'shield',
      features: [
        'Enhanced privacy',
        'zk-SNARKs',
        'Shielded transactions',
        'Private smart contracts'
      ],
      specsUrl: 'https://layertwolabs.com/zside-specs'
    },
    bitnames: {
      name: 'BitNames',
      description: 'Namecoin-like identity and name registration system',
      apiUrl: 'https://api.layertwolabs.com/bitnames',
      explorerUrl: 'https://explorer.layertwolabs.com/bitnames',
      color: 'green',
      icon: 'tag',
      features: [
        'Decentralized naming system',
        'DNS alternatives',
        'Identity registration',
        'Permanent data storage'
      ],
      specsUrl: 'https://layertwolabs.com/bitnames-specs'
    }
  };
  
  // Default BIP300 sidechain
  export const DEFAULT_SIDECHAIN = 'thunder';
  
  // Mock connection status - in a real app, this would be determined dynamically
  export const SIDECHAIN_NODE_STATUS = {
    thunder: {
      status: 'connected',
      blockHeight: 123456,
      version: '0.1.0',
      peers: 8
    },
    zside: {
      status: 'connected',
      blockHeight: 87654,
      version: '0.1.0',
      peers: 5
    },
    bitnames: {
      status: 'connected',
      blockHeight: 54321,
      version: '0.1.0',
      peers: 6
    }
  };
  
  // BIP300 specific transaction types
  export const SIDECHAIN_TX_TYPES = [
    'deposit',
    'withdrawal',
    'transfer',
    'merge-mine',
    'name-register',
    'name-update',
    'name-transfer',
    'private-send',
    'private-receive',
    'contract-deploy',
    'contract-call'
  ];
  
  // Sample transaction size for BIP300 sidechains
  export const SIDECHAIN_TX_SIZE = {
    thunder: '0.2 kB',
    zside: '1.5 kB',
    bitnames: '0.5 kB'
  };
  
  // Sample fees for BIP300 sidechains (in satoshis)
  export const SIDECHAIN_FEES = {
    thunder: '1-5 sats',
    zside: '10-50 sats',
    bitnames: '5-20 sats'
  };