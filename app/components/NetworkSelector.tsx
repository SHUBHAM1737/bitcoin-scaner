'use client';
import React, { useState } from 'react';
import { Bitcoin, Layers, ChevronDown, Network } from 'lucide-react';

interface NetworkSelectorProps {
  activeNetwork: string;
  activeSubNetwork: string;
  onChange: (network: string, subNetwork: string) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ 
  activeNetwork, 
  activeSubNetwork, 
  onChange 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleNetworkClick = (network: string, subNetwork: string) => {
    onChange(network, subNetwork);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {activeNetwork === 'bitcoin' ? (
          <Bitcoin className="w-5 h-5 text-amber-500" />
        ) : activeNetwork === 'stacks' ? (
          <Layers className="w-5 h-5 text-indigo-500" />
        ) : (
          <Network className="w-5 h-5 text-blue-500" />
        )}
        <span className="text-sm font-medium">
          {activeNetwork === 'bitcoin' ? 'Bitcoin' : 
           activeNetwork === 'stacks' ? 'Stacks' : 
           activeNetwork === 'sidechain' ? 'Sidechain' : 'Unknown'} 
          {' '}
          {activeSubNetwork}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                Bitcoin
              </div>
              <button
                onClick={() => handleNetworkClick('bitcoin', 'mainnet')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'bitcoin' && activeSubNetwork === 'mainnet'
                    ? 'bg-amber-50 text-amber-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Bitcoin className="w-4 h-4 text-amber-500" />
                <span>Bitcoin Mainnet</span>
              </button>
              <button
                onClick={() => handleNetworkClick('bitcoin', 'testnet')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'bitcoin' && activeSubNetwork === 'testnet'
                    ? 'bg-amber-50 text-amber-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Bitcoin className="w-4 h-4 text-amber-500" />
                <span>Bitcoin Testnet</span>
              </button>
            </div>

            <div className="border-t my-1" />

            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                Stacks
              </div>
              <button
                onClick={() => handleNetworkClick('stacks', 'mainnet')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'stacks' && activeSubNetwork === 'mainnet'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Stacks Mainnet</span>
              </button>
              <button
                onClick={() => handleNetworkClick('stacks', 'testnet')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'stacks' && activeSubNetwork === 'testnet'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Stacks Testnet</span>
              </button>
            </div>
            
            <div className="border-t my-1" />

            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                BIP300 Sidechains
              </div>
              <button
                onClick={() => handleNetworkClick('sidechain', 'thunder')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'sidechain' && activeSubNetwork === 'thunder'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Network className="w-4 h-4 text-blue-500" />
                <span>Thunder</span>
              </button>
              <button
                onClick={() => handleNetworkClick('sidechain', 'zside')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'sidechain' && activeSubNetwork === 'zside'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Network className="w-4 h-4 text-blue-500" />
                <span>zSide</span>
              </button>
              <button
                onClick={() => handleNetworkClick('sidechain', 'bitnames')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md ${
                  activeNetwork === 'sidechain' && activeSubNetwork === 'bitnames'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Network className="w-4 h-4 text-blue-500" />
                <span>BitNames</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;