'use client';
import React, { useState } from 'react';
import RunesExplorer from './RunesExplorer';
import OrdinalsExplorer from './OrdinalsExplorer';
import Brc20Explorer from './Brc20Explorer';
import { Bitcoin, ImageIcon, CircleDollarSign } from 'lucide-react';

const RebarExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('runes');

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Bitcoin Metaprotocols Explorer</h2>
          <div className="text-sm text-gray-500">Powered by Rebar Labs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('runes')}
            className={`px-4 py-3 flex-1 flex justify-center items-center gap-2 ${
              activeTab === 'runes'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bitcoin className="w-5 h-5" />
            <span>Runes</span>
          </button>
          <button
            onClick={() => setActiveTab('ordinals')}
            className={`px-4 py-3 flex-1 flex justify-center items-center gap-2 ${
              activeTab === 'ordinals'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Ordinals</span>
          </button>
          <button
            onClick={() => setActiveTab('brc20')}
            className={`px-4 py-3 flex-1 flex justify-center items-center gap-2 ${
              activeTab === 'brc20'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CircleDollarSign className="w-5 h-5" />
            <span>BRC-20</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'runes' && <RunesExplorer />}
          {activeTab === 'ordinals' && <OrdinalsExplorer />}
          {activeTab === 'brc20' && <Brc20Explorer />}
        </div>
      </div>
    </div>
  );
};

export default RebarExplorer;