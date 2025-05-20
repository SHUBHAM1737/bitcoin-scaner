'use client';
import React, { useState } from 'react';
import { Bitcoin, Network, Layers, Hash, Settings } from 'lucide-react';
import RebarExplorer from './RebarExplorer';
import SidechainExplorer from './SidechainExplorer';

interface ExplorerTabsProps {
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
}

const ExplorerTabs: React.FC<ExplorerTabsProps> = ({ 
  latestBlocks, 
  recentTransactions, 
  isLoadingChainData, 
  isRefreshing, 
  handleBlockClick, 
  handleSearch, 
  renderBlockItem, 
  renderTransactionItem, 
  fetchBlockchainData,
  activeNetwork
}) => {
  const [activeTab, setActiveTab] = useState('blockchain');

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="w-full grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
          {['blockchain', 'metaprotocols', 'sidechains', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md flex items-center justify-center ${
                activeTab === tab
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab === 'blockchain' && <Layers className="w-5 h-5 mr-2" />}
              {tab === 'metaprotocols' && <Bitcoin className="w-5 h-5 mr-2" />}
              {tab === 'sidechains' && <Network className="w-5 h-5 mr-2" />}
              {tab === 'analytics' && <Settings className="w-5 h-5 mr-2" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blockchain Tab */}
      {activeTab === 'blockchain' && (
        <div className="space-y-6">
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
              {/* Blocks listing */}
              <div className="divide-y">
                {isLoadingChainData ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
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
              {/* Transactions listing */}
              <div className="divide-y">
                {isLoadingChainData ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
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
          </div>
        </div>
      )}

      {/* Metaprotocols Tab */}
      {activeTab === 'metaprotocols' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* Sidechains Tab */}
      {activeTab === 'sidechains' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
              <p className="text-gray-500 mt-1">Comprehensive Bitcoin ecosystem analysis</p>
            </div>
            <div className="p-6">
              {/* Add analytics components here */}
              <div className="text-center text-gray-500 p-8">
                <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium mb-2">Analytics Dashboard</p>
                <p>Detailed analytics features coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorerTabs;