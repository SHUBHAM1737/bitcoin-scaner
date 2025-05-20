'use client';
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Tag, 
  Maximize2,
  Layers,
  Clock,
  RefreshCw,
  Hash,
  Activity,
  BarChart3
} from 'lucide-react';
import { BIP300Service, BIP300Block } from '@/app/services/bip300Service';
import { BIP300_NETWORKS } from '@/app/config/bip300';
import { formatAddress, formatDate } from '@/app/utils/formatUtils';
import MermaidDiagram from './MermaidDiagram';
import DiagramModal from './DiagramModal';

interface SidechainBlockAnalyzerProps {
  blockHash: string;
  sidechainType: string;
  onAnalysisComplete?: (result: any) => void;
}

const SidechainBlockAnalyzer: React.FC<SidechainBlockAnalyzerProps> = ({
  blockHash,
  sidechainType,
  onAnalysisComplete
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [block, setBlock] = useState<BIP300Block | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [diagramVisible, setDiagramVisible] = useState(false);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  
  // Generate a basic mermaid diagram for the block
  const generateDiagram = (blockData: BIP300Block) => {
    if (!blockData) return null;
    
    // Create a basic diagram for block
    let diagram = 'graph TB\n';
    diagram += '    %% Node Styling\n';
    diagram += '    classDef block fill:#f7931a,stroke:#c27214,stroke-width:2px;\n';
    diagram += '    classDef transaction fill:#5546FF,stroke:#3b30c9,stroke-width:2px;\n';
    diagram += '    classDef sidechain fill:#4299e1,stroke:#3182ce,stroke-width:2px;\n\n';
    
    // Create node for the block
    diagram += `    B[Block #${blockData.height}]`;
    
    // Add transactions if available (limit to first 5 to avoid overcrowding)
    if (transactions && transactions.length > 0) {
      diagram += '\n';
      const transactionsToShow = transactions.slice(0, 5);
      
      transactionsToShow.forEach((tx, index) => {
        diagram += `    T${index}[TX: ${formatAddress(tx.txid)}]\n`;
        diagram += `    B --> T${index}\n`;
        
        // If transaction has from/to, add them
        if (tx.from && tx.to) {
          diagram += `    F${index}[From: ${formatAddress(tx.from)}]\n`;
          diagram += `    R${index}[To: ${formatAddress(tx.to)}]\n`;
          diagram += `    F${index} --> T${index}\n`;
          diagram += `    T${index} --> R${index}\n`;
        }
      });
      
      // If there are more transactions than we're showing
      if (transactions.length > 5) {
        diagram += `    M[... ${transactions.length - 5} more transactions ...]\n`;
        diagram += '    B --> M\n';
        diagram += '    style M fill:#f0f0f0,stroke:#dddddd,stroke-width:1px;\n';
      }
    }
    
    // Add previous and next block references if available
    if (blockData.prevHash) {
      diagram += `    P[Block #${blockData.height - 1}]\n`;
      diagram += '    P --> B\n';
      diagram += '    class P block;\n';
    }
    
    // Apply styling
    diagram += '    class B block;\n';
    
    for (let i = 0; i < Math.min(transactions.length, 5); i++) {
      diagram += `    class T${i} transaction;\n`;
    }
    
    return diagram;
  };
  
  // Fetch block data
  useEffect(() => {
    const fetchBlock = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const service = new BIP300Service(sidechainType);
        
        // First check if the input is a block height
        let blockData: BIP300Block;
        
        if (/^\d+$/.test(blockHash)) {
          // It's a block height
          blockData = await service.getBlock(parseInt(blockHash));
        } else {
          // It's a block hash
          blockData = await service.getBlock(blockHash);
        }
        
        setBlock(blockData);
        
        // Try to fetch some transactions for this block
        try {
          // In a real app, you'd use a proper API to get transactions for a block
          // Here we'll simulate it by getting recent transactions
          const txs = await service.getRecentTransactions(10);
          // Filter to only include transactions that might be in this block
          const filteredTxs = txs.filter(tx => tx.blockHeight === blockData.height);
          setTransactions(filteredTxs);
        } catch (txError) {
          console.warn('Error fetching block transactions:', txError);
          setTransactions([]);
        }
        
        // Generate diagram
        const diagram = generateDiagram(blockData);
        setMermaidChart(diagram);
        setDiagramVisible(true);
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(blockData);
        }
      } catch (error) {
        console.error('Error fetching block:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch block data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlock();
  }, [blockHash, sidechainType]);
  
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
            <span>{BIP300_NETWORKS[sidechainType]?.name || 'Sidechain'} Block Analysis</span>
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
            <span className="text-gray-500">Analyzing block...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : block ? (
          <div className="space-y-6">
            {/* Basic Block Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Block Hash</div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
                  {block.hash}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Height</div>
                <div className="font-medium text-gray-900">{block.height}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Timestamp</div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(block.timestamp)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Transactions</div>
                <div className="font-medium text-gray-900">{block.txCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Previous Block</div>
                <div className="font-medium font-mono text-gray-900 truncate">{formatAddress(block.prevHash || 'Genesis')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Size</div>
                <div className="font-medium text-gray-900">{(block.size / 1024).toFixed(2)} KB</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Confirmations</div>
                <div className="font-medium text-gray-900">{block.confirmations}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Miner</div>
                <div className="font-medium text-gray-900">{block.miner || 'Unknown'}</div>
              </div>
            </div>
            
            {/* Block Visualization */}
            {diagramVisible && mermaidChart && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Block Structure Diagram</h3>
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
            
            {/* Block Transactions */}
            <div className={`bg-${getSidechainColor()}-50 rounded-lg p-4 border border-${getSidechainColor()}-100`}>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>Block Transactions</span>
              </h3>
              
              {transactions.length === 0 ? (
                <div className="bg-white p-6 rounded-lg text-center text-gray-500">
                  No transaction data available for this block
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{formatAddress(tx.txid)}</div>
                          <div className="text-sm text-gray-500">
                            {tx.from && tx.to ? (
                              <span>
                                From: {formatAddress(tx.from)} → To: {formatAddress(tx.to)}
                              </span>
                            ) : (
                              <span>Type: {tx.type || "Transaction"}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{tx.value || "0 BTC"}</div>
                          <div className="text-xs text-gray-500">Fee: {tx.fee || "0 BTC"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Technical Details */}
            <div className={`bg-${getSidechainColor()}-50 rounded-lg p-4 border border-${getSidechainColor()}-100`}>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Technical Details</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Merkle Root</div>
                  <div className="font-mono text-sm truncate">{block.merkleRoot || "N/A"}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Nonce</div>
                  <div className="text-sm">{block.nonce}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Bits</div>
                  <div className="text-sm">{block.bits || "N/A"}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                  <div className="text-sm">{block.difficulty?.toExponential(4) || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No block data found
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

export default SidechainBlockAnalyzer;