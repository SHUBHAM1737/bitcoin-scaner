// app/components/SbtcDeFiDashboard.tsx (simplified version)
'use client';
import React from 'react';
import { Bitcoin, CircleDollarSign, ChevronRight, Info } from 'lucide-react';

interface SbtcDeFiDashboardProps {
  network: 'mainnet' | 'testnet';
}

const SbtcDeFiDashboard: React.FC<SbtcDeFiDashboardProps> = ({ 
  network = 'mainnet' 
}) => {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="flex items-center text-xl font-semibold text-gray-900">
          <Bitcoin className="w-6 h-6 text-amber-500 mr-2" />
          sBTC DeFi Dashboard
        </h2>
        <p className="text-gray-500 mt-1">
          Manage your sBTC and explore DeFi opportunities
        </p>
      </div>
      
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">What is sBTC?</p>
            <p>sBTC is a 1:1 Bitcoin-backed asset on the Stacks blockchain. It enables you to use your Bitcoin in DeFi applications while maintaining Bitcoin's security and value. You can deposit BTC to get sBTC, and withdraw sBTC to get your BTC back at any time.</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-amber-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Deposit BTC</h3>
              <Bitcoin className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Convert your Bitcoin to sBTC by depositing BTC into the Stacks protocol.
            </p>
            <ul className="text-sm text-gray-700 mb-4 space-y-2">
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-amber-500 mr-1 flex-shrink-0" />
                <span>1:1 backed by Bitcoin</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-amber-500 mr-1 flex-shrink-0" />
                <span>No custodial risk</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-amber-500 mr-1 flex-shrink-0" />
                <span>Use in DeFi applications</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Yield Opportunities</h3>
              <CircleDollarSign className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Earn yield on your sBTC through various DeFi protocols on Stacks.
            </p>
            <ul className="text-sm text-gray-700 mb-4 space-y-2">
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-indigo-500 mr-1 flex-shrink-0" />
                <span>Liquidity providing</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-indigo-500 mr-1 flex-shrink-0" />
                <span>Yield farming</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="w-4 h-4 text-indigo-500 mr-1 flex-shrink-0" />
                <span>Staking opportunities</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">
            Full wallet integration and DeFi features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SbtcDeFiDashboard;