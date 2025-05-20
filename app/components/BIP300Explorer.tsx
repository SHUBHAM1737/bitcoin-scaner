// app/components/BIP300Explorer.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  Tag, 
  Layers, 
  Hash, 
  Activity, 
  Wallet, 
  RefreshCw, 
  ArrowRight, 
  ChevronRight, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  BarChart3
} from 'lucide-react';
import { BIP300Service, BIP300Block, BIP300Transaction, BIP300Stats } from '@/app/services/bip300Service';
import { BIP300_NETWORKS } from '@/app/config/bip300';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';

const BIP300Explorer: React.FC = () => {
  const [activeSidechain, setActiveSidechain] = useState<string>('thunder');
  const [blocks, setBlocks] = useState<BIP300Block[]>([]);
  const [transactions, setTransactions] = useState<BIP300Transaction[]>([]);
  const [stats, setStats] = useState<BIP300Stats | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the BIP300Service
  const bip300Service = new BIP300Service(activeSidechain);
  
  // Load data on component mount and when sidechain changes
  useEffect(() => {
    fetchData();
  }, [activeSidechain]);
  
  // Main data fetching function
  const fetchData = async () => {
    setError(null);
    fetchBlocks();
    fetchTransactions();
    fetchStats();
  };
  
  // Fetch recent blocks
  const fetchBlocks = async () => {
    setIsLoadingBlocks(true);
    try {
      const service = new BIP300Service(activeSidechain);
      const blocksData = await service.getRecentBlocks(5);
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
      const txsData = await service.getRecentTransactions(5);
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
  };
  
  // Get icon component based on sidechain
  const getSidechainIcon = (sidechain: string) => {
    switch (sidechain) {
      case 'thunder':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'zside':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'bitnames':
        return <Tag className="w-5 h-5 text-green-500" />;
      default:
        return <Layers className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Sidechain Selection Tabs */}
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
        <div className="p-4 bg-gray-50 border-b">
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
        
        {/* Sidechain Stats */}
        {error ? (
          <div className="p-4 bg-red-50 text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Latest Block</div>
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <div className="font-medium text-gray-900">{stats?.blockHeight}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Transactions</div>
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <div className="font-medium text-gray-900">{stats?.txCount}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">BTC Locked</div>
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <div className="font-medium text-gray-900">{stats?.btcLockedAmount}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Avg Block Time</div>
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <div className="font-medium text-gray-900">{stats?.avgBlockTime}</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Recent Blocks and Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blocks */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
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
          
          <div className="divide-y">
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
                <div key={block.hash} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-100`}>
                        <Layers className={`w-5 h-5 text-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-500`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Block #{block.height}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          <span>{formatAddress(block.hash)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{block.txCount} txs</div>
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
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
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
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
          
          <div className="divide-y">
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
                <div key={tx.txid} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-100`}>
                        <Hash className={`w-5 h-5 text-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-500`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{formatAddress(tx.txid)}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="capitalize">{tx.type}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{formatDate(tx.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{tx.value}</div>
                      <div className="text-xs text-gray-500">Fee: {tx.fee}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Sidechain Features */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">Key Features</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BIP300_NETWORKS[activeSidechain]?.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-100`}>
                <BarChart3 className={`w-4 h-4 text-${BIP300_NETWORKS[activeSidechain]?.color || 'blue'}-500`} />
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
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BIP300Explorer;
