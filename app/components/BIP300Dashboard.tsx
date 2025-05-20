'use client';
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  Tag, 
  ArrowDown, 
  ArrowUp, 
  RefreshCw, 
  PlusCircle, 
  MinusCircle, 
  BarChart3, 
  Download, 
  Upload, 
  CircleDollarSign, 
  Loader2, 
  AlertTriangle,
  Check,
  Info,
  Coins,
  Lock
} from 'lucide-react';
import { BIP300Service } from '@/app/services/bip300Service';
import { BIP300_NETWORKS } from '@/app/config/bip300';

interface BIP300DashboardProps {
  sidechain: string;
}

const BIP300Dashboard: React.FC<BIP300DashboardProps> = ({ sidechain = 'thunder' }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'stats'>('stats');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [withdrawAmount, setWithdrawAmount] = useState('0.1');
  const [depositAddress, setDepositAddress] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [userBalance, setUserBalance] = useState('0');
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const bip300Service = new BIP300Service(sidechain);
  
  // Fetch stats and balance when sidechain changes
  useEffect(() => {
    fetchStats();
    loadBalance();
  }, [sidechain]);
  
  // Fetch sidechain stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const statsData = await bip300Service.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use default stats as fallback
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Simulate loading user balance from the sidechain
  const loadBalance = async () => {
    try {
      // In a real app, this would load from the user's wallet
      setUserBalance((Math.random() * 10).toFixed(8));
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };
  
  // Handle deposit submission
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!depositAddress) {
      setError('Please enter a destination address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Call the service
      const txid = await bip300Service.deposit(parseFloat(depositAmount), depositAddress);
      
      setSuccess(`Successfully initiated deposit. Transaction ID: ${txid.substring(0, 10)}...`);
      setDepositAmount('0.1');
      setDepositAddress('');
    } catch (error) {
      console.error('Deposit error:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute deposit');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle withdrawal submission
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!withdrawAddress) {
      setError('Please enter a destination address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Call the service
      const txid = await bip300Service.withdraw(parseFloat(withdrawAmount), withdrawAddress);
      
      setSuccess(`Successfully initiated withdrawal. Transaction ID: ${txid.substring(0, 10)}...`);
      setWithdrawAmount('0.1');
      setWithdrawAddress('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute withdrawal');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render icon based on sidechain
  const renderSidechainIcon = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const className = size === 'sm' ? "w-4 h-4" : size === 'lg' ? "w-6 h-6" : "w-5 h-5";
    
    switch (sidechain) {
      case 'thunder':
        return <Zap className={`${className} text-blue-500`} />;
      case 'zside':
        return <Shield className={`${className} text-purple-500`} />;
      case 'bitnames':
        return <Tag className={`${className} text-green-500`} />;
      default:
        return <CircleDollarSign className={`${className} text-gray-500`} />;
    }
  };
  
  // Get color based on sidechain
  const getSidechainColor = () => {
    switch (sidechain) {
      case 'thunder': return 'blue';
      case 'zside': return 'purple';
      case 'bitnames': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${getSidechainColor()}-100 rounded-xl`}>
              {renderSidechainIcon('lg')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {BIP300_NETWORKS[sidechain]?.name || 'BIP300 Sidechain'} Dashboard
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage your BIP300 sidechain operations securely
              </p>
            </div>
          </div>
        </div>
        
        {/* Balance Display */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Your Balance</div>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {userBalance} BTC
                <button 
                  onClick={loadBalance}
                  className="p-1 rounded-full hover:bg-gray-100"
                  title="Refresh balance"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {!isLoadingStats && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className={`bg-white p-3 rounded-xl border border-${getSidechainColor()}-100 shadow-sm`}>
                  <div className="text-xs text-gray-500 mb-1">Network Hashrate</div>
                  <div className="font-medium text-gray-900">{stats.hashrate}</div>
                </div>
                <div className={`bg-white p-3 rounded-xl border border-${getSidechainColor()}-100 shadow-sm`}>
                  <div className="text-xs text-gray-500 mb-1">BTC Locked</div>
                  <div className="font-medium text-gray-900">{stats.btcLockedAmount}</div>
                </div>
                <div className={`bg-white p-3 rounded-xl border border-${getSidechainColor()}-100 shadow-sm`}>
                  <div className="text-xs text-gray-500 mb-1">Block Height</div>
                  <div className="font-medium text-gray-900">{stats.blockHeight}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                activeTab === 'stats'
                  ? `bg-${getSidechainColor()}-50 text-${getSidechainColor()}-600 border-b-2 border-${getSidechainColor()}-500`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                activeTab === 'deposit'
                  ? `bg-${getSidechainColor()}-50 text-${getSidechainColor()}-600 border-b-2 border-${getSidechainColor()}-500`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                activeTab === 'withdraw'
                  ? `bg-${getSidechainColor()}-50 text-${getSidechainColor()}-600 border-b-2 border-${getSidechainColor()}-500`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 text-green-700 flex items-center gap-2 animate-fadeIn">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 mb-1">Peg Status</div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full">Active</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <div className="text-gray-900">
                      Bitcoin is securely locked in the BIP300 two-way peg
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 mb-1">Network Security</div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full">High</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div className="text-gray-900">
                      Secured by Bitcoin's proof-of-work consensus
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sidechain Description and Features */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  {renderSidechainIcon()}
                  <span>About {BIP300_NETWORKS[sidechain]?.name}</span>
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {BIP300_NETWORKS[sidechain]?.description}
                </p>
                
                <h5 className="font-medium text-gray-900 mb-2 text-sm">Key Features:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIP300_NETWORKS[sidechain]?.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-${getSidechainColor()}-100`}>
                        <div className={`w-2 h-2 rounded-full bg-${getSidechainColor()}-500`}></div>
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Technical Metrics */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Technical Metrics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Avg Block Time</div>
                    <div className="text-gray-900 font-medium">{stats?.avgBlockTime || '10 seconds'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Avg Block Size</div>
                    <div className="text-gray-900 font-medium">{stats?.avgBlockSize || '250 KB'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Avg Fee</div>
                    <div className="text-gray-900 font-medium">{stats?.avgFee || '1 sat/byte'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Mempool Size</div>
                    <div className="text-gray-900 font-medium">{stats?.mempoolSize || '50 txs'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'deposit' && (
            <form onSubmit={handleDeposit} className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Download className={`w-5 h-5 text-${getSidechainColor()}-500`} />
                  <span>Deposit Bitcoin to {BIP300_NETWORKS[sidechain]?.name}</span>
                </h4>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount to Deposit (BTC)
                    </label>
                    <div className="relative">
                      <input
                        id="depositAmount"
                        type="text"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getSidechainColor()}-500 focus:border-transparent`}
                        placeholder="0.1"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                          onClick={() => setDepositAmount('0.1')}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Min: 0.001 BTC, Max: 10 BTC
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="depositAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      {BIP300_NETWORKS[sidechain]?.name} Destination Address
                    </label>
                    <input
                      id="depositAddress"
                      type="text"
                      value={depositAddress}
                      onChange={(e) => setDepositAddress(e.target.value)}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getSidechainColor()}-500 focus:border-transparent`}
                      placeholder={`${sidechain === 'thunder' ? 'tb1...' : sidechain === 'zside' ? 'z...' : 'bn...'}`}
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your {BIP300_NETWORKS[sidechain]?.name} address
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`bg-${getSidechainColor()}-50 rounded-xl p-6 border border-${getSidechainColor()}-100 shadow-sm`}>
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 text-${getSidechainColor()}-500 flex-shrink-0 mt-0.5`} />
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">About Deposits</h5>
                    <p className="text-sm text-gray-600">
                      Depositing Bitcoin to {BIP300_NETWORKS[sidechain]?.name} allows you to use your BTC on this sidechain. 
                      The deposit is secured through BIP300's two-way peg mechanism, with no custodians or federations.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Deposits typically require 10 confirmations (approximately 100 minutes) to become available on the sidechain.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !depositAmount || !depositAddress}
                className={`w-full py-3 px-4 bg-${getSidechainColor()}-600 text-white rounded-lg hover:bg-${getSidechainColor()}-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span>Deposit to {BIP300_NETWORKS[sidechain]?.name}</span>
                  </>
                )}
              </button>
            </form>
          )}
          
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className={`w-5 h-5 text-${getSidechainColor()}-500`} />
                  <span>Withdraw from {BIP300_NETWORKS[sidechain]?.name} to Bitcoin</span>
                </h4>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount to Withdraw (BTC)
                    </label>
                    <div className="relative">
                      <input
                        id="withdrawAmount"
                        type="text"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getSidechainColor()}-500 focus:border-transparent`}
                        placeholder="0.1"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                          onClick={() => setWithdrawAmount(userBalance)}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Available: {userBalance} BTC
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="withdrawAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      Bitcoin Destination Address
                    </label>
                    <input
                      id="withdrawAddress"
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${getSidechainColor()}-500 focus:border-transparent`}
                      placeholder="bc1..."
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your Bitcoin mainnet address
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`bg-${getSidechainColor()}-50 rounded-xl p-6 border border-${getSidechainColor()}-100 shadow-sm`}>
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 text-${getSidechainColor()}-500 flex-shrink-0 mt-0.5`} />
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">About Withdrawals</h5>
                    <p className="text-sm text-gray-600">
                      Withdrawing from {BIP300_NETWORKS[sidechain]?.name} sends your BTC back to the Bitcoin main chain. 
                      This is a trustless process leveraging BIP300 sidechain technology.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Important:</strong> Withdrawals typically require 200 confirmations (approximately 33 hours) to be processed due to security considerations.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !withdrawAmount || !withdrawAddress}
                className={`w-full py-3 px-4 bg-${getSidechainColor()}-600 text-white rounded-lg hover:bg-${getSidechainColor()}-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span>Withdraw from {BIP300_NETWORKS[sidechain]?.name}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );