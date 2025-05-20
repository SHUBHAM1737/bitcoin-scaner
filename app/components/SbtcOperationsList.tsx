'use client';
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  Info, 
  Search, 
  Filter, 
  Calendar, 
  Wallet,
  Loader2,
  AlertCircle,
  ExternalLink,
  Bitcoin,
  Hash
} from 'lucide-react';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';
import { STACKS_NETWORKS } from '@/app/config/blockchain';
import { UserSession } from '@stacks/connect-react';
import { SbtcService } from '@/app/services/sbtcService';

interface SbtcOperation {
  txid: string;
  type: string;
  amount: string;
  rawAmount: string;
  counterparty: string;
  sender: string;
  timestamp: string;
  status: string;
  blockHeight?: number;
  events?: any[];
}

interface SbtcOperationsListProps {
  address?: string;
  network: 'mainnet' | 'testnet';
  onSelectOperation?: (operation: SbtcOperation) => void;
  limit?: number;
}

const SbtcOperationsList: React.FC<SbtcOperationsListProps> = ({ 
  address, 
  network = 'mainnet',
  onSelectOperation,
  limit = 10
}) => {
  const [operations, setOperations] = useState<SbtcOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sbtcService, setSbtcService] = useState<SbtcService | null>(null);
  
  // Initialize sBTC service
  useEffect(() => {
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
  
  // Fetch sBTC operations for an address
  useEffect(() => {
    const fetchSbtcOperations = async () => {
      if (!address || !sbtcService) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch transactions for this address
        const txHistory = await sbtcService.getTransactionHistory(address);
        setOperations(txHistory);
      } catch (error) {
        console.error('Error fetching sBTC operations:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch sBTC operations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSbtcOperations();
  }, [address, sbtcService]);
  
  // Filter operations based on selected type and search term
  const filteredOperations = operations.filter(op => {
    // Filter by type
    const typeMatch = filterType === 'all' || op.type === filterType;
    
    // Filter by search term
    const searchMatch = !searchTerm || 
      op.txid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.counterparty.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && searchMatch;
  });
  
  if (!address) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Wallet className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Address Selected</h3>
        <p className="text-gray-500">Enter a Stacks address to see sBTC operations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-gray-700">Loading sBTC operations...</span>
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
        <p className="text-gray-500">Unable to load sBTC operations</p>
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Info className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No sBTC Operations</h3>
        <p className="text-gray-500">This address hasn't performed any sBTC operations yet</p>
      </div>
    );
  }

  // Get unique operation types for filter
  const operationTypes = Array.from(new Set(operations.map(op => op.type)));

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">sBTC Operations</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              {operationTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="divide-y">
        {filteredOperations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No operations match your filters
          </div>
        ) : (
          filteredOperations.map((operation) => (
            <div 
              key={operation.txid}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-300"
              onClick={() => onSelectOperation && onSelectOperation(operation)}
            >
              <div className="flex items-start">
                <div className="p-2 rounded-full mr-3 flex-shrink-0">
                  {operation.type === 'deposit' && <ArrowDownToLine className="w-5 h-5 text-green-500" />}
                  {operation.type === 'withdraw' && <ArrowUpFromLine className="w-5 h-5 text-red-500" />}
                  {operation.type === 'transfer' && <RefreshCw className="w-5 h-5 text-amber-500" />}
                  {!(['deposit', 'withdraw', 'transfer'].includes(operation.type)) && <Info className="w-5 h-5 text-gray-500" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {operation.type} Operation
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="inline-flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(operation.timestamp)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-600">
                        {operation.amount} sBTC
                      </div>
                      <div className={`text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full ${
                        operation.status === 'success' ? 'bg-green-100 text-green-800' :
                        operation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {operation.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs text-gray-500">
                    <div className="overflow-hidden text-ellipsis">
                      From: {formatAddress(operation.sender)}
                    </div>
                    {operation.counterparty && (
                      <div className="overflow-hidden text-ellipsis">
                        To: {formatAddress(operation.counterparty)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-400 flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    {formatAddress(operation.txid)}
                    <a 
                      href={`${STACKS_NETWORKS[network].explorerUrl}txid/${operation.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-indigo-400 hover:text-indigo-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SbtcOperationsList;