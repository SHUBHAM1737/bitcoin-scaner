'use client';
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  Search, 
  Zap, 
  Shield, 
  Tag, 
  ArrowRight,
  Maximize2,
  Hash,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';
import { BIP300Service } from '@/app/services/bip300Service';
import { BIP300_NETWORKS } from '@/app/config/bip300';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';
import MermaidDiagram from './MermaidDiagram';
import DiagramModal from './DiagramModal';

interface BIP300TransactionAnalyzerProps {
  txHash: string;
  sidechainType: string;
  onAnalysisComplete?: (result: any) => void;
}

const BIP300TransactionAnalyzer: React.FC<BIP300TransactionAnalyzerProps> = ({
  txHash,
  sidechainType,
  onAnalysisComplete
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any | null>(null);
  const [diagramVisible, setDiagramVisible] = useState(false);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  
  // Generate a basic mermaid diagram for the transaction
  const generateDiagram = (tx: any) => {
    if (!tx) return null;
    
    // Create a basic diagram based on transaction type
    let diagram = 'graph LR\n';
    diagram += '    %% Node Styling\n';
    diagram += '    classDef wallet fill:#f7931a,stroke:#c27214,stroke-width:2px;\n';
    diagram += '    classDef contract fill:#5546FF,stroke:#3b30c9,stroke-width:2px;\n';
    diagram += '    classDef value fill:#fff1e5,stroke:#b35900,stroke-width:2px;\n';
    diagram += '    classDef sidechain fill:#4299e1,stroke:#3182ce,stroke-width:2px;\n\n';
    
    // Create nodes for sender, receiver, and any contracts
    const sender = tx.from || 'Unknown';
    const receiver = tx.to || 'Unknown';
    
    diagram += `    A[From: ${formatAddress(sender)}] -->|${tx.type || 'transfer'} ${tx.value || ''}| B[To: ${formatAddress(receiver)}]\n`;
    
    // Add styling
    diagram += '    class A wallet;\n';
    diagram += '    class B wallet;\n';
    
    // Handle different transaction types with additional nodes if needed
    if (tx.type === 'deposit') {
      diagram += '    M((Bitcoin Mainnet)) -->|lock BTC| S((Sidechain))\n';
      diagram += '    S -->|mint| B\n';
      diagram += '    class M wallet;\n';
      diagram += '    class S sidechain;\n';
    } else if (tx.type === 'withdrawal') {
      diagram += '    A -->|burn| S((Sidechain))\n';
      diagram += '    S -->|unlock BTC| M((Bitcoin Mainnet))\n';
      diagram += '    M -->|transfer| B\n';
      diagram += '    class M wallet;\n';
      diagram += '    class S sidechain;\n';
    }
    
    return diagram;
  };
  
  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const service = new BIP300Service(sidechainType);
        const txData = await service.getTransaction(txHash);
        
        setTransaction(txData);
        
        // Generate diagram
        const diagram = generateDiagram(txData);
        setMermaidChart(diagram);
        setDiagramVisible(true);
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(txData);
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch transaction data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransaction();
  }, [txHash, sidechainType]);
  
  // Get sidechain icon based on type
  const getSidechainIcon = () => {
    switch (sidechainType) {
      case 'thunder':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'zside':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'bitnames':
        return <Tag className="w-5 h-5 text-green-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Get sidechain color based on type
  const getSidechainColor = (): string => {
    switch (sidechainType) {
      case 'thunder': return 'blue';
      case 'zside': return 'purple';
      case 'bitnames': return 'green';
      default: return 'gray';
    }
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {getSidechainIcon()}
            <span>{BIP300_NETWORKS[sidechainType]?.name || 'Sidechain'} Transaction Analysis</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              title="Refresh analysis"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">Analyzing transaction...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Basic Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Transaction Hash</div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                  {transaction.txid}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  transaction.status === 'confirmed' || transaction.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : transaction.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Type</div>
                <div className="font-medium text-gray-900 capitalize">{transaction.type || 'Transfer'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Value</div>
                <div className="font-medium text-gray-900">{transaction.value || '0 BTC'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">From</div>
                <div className="font-medium font-mono text-gray-900">{formatAddress(transaction.from || 'Unknown')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">To</div>
                <div className="font-medium font-mono text-gray-900">{formatAddress(transaction.to || 'Unknown')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Timestamp</div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(transaction.timestamp)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Fee</div>
                <div className="font-medium text-gray-900">{transaction.fee || '0 BTC'}</div>
              </div>
            </div>
            
            {/* Transaction Flow Visualization */}
            {diagramVisible && mermaidChart && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Transaction Flow Diagram</h3>
                  <button
                    onClick={() => setIsDiagramModalOpen(true)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    title="View full screen"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div className="w-full bg-white rounded-lg p-4 shadow-inner">
                  <MermaidDiagram chart={mermaidChart} />
                </div>
              </div>
            )}
            
            {/* Additional Transaction Details */}
            {transaction.inputs && transaction.inputs.length > 0 && (
              <div className={`bg-${getSidechainColor()}-50 rounded-lg p-4 border border-${getSidechainColor()}-100`}>
                <h3 className="font-medium text-gray-900 mb-3">Inputs</h3>
                <div className="space-y-2">
                  {transaction.inputs.map((input: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500">Previous TX</div>
                          <div className="font-mono text-sm truncate">{input.txid}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Output Index</div>
                          <div className="text-sm">{input.vout}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {transaction.outputs && transaction.outputs.length > 0 && (
              <div className={`bg-${getSidechainColor()}-50 rounded-lg p-4 border border-${getSidechainColor()}-100`}>
                <h3 className="font-medium text-gray-900 mb-3">Outputs</h3>
                <div className="space-y-2">
                  {transaction.outputs.map((output: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500">Index</div>
                          <div className="text-sm">{output.n}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Value</div>
                          <div className="text-sm">{output.value}</div>
                        </div>
                        {output.scriptPubKey && output.scriptPubKey.address && (
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">Address</div>
                            <div className="font-mono text-sm truncate">{output.scriptPubKey.address}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No transaction data found
          </div>
        )}
      </div>
      
      {/* Diagram Modal */}
      <DiagramModal
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
        chart={mermaidChart || ''}
      />
    </div>
  );
};

export default BIP300TransactionAnalyzer;