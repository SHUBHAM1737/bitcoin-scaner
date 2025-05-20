'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, Clock, TrendingUp, ArrowDownRight, ArrowUpRight, Loader2, AlertCircle, Bitcoin, ExternalLink, Info } from 'lucide-react';
import { STACKS_NETWORKS } from '@/app/config/blockchain';
import { formatAddress, formatValue } from '@/app/utils/formatUtils';
import { UserSession } from '@stacks/connect-react';
import { SbtcService } from '@/app/services/sbtcService';

interface SbtcPosition {
  address: string;
  balance: string;
  usdValue: string;
  lastUpdated: string;
  history: Array<{
    date: string;
    balance: number;
    usdValue: number;
  }>;
}

interface SbtcPositionTrackerProps {
  address?: string;
  network: 'mainnet' | 'testnet';
}

const SbtcPositionTracker: React.FC<SbtcPositionTrackerProps> = ({ 
  address, 
  network = 'mainnet' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState<SbtcPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [sbtcService, setSbtcService] = useState<SbtcService | null>(null);

  useEffect(() => {
    // Initialize sBTC service
    const userSession = new UserSession({
      appConfig: {
        appName: 'BitcoinInsightAI',
        appIconUrl: 'https://bitcoin-insight-ai.vercel.app/logo.png',
        redirectTo: '/',
      }
    });
    
    const service = new SbtcService(userSession, network);
    setSbtcService(service);
  }, [network]);

  useEffect(() => {
    const fetchSbtcPosition = async () => {
      if (!address || !sbtcService) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch BTC price for USD conversion
        const btcPriceResponse = await fetch('/api/blockchain-data?url=' + 
          encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'));
        
        if (btcPriceResponse.ok) {
          const priceData = await btcPriceResponse.json();
          if (priceData.bitcoin?.usd) {
            setBtcPrice(priceData.bitcoin.usd);
          }
        }
        
        // Fetch the user's sBTC balance
        const balanceInfo = await sbtcService.getBalance(address);
        const readableBalance = balanceInfo.balance;
        const usdValue = (parseFloat(readableBalance) * btcPrice).toFixed(2);
        
        // Fetch transaction history for this address
        const txHistory = await sbtcService.getTransactionHistory(address);
        
        // Process transaction history to create a balance timeline
        let historyData: SbtcPosition['history'] = [];
        
        if (txHistory.length > 0) {
          // Create a mapping of dates to balance changes
          const balanceChanges: {[key: string]: number} = {};
          let runningBalance = parseFloat(readableBalance);
          
          // Sort transactions by date (newest first)
          const sortedTxs = [...txHistory].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          // Process transactions to calculate historical balances
          let processedBalance = runningBalance;
          
          sortedTxs.forEach(tx => {
            if (!tx.timestamp) return;
            
            const date = new Date(tx.timestamp).toISOString().split('T')[0];
            const amount = parseFloat(tx.amount);
            
            if (isNaN(amount)) return;
            
            // Adjust balance based on transaction type and direction
            if (tx.type === 'transfer') {
              if (tx.sender === address) {
                // Sent sBTC
                processedBalance += amount; // Add back the amount that was sent
              } else if (tx.counterparty === address) {
                // Received sBTC
                processedBalance -= amount; // Subtract the amount that was received
              }
            } else if (tx.type === 'withdraw' && tx.sender === address) {
              processedBalance += amount; // Add back the amount that was withdrawn
            } else if (tx.type === 'deposit' && tx.counterparty === address) {
              processedBalance -= amount; // Subtract the amount that was deposited
            }
            
            // Record the balance for this date
            balanceChanges[date] = processedBalance;
          });
          
          // Now convert to array format for chart, oldest to newest
          historyData = Object.keys(balanceChanges)
            .sort() // Sort by date (oldest first)
            .map(date => ({
              date,
              balance: balanceChanges[date],
              usdValue: balanceChanges[date] * btcPrice
            }));
          
          // Add current balance if not already present
          const today = new Date().toISOString().split('T')[0];
          if (!balanceChanges[today]) {
            historyData.push({
              date: today,
              balance: parseFloat(readableBalance),
              usdValue: parseFloat(readableBalance) * btcPrice
            });
          }
        }
        
        // If we didn't get any history, create a simple entry for today
        if (historyData.length === 0) {
          const today = new Date().toISOString().split('T')[0];
          historyData.push({
            date: today,
            balance: parseFloat(readableBalance),
            usdValue: parseFloat(readableBalance) * btcPrice
          });
          
          // Add a point from 30 days ago for visualization
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
          
          historyData.unshift({
            date: thirtyDaysAgoStr,
            balance: 0,
            usdValue: 0
          });
        }
        
        setPosition({
          address,
          balance: readableBalance,
          usdValue,
          lastUpdated: new Date().toISOString(),
          history: historyData
        });
        
      } catch (error) {
        console.error('Error fetching sBTC position:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch sBTC position');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSbtcPosition();
  }, [address, network, sbtcService, btcPrice]);

  if (!address) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Wallet className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Address Selected</h3>
        <p className="text-gray-500">Enter a Stacks address to see sBTC positions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-gray-700">Loading sBTC position...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <div className="flex items-center justify-center text-red-500 mb-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
        <p className="text-gray-500">Unable to load sBTC position data</p>
      </div>
    );
  }

  if (!position || parseFloat(position.balance) === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Bitcoin className="w-12 h-12 text-amber-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No sBTC Position</h3>
        <p className="text-gray-500">This address doesn't have any sBTC tokens</p>
        <a 
          href="https://www.stacks.co/sbtc"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
        >
          Learn more about sBTC
        </a>
      </div>
    );
  }

  const balanceChange = position.history.length > 1 
    ? position.history[position.history.length - 1].balance - position.history[0].balance
    : 0;
    
  const isPositive = balanceChange >= 0;
  const percentChange = position.history[0].balance === 0 
    ? 100 
    : (balanceChange / position.history[0].balance) * 100;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">sBTC Position</h3>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock className="w-4 h-4 mr-1" />
          <span>Last updated: {new Date(position.lastUpdated).toLocaleString()}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Balance</div>
            <div className="text-2xl font-bold text-amber-600">{position.balance} sBTC</div>
            <div className="text-sm text-gray-600">${position.usdValue} USD</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Change</div>
            <div className={`text-2xl font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
              {balanceChange.toFixed(8)} sBTC
            </div>
            <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-gray-500 mr-2" />
          <h4 className="text-base font-medium text-gray-900">Balance History</h4>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={position.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis 
                yAxisId="left"
                orientation="left"
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(4)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'balance') return [`${value} sBTC`, 'Balance'];
                  if (name === 'usdValue') return [`$${value}`, 'USD Value'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="balance" 
                stroke="#f7931a" 
                activeDot={{ r: 8 }} 
                name="sBTC Balance"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="usdValue" 
                stroke="#5546FF" 
                name="USD Value" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p className="flex items-center">
            <Info className="w-4 h-4 mr-2 text-amber-500" />
            sBTC is a 1:1 Bitcoin-backed asset that enables programmable Bitcoin on the Stacks blockchain.
          </p>
        </div>
        
        <div className="mt-4 flex justify-end">
          <a 
            href={`${STACKS_NETWORKS[network].explorerUrl}address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 inline-flex items-center"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SbtcPositionTracker;