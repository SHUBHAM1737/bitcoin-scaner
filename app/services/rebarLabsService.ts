// app/services/rebarLabsService.ts
import { REBAR_API_URL } from '@/app/config/blockchain';

/**
 * Service for interacting with Rebar Labs API
 */
export class RebarLabsService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiUrl = REBAR_API_URL;
    this.apiKey = apiKey || process.env.REBAR_API_KEY || '';
  }

  /**
   * Helper to make API requests through our proxy
   */
  private async fetchFromRebarApi(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Construct the query parameters
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Handle array parameters
          if (Array.isArray(value)) {
            return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
          }
          return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');

      // Construct the full URL
      const fullUrl = `${this.apiUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      // Properly encode the URL
      const encodedUrl = encodeURIComponent(fullUrl);
      
      console.log(`Fetching from Rebar API: ${fullUrl}`);
      
      // Use absolute URL format with origin
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
      
      const response = await fetch(requestUrl, {
        headers: {
          'Accept': '*/*',
          'X-Api-Key': this.apiKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Rebar API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Rebar API:', error);
      throw error;
    }
  }

  /**
   * Get all rune etchings
   */
  async getRuneEtchings(limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi('/runes/v1/etchings', { limit, offset });
  }

  /**
   * Get a specific rune etching
   */
  async getRuneEtching(etching: string): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/etchings/${etching}`);
  }

  /**
   * Get holders for a specific rune
   */
  async getRuneHolders(etching: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/etchings/${etching}/holders`, { limit, offset });
  }

  /**
   * Get balance for a specific address and rune
   */
  async getRuneHolderBalance(etching: string, address: string): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/etchings/${etching}/holders/${address}`);
  }

  /**
   * Get all balances for a specific address
   */
  async getAddressBalances(address: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/addresses/${address}/balances`, { limit, offset });
  }

  /**
   * Get a list of rune activities for a specific etching
   */
  async getRuneActivity(etching: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/etchings/${etching}/activity`, { limit, offset });
  }

  /**
   * Get activity for a specific address and rune
   */
  async getRuneAddressActivity(etching: string, address: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/etchings/${etching}/activity/${address}`, { limit, offset });
  }

  /**
   * Get all activity for an address
   */
  async getAddressActivity(address: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/addresses/${address}/activity`, { limit, offset });
  }

  /**
   * Get transaction activity
   */
  async getTransactionActivity(txId: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/transactions/${txId}/activity`, { limit, offset });
  }

  /**
   * Get block activity
   */
  async getBlockActivity(block: string | number, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/runes/v1/blocks/${block}/activity`, { limit, offset });
  }

  /**
   * Get all inscriptions
   */
  async getInscriptions(params: any = {}, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi('/ordinals/v1/inscriptions', { ...params, limit, offset });
  }

  /**
   * Get a specific inscription
   */
  async getInscription(id: string): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/inscriptions/${id}`);
  }

  /**
   * Get inscription content
   */
  async getInscriptionContent(id: string): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/inscriptions/${id}/content`);
  }

  /**
   * Get inscription transfers
   */
  async getInscriptionTransfers(id: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/inscriptions/${id}/transfers`, { limit, offset });
  }

  /**
   * Get transfers for a specific block
   */
  async getBlockTransfers(block: string | number, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi('/ordinals/v1/inscriptions/transfers', { block, limit, offset });
  }

  /**
   * Get BRC-20 tokens
   */
  async getBrc20Tokens(ticker?: string[], limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi('/ordinals/v1/brc-20/tokens', { ticker, limit, offset });
  }

  /**
   * Get details for a specific BRC-20 token
   */
  async getBrc20TokenDetails(ticker: string): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/brc-20/tokens/${ticker}`);
  }

  /**
   * Get holders for a specific BRC-20 token
   */
  async getBrc20TokenHolders(ticker: string, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/brc-20/tokens/${ticker}/holders`, { limit, offset });
  }

  /**
   * Get BRC-20 balances for an address
   */
  async getBrc20Balances(address: string, ticker?: string[], limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/brc-20/balances/${address}`, { ticker, limit, offset });
  }

  /**
   * Get BRC-20 activity
   */
  async getBrc20Activity(params: any = {}, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi('/ordinals/v1/brc-20/activity', { ...params, limit, offset });
  }

  /**
   * Get satoshi ordinal information
   */
  async getSatoshiOrdinal(ordinal: number): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/sats/${ordinal}`);
  }

  /**
   * Get inscriptions for a specific satoshi
   */
  async getSatoshiInscriptions(ordinal: number, limit = 20, offset = 0): Promise<any> {
    return this.fetchFromRebarApi(`/ordinals/v1/sats/${ordinal}/inscriptions`, { limit, offset });
  }

  /**
   * Get statistics on inscriptions
   */
  async getInscriptionStats(fromBlockHeight?: string, toBlockHeight?: string): Promise<any> {
    return this.fetchFromRebarApi('/ordinals/v1/stats/inscriptions', { from_block_height: fromBlockHeight, to_block_height: toBlockHeight });
  }
}