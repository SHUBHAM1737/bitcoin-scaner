'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight,
  Hash,
  CircleDollarSign,
  Layers,
  Info,
  Bitcoin
} from 'lucide-react';
import { formatAddress, formatDate } from '../utils/formatUtils';
import { RebarLabsService } from '@/app/services/rebarLabsService';

const RunesExplorer: React.FC = () => {
  const [runes, setRunes] = useState<any[]>([]);
  const [selectedRune, setSelectedRune] = useState<any | null>(null);
  const [selectedRuneHolders, setSelectedRuneHolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHolders, setIsLoadingHolders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const rebarService = new RebarLabsService();
  
  useEffect(() => {
    fetchRunes();
  }, []);
  
  const fetchRunes = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      const result = await rebarService.getRuneEtchings(20, 0);
      
      if (result && result.results) {
        setRunes(result.results);
      } else {
        setError('Failed to fetch runes data');
      }
    } catch (error) {
      console.error('Error fetching runes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch runes data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const fetchRuneHolders = async (rune: any) => {
    try {
      setIsLoadingHolders(true);
      setError(null);
      
      const result = await rebarService.getRuneHolders(rune.id);
      
      if (result && result.results) {
        setSelectedRuneHolders(result.results);
      } else {
        setError('Failed to fetch rune holders data');
      }
    } catch (error) {
      console.error('Error fetching rune holders:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rune holders data');
    } finally {
      setIsLoadingHolders(false);
    }
  };
  
  const handleRuneClick = (rune: any) => {
    setSelectedRune(rune);
    fetchRuneHolders(rune);
  };
  
  const handleSearch = () => {
    // If search term looks like a Rune ID or name, try to fetch it
    if (searchTerm) {
      try {
        setIsLoading(true);
        setError(null);
        
        rebarService.getRuneEtching(searchTerm)
          .then(result => {
            if (result) {
              setSelectedRune(result);
              fetchRuneHolders(result);
            }
          })
          .catch(error => {
            console.error('Error searching for rune:', error);
            setError(`Rune not found: ${searchTerm}`);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error in search:', error);
        setIsLoading(false);
        setError(error instanceof Error ? error.message : 'Failed to search for rune');
      }
    }
  };
  
  const handleBackToList = () => {
    setSelectedRune(null);
    setSelectedRuneHolders([]);
  };
  
  const handleRefresh = () => {
    if (selectedRune) {
      const runeId = selectedRune.id;
      rebarService.getRuneEtching(runeId)
        .then(result => {
          if (result) {
            setSelectedRune(result);
            fetchRuneHolders(result);
          }
        })
        .catch(error => {
          console.error('Error refreshing rune data:', error);
          setError(`Failed to refresh rune data: ${error.message}`);
        });
    } else {
      fetchRunes();
    }
  };
  
  const formatRuneAmount = (amount: string, divisibility: number) => {
    if (!amount) return '0';
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum)) return '0';
    
    if (divisibility === 0) return amountNum.toString();
    
    const factor = Math.pow(10, divisibility);
    return (amountNum / factor).toFixed(divisibility);
  };
  
  // Filters runes based on search term
  const filteredRunes = runes.filter(rune => 
    rune.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rune.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rune.spaced_name && rune.spaced_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              placeholder="Search for a Rune by name or ID..."
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

      {/* Rune Details View */}
      {selectedRune ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="flex items-center">
              <Bitcoin className="text-amber-500 w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedRune.name || 'Unnamed Rune'}
              </h2>
              {selectedRune.symbol && (
                <span className="ml-2 text-2xl font-semibold">{selectedRune.symbol}</span>
              )}
            </div>
            <button
              onClick={handleBackToList}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Rune Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Rune Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="text-gray-900 font-medium">{selectedRune.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Number:</span>
                  <span className="text-gray-900 font-medium">{selectedRune.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="text-gray-900 font-medium">{selectedRune.name}</span>
                </div>
                {selectedRune.spaced_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Spaced Name:</span>
                    <span className="text-gray-900 font-medium">{selectedRune.spaced_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Divisibility:</span>
                  <span className="text-gray-900 font-medium">{selectedRune.divisibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Turbo:</span>
                  <span className="text-gray-900 font-medium">{selectedRune.turbo ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Supply Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Supply Details</h3>
              <div className="space-y-2">
                {selectedRune.supply && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Supply:</span>
                      <span className="text-gray-900 font-medium">
                        {formatRuneAmount(selectedRune.supply.current, selectedRune.divisibility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Minted:</span>
                      <span className="text-gray-900 font-medium">
                        {formatRuneAmount(selectedRune.supply.minted, selectedRune.divisibility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Mints:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.supply.total_mints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Minted Percentage:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.supply.mint_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Burned:</span>
                      <span className="text-gray-900 font-medium">
                        {formatRuneAmount(selectedRune.supply.burned, selectedRune.divisibility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mintable:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.supply.mintable ? 'Yes' : 'No'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mint Terms */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Mint Terms</h3>
              <div className="space-y-2">
                {selectedRune.mint_terms && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mint Amount:</span>
                      <span className="text-gray-900 font-medium">
                        {formatRuneAmount(selectedRune.mint_terms.amount, selectedRune.divisibility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cap:</span>
                      <span className="text-gray-900 font-medium">
                        {formatRuneAmount(selectedRune.mint_terms.cap, selectedRune.divisibility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Height Start:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.mint_terms.height_start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Height End:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.mint_terms.height_end}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Rune Location</h3>
              <div className="space-y-2">
                {selectedRune.location && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Block Height:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.location.block_height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID:</span>
                      <span className="text-gray-900 font-medium truncate max-w-xs">
                        {formatAddress(selectedRune.location.tx_id)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Output:</span>
                      <span className="text-gray-900 font-medium">{selectedRune.location.output}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Timestamp:</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(selectedRune.location.timestamp)}
                      </span>
                    </div>
                  </>
                )}
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
              ) : selectedRuneHolders.length > 0 ? (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 px-6 py-3">
                    <div className="col-span-1 font-medium text-gray-500">Rank</div>
                    <div className="col-span-7 font-medium text-gray-500">Address</div>
                    <div className="col-span-4 font-medium text-gray-500 text-right">Balance</div>
                  </div>
                  <div className="divide-y">
                    {selectedRuneHolders.map((holder, index) => (
                      <div key={holder.address} className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50">
                        <div className="col-span-1 text-gray-500">{index + 1}</div>
                        <div className="col-span-7 text-gray-900 font-mono">
                          {formatAddress(holder.address)}
                        </div>
                        <div className="col-span-4 text-gray-900 font-medium text-right">
                          {formatRuneAmount(holder.balance, selectedRune.divisibility)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-6 bg-gray-50 rounded-lg">
                  No holders found for this rune
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Runes List View */
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Runes Explorer</h2>
            <p className="text-gray-500 mt-1">Browse and explore Bitcoin Runes powered by Rebar Labs</p>
          </div>

          {isLoading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredRunes.length > 0 ? (
            <div className="divide-y">
              {filteredRunes.map((rune) => (
                <div 
                  key={rune.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => handleRuneClick(rune)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <CircleDollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center">
                          {rune.name}
                          {rune.symbol && <span className="ml-2 text-amber-600">{rune.symbol}</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {rune.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-2">
                        <div className="text-sm font-medium">
                          Supply: {formatRuneAmount(rune.supply?.current || '0', rune.divisibility)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Minted: {rune.supply?.mint_percentage || 0}%
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
              {searchTerm ? 'No runes found matching your search' : 'No runes found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RunesExplorer;