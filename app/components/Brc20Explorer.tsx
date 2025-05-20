'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  Users,
  BarChart3,
  Activity,
  Bitcoin
} from 'lucide-react';
import { formatAddress, formatDate } from '../utils/formatUtils';
import { RebarLabsService } from '@/app/services/rebarLabsService';

const Brc20Explorer: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [selectedTokenHolders, setSelectedTokenHolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHolders, setIsLoadingHolders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const rebarService = new RebarLabsService();
  
  useEffect(() => {
    fetchTokens();
  }, []);
  
  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      const result = await rebarService.getBrc20Tokens();
      
      if (result && result.results) {
        setTokens(result.results);
      } else {
        setError('Failed to fetch BRC-20 tokens data');
      }
    } catch (error) {
      console.error('Error fetching BRC-20 tokens:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch BRC-20 tokens data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const fetchTokenDetails = async (ticker: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await rebarService.getBrc20TokenDetails(ticker);
      
      if (result && result.token) {
        setSelectedToken(result);
        fetchTokenHolders(ticker);
      } else {
        setError('Failed to fetch token details');
      }
    } catch (error) {
      console.error('Error fetching token details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch token details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTokenHolders = async (ticker: string) => {
    try {
      setIsLoadingHolders(true);
      setError(null);
      
      const result = await rebarService.getBrc20TokenHolders(ticker);
      
      if (result && result.results) {
        setSelectedTokenHolders(result.results);
      } else {
        setError('Failed to fetch token holders data');
      }
    } catch (error) {
        console.error('Error fetching token holders:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch token holders data');
      } finally {
        setIsLoadingHolders(false);
      }
    };
    
    const handleTokenClick = (token: any) => {
      fetchTokenDetails(token.ticker);
    };
    
    const handleSearch = () => {
      if (searchTerm) {
        // Search for token by ticker
        try {
          setIsLoading(true);
          setError(null);
          
          rebarService.getBrc20TokenDetails(searchTerm.toUpperCase())
            .then(result => {
              if (result && result.token) {
                setSelectedToken(result);
                fetchTokenHolders(result.token.ticker);
              }
            })
            .catch(error => {
              console.error('Error searching for token:', error);
              setError(`Token not found: ${searchTerm}`);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } catch (error) {
          console.error('Error in search:', error);
          setIsLoading(false);
          setError(error instanceof Error ? error.message : 'Failed to search for token');
        }
      }
    };
    
    const handleBackToList = () => {
      setSelectedToken(null);
      setSelectedTokenHolders([]);
    };
    
    const handleRefresh = () => {
      if (selectedToken) {
        const ticker = selectedToken.token.ticker;
        fetchTokenDetails(ticker);
      } else {
        fetchTokens();
      }
    };
    
    // Filter tokens based on search term
    const filteredTokens = tokens.filter(token => 
      token.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Format number with commas
    const formatNumber = (num: string | number) => {
      if (!num) return '0';
      const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
      return parsedNum.toLocaleString();
    };
    
    // Format decimal amount considering decimals place
    const formatAmount = (amount: string | number, decimals: number) => {
      if (!amount) return '0';
      
      const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(parsedAmount)) return '0';
      
      if (decimals === 0) return parsedAmount.toLocaleString();
      
      const factor = Math.pow(10, decimals);
      return (parsedAmount / factor).toFixed(decimals);
    };
  
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a BRC-20 token by ticker..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
  
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
  
        {/* Token Details View */}
        {selectedToken ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center">
                <Bitcoin className="text-amber-500 w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedToken.token.ticker}
                </h2>
              </div>
              <button
                onClick={handleBackToList}
                className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Back to List
              </button>
            </div>
  
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Token Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ticker:</span>
                    <span className="text-gray-900 font-medium">{selectedToken.token.ticker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Decimals:</span>
                    <span className="text-gray-900 font-medium">{selectedToken.token.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Block Height:</span>
                    <span className="text-gray-900 font-medium">{selectedToken.token.block_height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deploy Timestamp:</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(selectedToken.token.deploy_timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tx Count:</span>
                    <span className="text-gray-900 font-medium">{formatNumber(selectedToken.token.tx_count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Self Mint:</span>
                    <span className="text-gray-900 font-medium">{selectedToken.token.self_mint ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
  
              {/* Supply Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Supply Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Supply:</span>
                    <span className="text-gray-900 font-medium">
                      {formatAmount(selectedToken.token.max_supply, selectedToken.token.decimals)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mint Limit:</span>
                    <span className="text-gray-900 font-medium">
                      {formatAmount(selectedToken.token.mint_limit, selectedToken.token.decimals)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Minted Supply:</span>
                    <span className="text-gray-900 font-medium">
                      {formatAmount(selectedToken.token.minted_supply, selectedToken.token.decimals)}
                    </span>
                  </div>
                  {selectedToken.supply && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Holders Count:</span>
                      <span className="text-gray-900 font-medium">{selectedToken.supply.holders}</span>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Genesis Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Genesis Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inscription ID:</span>
                    <span className="text-gray-900 font-medium truncate max-w-xs">{formatAddress(selectedToken.token.id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inscription Number:</span>
                    <span className="text-gray-900 font-medium">{selectedToken.token.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Minted By:</span>
                    <span className="text-gray-900 font-medium truncate max-w-xs">{formatAddress(selectedToken.token.address)}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <a 
                    href={`https://ordinals.com/inscription/${selectedToken.token.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                  >
                    <span>View on Ordinals Explorer</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
  
              {/* Supply Metrics with Progress Bars */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Supply Metrics</h3>
                
                {/* Max Supply Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Minted vs Max Supply</span>
                    <span className="text-gray-900">
                      {selectedToken.token.minted_supply && selectedToken.token.max_supply ? 
                        `${(parseInt(selectedToken.token.minted_supply) / parseInt(selectedToken.token.max_supply) * 100).toFixed(2)}%` : 
                        '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full" 
                      style={{
                        width: `${selectedToken.token.minted_supply && selectedToken.token.max_supply ? 
                          Math.min(100, (parseInt(selectedToken.token.minted_supply) / parseInt(selectedToken.token.max_supply) * 100)) : 
                          0}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Transaction Count */}
                <div className="mt-4">
                  <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    <Activity className="w-4 h-4 mr-1" />
                    <span>{formatNumber(selectedToken.token.tx_count)} Transactions</span>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Holders Section */}
            <div className="border-t">
              <div className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Top Holders</h3>
                
                {isLoadingHolders ? (
                  <div className="flex justify-center items-center p-6">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                    <span>Loading holders...</span>
                  </div>
                ) : selectedTokenHolders.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 bg-gray-50 px-6 py-3">
                      <div className="col-span-1 font-medium text-gray-500">Rank</div>
                      <div className="col-span-7 font-medium text-gray-500">Address</div>
                      <div className="col-span-4 font-medium text-gray-500 text-right">Balance</div>
                    </div>
                    <div className="divide-y">
                      {selectedTokenHolders.map((holder, index) => (
                        <div key={holder.address} className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50">
                          <div className="col-span-1 text-gray-500">{index + 1}</div>
                          <div className="col-span-7 text-gray-900 font-mono">
                            {formatAddress(holder.address)}
                          </div>
                          <div className="col-span-4 text-gray-900 font-medium text-right">
                            {holder.overall_balance}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-6 bg-gray-50 rounded-lg">
                    No holders found for this token
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Tokens List View */
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">BRC-20 Explorer</h2>
              <p className="text-gray-500 mt-1">Browse and explore BRC-20 tokens powered by Rebar Labs</p>
            </div>
  
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : filteredTokens.length > 0 ? (
              <div className="divide-y">
                {filteredTokens.map((token) => (
                  <div 
                    key={token.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                    onClick={() => handleTokenClick(token)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Bitcoin className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {token.ticker}
                          </div>
                          <div className="text-sm text-gray-500">
                            Inscription #{token.number}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-2">
                          <div className="text-sm font-medium">
                            Max: {formatAmount(token.max_supply, token.decimals)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Minted: {formatAmount(token.minted_supply, token.decimals)}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No tokens found matching your search' : 'No tokens found'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  export default Brc20Explorer;