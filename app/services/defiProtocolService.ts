// app/services/defiProtocolService.ts
import { STACKS_NETWORKS } from '@/app/config/blockchain';

// Protocol types
export interface DefiProtocol {
  id: string;
  name: string;
  description: string;
  website: string;
  logo: string;
  tvl: string; // Total Value Locked
  supportedAssets: string[];
  hasYieldFarming: boolean;
  hasBorrowing: boolean;
  hasStaking: boolean;
  apy: {
    min: number;
    max: number;
  };
}

export interface YieldOpportunity {
  protocolId: string;
  name: string;
  asset: string;
  apy: number;
  tvl: string;
  lockupPeriod?: string;
  risks: string[];
  rewards: string[];
  strategy: string;
  url: string;
}

/**
 * Service for interacting with DeFi protocols on Stacks
 */
export class DefiProtocolService {
  private readonly network: 'mainnet' | 'testnet';
  
  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
  }
  
  /**
   * Get a list of supported DeFi protocols
   */
  async getSupportedProtocols(): Promise<DefiProtocol[]> {
    try {
      // Fetch protocols from API if available
      const apiUrl = STACKS_NETWORKS[this.network].apiUrl;
      const encodedUrl = encodeURIComponent(`${apiUrl}/extended/v1/protocol`);
      
      // Use absolute URL format for API call
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      let protocols: DefiProtocol[] = [];
      
      try {
        const response = await fetch(requestUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform API response into our format
          if (data.results && Array.isArray(data.results)) {
            protocols = data.results.map((protocol: any) => ({
              id: protocol.id || '',
              name: protocol.name || '',
              description: protocol.description || '',
              website: protocol.website || '',
              logo: protocol.logo || '',
              tvl: protocol.tvl || '$0',
              supportedAssets: protocol.supported_assets || [],
              hasYieldFarming: !!protocol.has_yield_farming,
              hasBorrowing: !!protocol.has_borrowing,
              hasStaking: !!protocol.has_staking,
              apy: {
                min: protocol.apy_min || 0,
                max: protocol.apy_max || 0
              }
            }));
          }
        }
      } catch (apiError) {
        console.error('API error getting protocols:', apiError);
      }
      
      // If API didn't return results, use hardcoded data
      if (protocols.length === 0) {
        // Use hardcoded data
        protocols = [
          {
            id: 'arkadiko',
            name: 'Arkadiko',
            description: 'Arkadiko is a decentralized, non-custodial liquidity protocol where users can collateralize their STX to generate stablecoins or provide liquidity.',
            website: 'https://arkadiko.finance',
            logo: 'https://arkadiko.finance/logo.png',
            tvl: '$12.4M',
            supportedAssets: ['STX', 'sBTC', 'USDA'],
            hasYieldFarming: true,
            hasBorrowing: true,
            hasStaking: false,
            apy: {
              min: 4.5,
              max: 12.0
            }
          },
          {
            id: 'alex',
            name: 'ALEX',
            description: 'ALEX is a DeFi platform on Stacks offering yield farming, algorithmic stablecoins, and automated market making.',
            website: 'https://alexgo.io',
            logo: 'https://alexgo.io/logo.png',
            tvl: '$8.2M',
            supportedAssets: ['STX', 'sBTC', 'ALEX'],
            hasYieldFarming: true,
            hasBorrowing: false,
            hasStaking: true,
            apy: {
              min: 3.2,
              max: 15.5
            }
          },
          {
            id: 'stackswap',
            name: 'StackSwap',
            description: 'StackSwap is a fully functional DEX and launchpad running on the Stacks blockchain.',
            website: 'https://stackswap.org',
            logo: 'https://stackswap.org/logo.png',
            tvl: '$5.7M',
            supportedAssets: ['STX', 'sBTC', 'STSW'],
            hasYieldFarming: true,
            hasBorrowing: false,
            hasStaking: true,
            apy: {
              min: 2.8,
              max: 18.0
            }
          }
        ];
      }
      
      return protocols;
    } catch (error) {
      console.error('Error fetching supported protocols:', error);
      throw error;
    }
  }
  
  /**
   * Get yield opportunities for sBTC
   */
  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    try {
      // Fetch opportunities from API if available
      const apiUrl = STACKS_NETWORKS[this.network].apiUrl;
      const encodedUrl = encodeURIComponent(`${apiUrl}/extended/v1/opportunities?asset=sbtc`);
      
      // Use absolute URL format for API call
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      let opportunities: YieldOpportunity[] = [];
      
      try {
        const response = await fetch(requestUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform API response into our format
          if (data.results && Array.isArray(data.results)) {
            opportunities = data.results.map((opp: any) => ({
              protocolId: opp.protocol_id || '',
              name: opp.name || '',
              asset: opp.asset || 'sBTC',
              apy: opp.apy || 0,
              tvl: opp.tvl || '$0',
              lockupPeriod: opp.lockup_period || 'None',
              risks: opp.risks || [],
              rewards: opp.rewards || [],
              strategy: opp.strategy || '',
              url: opp.url || ''
            }));
          }
        }
      } catch (apiError) {
        console.error('API error getting yield opportunities:', apiError);
      }
      
      // If API didn't return results, use hardcoded data
      if (opportunities.length === 0) {
        // Use hardcoded data
        opportunities = [
          {
            protocolId: 'arkadiko',
            name: 'Arkadiko sBTC-STX LP',
            asset: 'sBTC',
            apy: 8.2,
            tvl: '$3.5M',
            lockupPeriod: 'None',
            risks: [
              'Impermanent loss',
              'Smart contract risk',
              'Price volatility'
            ],
            rewards: [
              'DIKO rewards',
              'Trading fees'
            ],
            strategy: 'Provide liquidity to the sBTC-STX pool and stake LP tokens to earn DIKO rewards.',
            url: 'https://arkadiko.finance/pools'
          },
          {
            protocolId: 'alex',
            name: 'ALEX sBTC Yield Farm',
            asset: 'sBTC',
            apy: 10.5,
            tvl: '$2.1M',
            lockupPeriod: '7 days',
            risks: [
              'Smart contract risk',
              'Price volatility',
              'Early withdrawal penalty'
            ],
            rewards: [
              'ALEX tokens',
              'Platform fees'
            ],
            strategy: 'Stake sBTC in the ALEX yield farm to earn ALEX tokens and a share of platform fees.',
            url: 'https://alexgo.io/farms'
          },
          {
            protocolId: 'stackswap',
            name: 'StackSwap sBTC Vault',
            asset: 'sBTC',
            apy: 6.8,
            tvl: '$1.8M',
            lockupPeriod: '14 days',
            risks: [
              'Smart contract risk',
              'Price volatility',
              'Early withdrawal penalty'
            ],
            rewards: [
              'STSW tokens',
              'BTC yield'
            ],
            strategy: 'Deposit sBTC into the vault to earn STSW tokens and BTC yield from lending activities.',
            url: 'https://stackswap.org/vaults'
          }
        ];
      }
      
      return opportunities;
    } catch (error) {
      console.error('Error fetching yield opportunities:', error);
      throw error;
    }
  }
  
  /**
   * Calculate estimated yield
   */
  calculateYield(principal: number, apy: number, months: number): {
    profit: number;
    total: number;
    monthly: number[];
  } {
    // Simple compound interest calculation
    const periods = months;
    const rate = apy / 100 / 12;
    
    // Monthly breakdown
    const monthly: number[] = [];
    let currentBalance = principal;
    
    for (let i = 0; i < periods; i++) {
      currentBalance = currentBalance * (1 + rate);
      monthly.push(currentBalance);
    }
    
    const total = monthly[monthly.length - 1];
    const profit = total - principal;
    
    return {
      profit,
      total,
      monthly
    };
  }
  
  /**
   * Get protocol contract details
   */
  async getProtocolContract(protocolId: string, contractName: string): Promise<any> {
    try {
      const apiUrl = STACKS_NETWORKS[this.network].apiUrl;
      
      // Fetch protocol contract details
      const contractResponse = await fetch(
        `${apiUrl}/v2/contracts/interface/${protocolId}.${contractName}`
      );
      
      if (!contractResponse.ok) {
        throw new Error(`Failed to fetch contract details: ${contractResponse.statusText}`);
      }
      
      return await contractResponse.json();
    } catch (error) {
      console.error('Error fetching protocol contract details:', error);
      throw error;
    }
  }
  
  /**
   * Deposit sBTC into DeFi protocol
   * This function would need to be implemented according to each protocol's specific requirements
   */
  async depositToProtocol(protocolId: string, amount: number): Promise<any> {
    // In a real implementation, this would interact with the specific protocol's contracts
    console.log(`Depositing ${amount} sBTC to ${protocolId}`);
    throw new Error('Protocol deposit not implemented yet');
  }
  
  /**
   * Withdraw sBTC from DeFi protocol
   * This function would need to be implemented according to each protocol's specific requirements
   */
  async withdrawFromProtocol(protocolId: string, amount: number): Promise<any> {
    // In a real implementation, this would interact with the specific protocol's contracts
    console.log(`Withdrawing ${amount} sBTC from ${protocolId}`);
    throw new Error('Protocol withdrawal not implemented yet');
  }
}