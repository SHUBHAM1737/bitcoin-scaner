'use client';
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  Tag, 
  Network, 
  LayoutGrid,
  Search, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  Hash, 
  Wallet, 
  Loader2, 
  AlertTriangle,
  ChevronRight,
  Clock,
  BarChart3,
  ExternalLink,
  Activity,
  Bitcoin,
  X
} from 'lucide-react';
import { BIP300Service, BIP300Block, BIP300Transaction } from '@/app/services/bip300Service';
import { BIP300_NETWORKS } from '@/app/config/bip300';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';
import BIP300Dashboard from './BIP300Dashboard';

interface SidechainExplorerProps {
  initialSidechain?: string;
  onSelectTransaction?: (txHash: string, network: string) => void;
  onSelectBlock?: (blockHash: string, network: string) => void;
}

const SidechainExplorer: React.FC<SidechainExplorerProps> = ({
  initialSidechain = 'thunder',
  onSelectTransaction,
  onSelectBlock
}) => {
  const [activeSidechain, setActiveSidechain] = useState(initialSidechain);
  const [activeView, setActiveView] = useState<'explorer' | 'dashboard'>('explorer');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BIP300Block[]>([]);
  const [transactions, setTransactions] = useState<BIP300Transaction[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize the BIP300Service
  const bip300Service = new BIP300Service(activeSidechain);
  
  // Load data on component mount and when sidechain changes
  useEffect(() => {
    fetchData();
  }, [activeSidechain]);
  
  // Main data fetching function
  const fetchData = async () => {
    setError(null);
    setIsRefreshing(true);
    fetchBlocks();
    fetchTransactions();
    fetchStats();
    setIsRefreshing(false);
  };
  
  // Fetch recent blocks
  const fetchBlocks = async () => {
    setIsLoadingBlocks(true);
    try {
      const service = new BIP300Service(activeSidechain);
      const blocksData = await service.getRecentBlocks(10);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setError('Failed to fetch recent blocks');
    } finally {
      setIsLoadingBlocks(false);
    }
  };
  
  // Fetch recent transactions
  const fetchTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const service = new BIP300Service(activeSidechain);
      const txsData = await service.getRecentTransactions(10);
      setTransactions(txsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch recent transactions');
    } finally {
      setIsLoadingTxs(false);
    }
  };
  
  // Fetch sidechain stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const service = new BIP300Service(activeSidechain);
      const statsData = await service.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch sidechain statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Handle sidechain change
  const handleSidechainChange = (sidechain: string) => {
    setActiveSidechain(sidechain);
    setSearchInput('');
    setSearchResult(null);
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    
    try {
      // If this is a transaction hash, handle it via the callback
      if (/^[0-9a-f]{64}$/i.test(searchInput.trim()) && onSelectTransaction) {
        onSelectTransaction(searchInput.trim(), `sidechain-${activeSidechain}`);
        return;
      }
      
      // If this is a block height, handle it via the callback
      if (/^\d+$/.test(searchInput.trim()) && onSelectBlock) {
        // First get the block hash by height
        try {
          const block = await bip300Service.getBlock(parseInt(searchInput.trim()));
          onSelectBlock(block.hash, `sidechain-${activeSidechain}`);
          return;
        } catch (blockError) {
          console.error('Failed to get block hash by height:', blockError);
          throw new Error('No block found with this height');
        }
      }
      
      // Otherwise handle search internally 
      const service = new BIP300Service(activeSidechain);
      
      if (/^\d+$/.test(searchInput)) {
        // Search for block by height
        const block = await service.getBlock(parseInt(searchInput));
        setSearchResult({ type: 'block', data: block });
      } else if (searchInput.length === 64) {
        // Could be a transaction hash or block hash
        try {
          const tx = await service.getTransaction(searchInput);
          setSearchResult({ type: 'transaction', data: tx });
        } catch (txErr) {
          try {
            const block = await service.getBlock(searchInput);
            setSearchResult({ type: 'block', data: block });
          } catch (blockErr) {
            throw new Error('No transaction or block found with this identifier');
          }
        }
      } else {
        // Try as an address
        try {
          const address = await service.getAddress(searchInput);
          setSearchResult({ type: 'address', data: address });
        } catch (addrErr) {
          throw new Error('Invalid search input. Please enter a valid block height, transaction ID, or address.');
        }
      }
    } catch (searchErr) {
      console.error('Search error:', searchErr);
      setError(searchErr instanceof Error ? searchErr.message : 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle transaction click
  const handleTransactionClick = (tx: BIP300Transaction) => {
    if (onSelectTransaction) {
      onSelectTransaction(tx.txid, `sidechain-${activeSidechain}`);
    }
  };

  // Handle block click
  const handleBlockClick = (block: BIP300Block) => {
    if (onSelectBlock) {
      onSelectBlock(block.hash, `sidechain-${activeSidechain}`);
    }
  };

  // Get icon for the current sidechain
  const getSidechainIcon = (sidechain: string) => {
    switch (sidechain) {
      case 'thunder':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'zside':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'bitnames':
        return <Tag className="w-5 h-5 text-green-500" />;
      default:
        return <Network className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get color for the current sidechain
  const getSidechainColor = (sidechain: string): string => {
    switch (sidechain) {
      case 'thunder': return 'blue';
      case 'zside': return 'purple';
      case 'bitnames': return 'green';
      default: return 'gray';
    }
  };

  // Render content based on active view
  const renderContent = () => {
    if (activeView === 'dashboard') {
      return <BIP300Dashboard sidechain={activeSidechain} />;
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`bg-white p-4 rounded-xl border border-${getSidechainColor(activeSidechain)}-100 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Layers className="w-4 h-4 mr-1" />
              <span>Latest Block</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.blockHeight.toLocaleString()
              )}
            </div>
          </div>

          <div className={`bg-white p-4 rounded-xl border border-${getSidechainColor(activeSidechain)}-100 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Activity className="w-4 h-4 mr-1" />
              <span>Transactions</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.txCount.toLocaleString()
              )}
            </div>
          </div>

          <div className={`bg-white p-4 rounded-xl border border-${getSidechainColor(activeSidechain)}-100 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Bitcoin className="w-4 h-4 mr-1" />
              <span>BTC Locked</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.btcLockedAmount
              )}
            </div>
          </div>

          <div className={`bg-white p-4 rounded-xl border border-${getSidechainColor(activeSidechain)}-100 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>Avg Block Time</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                stats?.avgBlockTime
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResult && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                {searchResult.type === 'block' ? (
                  <Layers className="w-5 h-5 text-gray-500" />
                ) : searchResult.type === 'transaction' ? (
                  <Hash className="w-5 h-5 text-gray-500" />
                ) : (
                  <Wallet className="w-5 h-5 text-gray-500" />
                )}
                <span>
                  {searchResult.type === 'block' 
                    ? `Block #${searchResult.data.height}` 
                    : searchResult.type === 'transaction'
                      ? `Transaction ${searchResult.data.txid.substring(0, 10)}...`
                      : `Address ${searchResult.data.address.substring(0, 10)}...`}
                </span>
              </h3>
              <button
                onClick={() => setSearchResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {searchResult.type === 'block' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Block Hash</div>
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                        {searchResult.data.hash}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Height</div>
                      <div className="font-medium">{searchResult.data.height}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Timestamp</div>
                      <div className="font-medium">
                        {formatDate(searchResult.data.timestamp)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Miner</div>
                      <div className="font-medium font-mono">{searchResult.data.miner || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Transactions</div>
                      <div className="font-medium">{searchResult.data.txCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Size</div>
                      <div className="font-medium">{Math.round(searchResult.data.size / 1024)} KB</div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleBlockClick(searchResult.data)}
                      className={`px-4 py-2 bg-${getSidechainColor(activeSidechain)}-600 text-white rounded-lg hover:bg-${getSidechainColor(activeSidechain)}-700 transition-colors flex items-center gap-2`}
                    >
                      <span>AI Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {searchResult.type === 'transaction' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                        {searchResult.data.txid}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div className="font-medium capitalize">{searchResult.data.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Type</div>
                      <div className="font-medium capitalize">{searchResult.data.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Block Height</div>
                      <div className="font-medium">{searchResult.data.blockHeight}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">From</div>
                      <div className="font-medium font-mono">{formatAddress(searchResult.data.from)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">To</div>
                      <div className="font-medium font-mono">{formatAddress(searchResult.data.to)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Value</div>
                      <div className="font-medium">{searchResult.data.value}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Fee</div>
                      <div className="font-medium">{searchResult.data.fee}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleTransactionClick(searchResult.data)}
                      className={`px-4 py-2 bg-${getSidechainColor(activeSidechain)}-600 text-white rounded-lg hover:bg-${getSidechainColor(activeSidechain)}-700 transition-colors flex items-center gap-2`}
                    >
                      <span>AI Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {searchResult.type === 'address' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Address</div>
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                        {searchResult.data.address}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Balance</div>
                      <div className="font-medium">{searchResult.data.balance}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Transactions</div>
                      <div className="font-medium">{searchResult.data.transactions}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Blocks and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Blocks */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-500" />
                <span>Recent Blocks</span>
              </h3>
              <button
                onClick={fetchBlocks}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isLoadingBlocks}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoadingBlocks ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {isLoadingBlocks ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">Loading blocks...</span>
                </div>
              ) : blocks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No blocks found
                </div>
              ) : (
                blocks.map((block) => (
                  <div
                    key={block.hash}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleBlockClick(block)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${getSidechainColor(activeSidechain)}-100`}>
                          <Layers className={`w-5 h-5 text-${getSidechainColor(activeSidechain)}-500`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Block #{block.height.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            <span>{formatAddress(block.hash)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {block.txCount} txs
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(block.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <span>Recent Transactions</span>
              </h3>
              <button
                onClick={fetchTransactions}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isLoadingTxs}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoadingTxs ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {isLoadingTxs ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions found
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.txid}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTransactionClick(tx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${getSidechainColor(activeSidechain)}-100`}>
                          <Hash className={`w-5 h-5 text-${getSidechainColor(activeSidechain)}-500`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatAddress(tx.txid)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="capitalize">{tx.type || 'transaction'}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{formatDate(tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {tx.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          Fee: {tx.fee}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidechain Features */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-medium text-gray-900">Key Features</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {BIP300_NETWORKS[activeSidechain]?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${getSidechainColor(activeSidechain)}-100`}>
                  <BarChart3 className={`w-4 h-4 text-${getSidechainColor(activeSidechain)}-500`} />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            <a
              href={BIP300_NETWORKS[activeSidechain]?.specsUrl || 'https://layertwolabs.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <span>Learn more about {BIP300_NETWORKS[activeSidechain]?.name}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sidechain Selection */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          {Object.entries(BIP300_NETWORKS).map(([id, network]) => (
            <button
              key={id}
              onClick={() => handleSidechainChange(id)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                activeSidechain === id
                  ? `bg-${network.color}-50 text-${network.color}-600 border-b-2 border-${network.color}-500`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {getSidechainIcon(id)}
              <span>{network.name}</span>
            </button>
          ))}
        </div>
        
        {/* Sidechain Description */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center gap-2 mb-2">
            {getSidechainIcon(activeSidechain)}
            <h3 className="font-medium text-gray-900">
              {BIP300_NETWORKS[activeSidechain]?.name || 'Unknown Sidechain'}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {BIP300_NETWORKS[activeSidechain]?.description || 'No description available'}
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by block height, transaction hash, or address..."
                className={`w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${getSidechainColor(activeSidechain)}-500 focus:border-transparent`}
                disabled={isSearching}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchInput.trim()}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 ${
                !searchInput.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : `bg-${getSidechainColor(activeSidechain)}-600 text-white hover:bg-${getSidechainColor(activeSidechain)}-700`
              }`}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
          </form>
        </div>
          
          {/* View Toggle */}
          <div className="p-4 bg-gray-50 flex items-center justify-center">
            <div className="bg-white border rounded-lg p-1 inline-flex">
              <button
                onClick={() => setActiveView('explorer')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeView === 'explorer'
                    ? `bg-${getSidechainColor(activeSidechain)}-50 text-${getSidechainColor(activeSidechain)}-600 border border-${getSidechainColor(activeSidechain)}-200`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Explorer</span>
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeView === 'dashboard'
                    ? `bg-${getSidechainColor(activeSidechain)}-50 text-${getSidechainColor(activeSidechain)}-600 border border-${getSidechainColor(activeSidechain)}-200`
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mt-4">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Refresh Indicator */}
        {isRefreshing && !isLoadingBlocks && !isLoadingTxs && !isLoadingStats && (
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mt-4">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span>Refreshing data...</span>
          </div>
        )}

        {/* Main Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default SidechainExplorer;
