'use client';
import React, { useState, useEffect } from 'react';
import { 
  Layers, Hash, Bitcoin, Network, BarChart3, Search,
  RefreshCw, Loader2, ChevronRight, ArrowRight
} from 'lucide-react';
import RebarExplorer from './RebarExplorer';
import SidechainExplorer from './SidechainExplorer';

interface DashboardTabsProps {
  latestBlocks: any[];
  recentTransactions: any[];
  isLoadingChainData: boolean;
  isRefreshing: boolean;
  handleBlockClick: (block: any) => void;
  handleSearch: (hash: string) => void;
  renderBlockItem: (block: any, index: number) => React.ReactNode;
  renderTransactionItem: (tx: any, index: number) => React.ReactNode;
  fetchBlockchainData: () => void;
  activeNetwork: string;
  networkStats: any;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  latestBlocks,
  recentTransactions,
  isLoadingChainData,
  isRefreshing,
  handleBlockClick,
  handleSearch,
  renderBlockItem,
  renderTransactionItem,
  fetchBlockchainData,
  activeNetwork,
  networkStats
}) => {
  const [activeMainTab, setActiveMainTab] = useState('explorer');
  const [activeExplorerTab, setActiveExplorerTab] = useState('chain');
  const [searchInput, setSearchInput] = useState('');
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleSearch(searchInput.trim());
    }
  };

  // Reset explorer tab when main tab changes
  useEffect(() => {
    if (activeMainTab === 'explorer') {
      setActiveExplorerTab('chain');
    }
  }, [activeMainTab]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Main Tabs */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveMainTab('explorer')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeMainTab === 'explorer'
                ? 'bg-gray-50 border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Explorer</span>
          </button>
          <button
            onClick={() => setActiveMainTab('protocols')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeMainTab === 'protocols'
                ? 'bg-gray-50 border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bitcoin className="w-5 h-5" />
            <span>Metaprotocols</span>
          </button>
          <button
            onClick={() => setActiveMainTab('sidechains')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeMainTab === 'sidechains'
                ? 'bg-gray-50 border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Network className="w-5 h-5" />
            <span>Sidechains</span>
          </button>
          <button
            onClick={() => setActiveMainTab('analytics')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeMainTab === 'analytics'
                ? 'bg-gray-50 border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Secondary quick search bar that appears in all tabs */}
        <div className="p-4 bg-gray-50 border-b">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by transaction hash, address, or block..."
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex items-center"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button
              type="button"
              onClick={fetchBlockchainData}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* Stats and Summary Section - visible across all tabs */}
        <div className="p-4 grid grid-cols-4 gap-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="text-xs text-gray-500 mb-1">Latest Block</div>
            <div className="font-medium text-gray-900">{networkStats.latestBlock}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="text-xs text-gray-500 mb-1">Avg Fee Rate</div>
            <div className="font-medium text-gray-900">
              {activeNetwork === 'bitcoin' 
                ? `${networkStats.avgFeeRate} sat/vB` 
                : `${parseFloat(networkStats.avgFeeRate).toFixed(6)} STX`}
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="text-xs text-gray-500 mb-1">Pending TXs</div>
            <div className="font-medium text-gray-900">{networkStats.pendingTxns}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="text-xs text-gray-500 mb-1">Network</div>
            <div className="font-medium text-gray-900 capitalize">
              {activeNetwork} {activeNetwork !== 'bitcoin' ? '' : ''}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Explorer Tab Content */}
          {activeMainTab === 'explorer' && (
            <div>
              {/* Explorer Sub-tabs */}
              <div className="mb-6">
                <div className="flex space-x-2 border-b">
                  <button
                    onClick={() => setActiveExplorerTab('chain')}
                    className={`py-2 px-4 ${
                      activeExplorerTab === 'chain'
                        ? 'border-b-2 border-amber-500 text-amber-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Blockchain
                  </button>
                  <button
                    onClick={() => setActiveExplorerTab('blocks')}
                    className={`py-2 px-4 ${
                      activeExplorerTab === 'blocks'
                        ? 'border-b-2 border-amber-500 text-amber-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Latest Blocks
                  </button>
                  <button
                    onClick={() => setActiveExplorerTab('transactions')}
                    className={`py-2 px-4 ${
                      activeExplorerTab === 'transactions'
                        ? 'border-b-2 border-amber-500 text-amber-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Recent Transactions
                  </button>
                </div>
              </div>

              {/* Explorer Content */}
              {activeExplorerTab === 'chain' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Latest Blocks */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Layers className={`w-5 h-5 ${activeNetwork === 'bitcoin' ? 'text-amber-500' : 'text-indigo-500'}`} />
                        <span>Latest Blocks</span>
                      </h2>
                      <button 
                        onClick={fetchBlockchainData}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="divide-y max-h-96 overflow-y-auto">
                      {isLoadingChainData ? (
                        <div className="p-8 flex justify-center items-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                          <p className="text-sm text-gray-500">Loading blocks...</p>
                        </div>
                      ) : latestBlocks.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No blocks found</p>
                        </div>
                      ) : (
                        latestBlocks.slice(0, 5).map((block, index) => renderBlockItem(block, index))
                      )}
                    </div>
                    <div className="p-3 border-t bg-gray-50 text-center">
                      <button 
                        onClick={() => setActiveExplorerTab('blocks')}
                        className="text-sm text-amber-600 hover:text-amber-800 flex items-center justify-center w-full"
                      >
                        <span>View All Blocks</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Hash className={`w-5 h-5 ${activeNetwork === 'bitcoin' ? 'text-amber-500' : 'text-indigo-500'}`} />
                        <span>Recent Transactions</span>
                      </h2>
                      <button
                        onClick={fetchBlockchainData}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="divide-y max-h-96 overflow-y-auto">
                      {isLoadingChainData ? (
                        <div className="p-8 flex justify-center items-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                          <p className="text-sm text-gray-500">Loading transactions...</p>
                        </div>
                      ) : recentTransactions.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No transactions found</p>
                        </div>
                      ) : (
                        recentTransactions.slice(0, 5).map((tx, index) => renderTransactionItem(tx, index))
                      )}
                    </div>
                    <div className="p-3 border-t bg-gray-50 text-center">
                      <button 
                        onClick={() => setActiveExplorerTab('transactions')}
                        className="text-sm text-amber-600 hover:text-amber-800 flex items-center justify-center w-full"
                      >
                        <span>View All Transactions</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeExplorerTab === 'blocks' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Layers className={`w-5 h-5 ${activeNetwork === 'bitcoin' ? 'text-amber-500' : 'text-indigo-500'}`} />
                      <span>Latest Blocks</span>
                    </h2>
                  </div>
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {isLoadingChainData ? (
                      <div className="p-8 flex justify-center items-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500">Loading blocks...</p>
                      </div>
                    ) : latestBlocks.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No blocks found</p>
                      </div>
                    ) : (
                      latestBlocks.map((block, index) => renderBlockItem(block, index))
                    )}
                  </div>
                </div>
              )}

              {activeExplorerTab === 'transactions' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Hash className={`w-5 h-5 ${activeNetwork === 'bitcoin' ? 'text-amber-500' : 'text-indigo-500'}`} />
                      <span>Recent Transactions</span>
                    </h2>
                  </div>
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {isLoadingChainData ? (
                      <div className="p-8 flex justify-center items-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500">Loading transactions...</p>
                      </div>
                    ) : recentTransactions.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No transactions found</p>
                      </div>
                    ) : (
                      recentTransactions.map((tx, index) => renderTransactionItem(tx, index))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metaprotocols Tab Content */}
          {activeMainTab === 'protocols' && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bitcoin className="w-5 h-5 text-amber-500" />
                  <span>Bitcoin Metaprotocols Explorer</span>
                </h2>
                <div className="text-sm text-gray-500">Powered by Rebar Labs</div>
              </div>
              <div className="p-6">
                <RebarExplorer />
              </div>
            </div>
          )}

          {/* Sidechains Tab Content */}
          {activeMainTab === 'sidechains' && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-500" />
                  <span>Bitcoin BIP300 Sidechains</span>
                </h2>
                <div className="text-sm text-gray-500">Powered by Layer Two Labs</div>
              </div>
              <div className="p-6">
                <SidechainExplorer initialSidechain="thunder" />
              </div>
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeMainTab === 'analytics' && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
                <p className="text-gray-500 mt-1">Comprehensive Bitcoin ecosystem analysis</p>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-500 p-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium mb-2">Analytics Dashboard</p>
                  <p>Advanced analytics features coming soon...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs;