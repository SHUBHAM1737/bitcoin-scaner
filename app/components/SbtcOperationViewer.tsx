'use client';
import React, { useEffect, useState } from 'react';
import { 
  Bitcoin, 
  ExternalLink, 
  Check, 
  XCircle, 
  AlertCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  Info,
  Loader2,
  Hash
} from 'lucide-react';
import { SbtcOperation, analyzeSbtcOperation, generateSbtcInsights } from '@/app/utils/sbtcAnalyzer';
import { formatAddress } from '@/app/utils/formatUtils';
import { STACKS_NETWORKS } from '@/app/config/blockchain';

interface SbtcOperationViewerProps {
  txId: string;
  network: 'mainnet' | 'testnet';
}

const SbtcOperationViewer: React.FC<SbtcOperationViewerProps> = ({ txId, network = 'mainnet' }) => {
  const [operation, setOperation] = useState<SbtcOperation | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAnalyzeOperation = async () => {
      if (!txId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch transaction data
        const apiUrl = STACKS_NETWORKS[network].apiUrl;
        const txUrl = `${apiUrl}/extended/v1/tx/${txId}`;
        const encodedUrl = encodeURIComponent(txUrl);
        
        // Use absolute URL format
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const requestUrl = `${origin}/api/blockchain-data?url=${encodedUrl}`;
        
        const response = await fetch(requestUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transaction: ${response.statusText}`);
        }
        
        const txData = await response.json();
        
        // Analyze the transaction for sBTC operations
        const sbtcOp = analyzeSbtcOperation(txData, network);
        
        if (!sbtcOp) {
          setError('This transaction does not contain an sBTC operation.');
          setOperation(null);
          setInsights([]);
          return;
        }
        
        // Generate insights for this operation
        const opInsights = generateSbtcInsights(sbtcOp);
        
        setOperation(sbtcOp);
        setInsights(opInsights);
        
      } catch (error) {
        console.error('Error analyzing sBTC operation:', error);
        setError(error instanceof Error ? error.message : 'Failed to analyze sBTC operation');
        setOperation(null);
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndAnalyzeOperation();
  }, [txId, network]);

  if (!txId) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Info className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Transaction Selected</h3>
        <p className="text-gray-500">Select a transaction to view sBTC operation details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-gray-700">Analyzing sBTC operation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
        
        <div className="flex items-center justify-center mt-4">
          <a
            href={`${STACKS_NETWORKS[network].explorerUrl}txid/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Not an sBTC Operation</h3>
        <p className="text-gray-500">This transaction does not contain any sBTC operations</p>
      </div>
    );
  }

  // Status indicator
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    complete: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
  };
  
  const statusIcons = {
    pending: <RefreshCw className="w-4 h-4 mr-1" />,
    complete: <Check className="w-4 h-4 mr-1" />,
    failed: <XCircle className="w-4 h-4 mr-1" />
  };
  
  // Operation type icons
  const typeIcons = {
    deposit: <ArrowDownToLine className="w-5 h-5 mr-2 text-green-600" />,
    withdrawal: <ArrowUpFromLine className="w-5 h-5 mr-2 text-red-600" />,
    transfer: <RefreshCw className="w-5 h-5 mr-2 text-amber-600" />,
    unknown: <Info className="w-5 h-5 mr-2 text-gray-600" />
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bitcoin className="w-6 h-6 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">sBTC Operation Details</h3>
          </div>
          <div className={`px-3 py-1 rounded-full border flex items-center text-sm font-medium ${statusColors[operation.status]}`}>
            {statusIcons[operation.status]}
            <span className="capitalize">{operation.status}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-5">
          <div className="text-lg font-medium flex items-center">
            {typeIcons[operation.type]} 
            <span className="capitalize">{operation.type}</span>
          </div>
          <div className="ml-4 text-xl font-bold text-amber-600">{operation.amount} sBTC</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">From</div>
            <div className="text-gray-900 font-medium">{formatAddress(operation.sender)}</div>
          </div>
          
          {operation.recipient && (
            <div>
              <div className="text-sm text-gray-500 mb-1">To</div>
              <div className="text-gray-900 font-medium">{formatAddress(operation.recipient)}</div>
            </div>
          )}
          
          {operation.contractId && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Contract</div>
              <div className="text-gray-900 font-medium">{formatAddress(operation.contractId)}</div>
            </div>
          )}
          
          {operation.functionName && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Function</div>
              <div className="text-gray-900 font-medium">{operation.functionName}</div>
            </div>
          )}
          
          {operation.blockHeight && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Block Height</div>
              <div className="text-gray-900 font-medium">{operation.blockHeight.toLocaleString()}</div>
            </div>
          )}
          
          {operation.fee && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Fee</div>
              <div className="text-gray-900 font-medium">{operation.fee} STX</div>
            </div>
          )}
        </div>
        
        {operation.bitcoinTxId && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-sm text-gray-500 mb-1">Bitcoin Transaction</div>
            <div className="flex items-center">
              <span className="text-gray-900 font-medium">{formatAddress(operation.bitcoinTxId)}</span>
              <a 
                href={`https://mempool.space/${network === 'testnet' ? 'testnet/' : ''}tx/${operation.bitcoinTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-amber-600 hover:text-amber-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
        
        {operation.memo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Memo</div>
            <div className="text-gray-900">{operation.memo}</div>
          </div>
        )}
      </div>
      
      {/* Gas optimization section */}
      {operation.gasCostAnalysis && (
        <div className="p-6 border-t">
          <h4 className="text-base font-medium text-gray-900 mb-3">Gas Analysis</h4>
          
          <div className={`p-3 rounded-lg mb-3 border ${
            operation.gasCostAnalysis.comparison === 'high' ? 'bg-red-50 border-red-100' :
            operation.gasCostAnalysis.comparison === 'low' ? 'bg-green-50 border-green-100' :
            'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Cost</span>
              <span className="font-medium">{operation.gasCostAnalysis.costInSTX} STX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">USD Value</span>
              <span className="font-medium">${operation.gasCostAnalysis.costInUSD}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-600">Comparison</span>
              <span className={`font-medium capitalize ${
                operation.gasCostAnalysis.comparison === 'high' ? 'text-red-600' :
                operation.gasCostAnalysis.comparison === 'low' ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {operation.gasCostAnalysis.comparison}
              </span>
            </div>
          </div>
          
          {operation.gasCostAnalysis.optimization && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Optimization Tip</div>
              <div className="text-blue-700">{operation.gasCostAnalysis.optimization}</div>
            </div>
          )}
        </div>
      )}
      
      {/* Insights section */}
      {insights.length > 0 && (
        <div className="p-6 border-t">
          <h4 className="text-base font-medium text-gray-900 mb-3">sBTC Insights</h4>
          
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-indigo-700">{insight}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-6 border-t bg-gray-50 flex justify-end">
        <a
          href={`${STACKS_NETWORKS[network].explorerUrl}txid/${operation.txId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <span>View on Explorer</span>
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>
    </div>
  );
};

export default SbtcOperationViewer;