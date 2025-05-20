// app/components/BitcoinExplorer.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useChat } from 'ai/react';
import { 
  Search, 
  List,
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  Bitcoin,
  Activity,
  Box,
  Clock,
  Hash,
  ChevronRight,
  Maximize2,
  Layers,
  Info,
  X,
  CircleDollarSign,
  ImageIcon,
  Network
} from 'lucide-react';
import { formatAssistantMessage } from '../utils/messageFormatter';
import { formatAddress, formatDate } from '../utils/formatUtils';
import MermaidDiagram from './MermaidDiagram';
import DiagramModal from './DiagramModal';
import NetworkSelector from './NetworkSelector';
import { validateBitcoinAddress, validateStacksAddress } from '../utils/addressValidator';
import { StacksApiService, StacksTransaction, StacksBlock } from '@/app/services/stacksApiService';
import { BITCOIN_NETWORKS, STACKS_NETWORKS } from '@/app/config/blockchain';
import SbtcAnalyticsTab from './SbtcAnalyticsTab';
import SbtcDeFiDashboard from './SbtcDeFiDashboard';
import RunesExplorer from './RunesExplorer';
import OrdinalsExplorer from './OrdinalsExplorer';
import Brc20Explorer from './Brc20Explorer';
import RebarExplorer from './RebarExplorer';
import { BIP300_NETWORKS } from '../config/bip300';
import SidechainExplorer from './SidechainExplorer';
import BIP300Explorer from './BIP300Explorer';
import BIP300Dashboard from './BIP300Dashboard';
import ExplorerTabs from './ExplorerTabs';
import DashboardTabs from './DashboardTabs';
import { BIP300Service } from '@/app/services/bip300Service';
import BIP300TransactionAnalyzer from './BIP300TransactionAnalyzer';
import SidechainBlockAnalyzer from './SidechainBlockAnalyzer';

// Type definitions
interface NetworkStats {
  latestBlock: number;
  avgFeeRate: string;
  pendingTxns: number;
}

const BitcoinExplorer: React.FC = () => {
  // State for blockchain data
  const [latestBlocks, setLatestBlocks] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    latestBlock: 0,
    avgFeeRate: '0',
    pendingTxns: 0,
  });
  
  // UI state
  const [isLoadingChainData, setIsLoadingChainData] = useState(true);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState('bitcoin'); // 'bitcoin' or 'stacks'
  const [activeSubNetwork, setActiveSubNetwork] = useState('mainnet'); // 'mainnet' or 'testnet'
  const [error, setError] = useState<string | null>(null);
  const [showSbtcAnalytics, setShowSbtcAnalytics] = useState(false);
  const [showDeFiDashboard, setShowDeFiDashboard] = useState(false);
  const [showMetaprotocols, setShowMetaprotocols] = useState(false);
  const [showBIP300Dashboard, setShowBIP300Dashboard] = useState(false);
  const [activeMetaprotocolTab, setActiveMetaprotocolTab] = useState('runes'); // 'runes', 'ordinals', or 'brc20'
  const [infoMessage, setInfoMessage] = useState<string | null>(
    "New: Explore Bitcoin BIP300 sidechains like Thunder, zSide & BitNames with our new BIP300 integration!"
  );
  const [isSidechainTransaction, setIsSidechainTransaction] = useState(false);
  const [sidechainType, setSidechainType] = useState('');
  const [showSidechainAnalyzer, setShowSidechainAnalyzer] = useState(false);
  const [isBlock, setIsBlock] = useState(false);
  const [sidechainTransactionType, setSidechainTransactionType] = useState<'transaction' | 'block'>('transaction');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, isLoading, error: chatError, reload, stop, setInput } = useChat({
    api: '/api/chat',
    id: selectedTxHash || undefined,
    body: {
      txHash: selectedTxHash,
      network: activeNetwork === 'sidechain' 
        ? `sidechain-${activeSubNetwork}` 
        : activeNetwork,
      subNetwork: activeSubNetwork
    },
    onFinish: (message) => {
      console.log('Raw message content:', message.content);
      
      const mermaidMatch = message.content.match(/```mermaid\n([\s\S]*?)\n```/);
      console.log('Mermaid match:', mermaidMatch);
      
      if (mermaidMatch) {
        const diagram = mermaidMatch[1].trim();
        console.log('Extracted diagram:', diagram);
        setMermaidChart(diagram);
        setCurrentMessage(message.content.replace(/```mermaid\n[\s\S]*?\n```/, '').trim());
      } else {
        console.log('No Mermaid diagram found');
        setCurrentMessage(message.content);
        setMermaidChart(null);
      }

      const analysisSection = document.getElementById('analysis-section');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Fetch Bitcoin data
  const fetchBitcoinData = async () => {
    try {
      setIsLoadingChainData(true);
      setIsRefreshing(true);
      setError(null);
      
      // Use origin for absolute URLs
      const origin = window.location.origin;
      
      // Fetch recent blocks
      const blocksUrl = encodeURIComponent('https://mempool.space/api/blocks');
      const blocksResponse = await fetch(`${origin}/api/blockchain-data?url=${blocksUrl}`);
      
      if (!blocksResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin blocks: ${blocksResponse.statusText}`);
      }
      
      const blocksData = await blocksResponse.json();
      setLatestBlocks(blocksData.slice(0, 10));
      
      if (blocksData.length > 0) {
        setNetworkStats(prev => ({
          ...prev,
          latestBlock: blocksData[0].height
        }));
      }
      
      // Fetch recent transactions
      const txUrl = encodeURIComponent('https://mempool.space/api/mempool/recent');
      const txResponse = await fetch(`${origin}/api/blockchain-data?url=${txUrl}`);
      
      if (!txResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin transactions: ${txResponse.statusText}`);
      }
      
      const txData = await txResponse.json();
      setRecentTransactions(txData.slice(0, 10));
      
      // Fetch fee estimates
      const feeUrl = encodeURIComponent('https://mempool.space/api/v1/fees/recommended');
      const feeResponse = await fetch(`${origin}/api/blockchain-data?url=${feeUrl}`);
      
      if (!feeResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin fee estimates: ${feeResponse.statusText}`);
      }
      
      const feeData = await feeResponse.json();
      
      // Fetch mempool stats
      const mempoolUrl = encodeURIComponent('https://mempool.space/api/mempool/stats');
      const mempoolResponse = await fetch(`${origin}/api/blockchain-data?url=${mempoolUrl}`);
      
      if (!mempoolResponse.ok) {
        // Try alternative endpoint
        const altMempoolUrl = encodeURIComponent('https://mempool.space/api/mempool');
        const altResponse = await fetch(`${origin}/api/blockchain-data?url=${altMempoolUrl}`);
        
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch mempool stats: ${mempoolResponse.statusText}`);
        }
        
        const mempoolData = await altResponse.json();
        
        setNetworkStats({
          latestBlock: blocksData[0]?.height || 0,
          avgFeeRate: feeData.fastestFee?.toString() || '0',
          pendingTxns: mempoolData.count || 0
        });
      } else {
        const mempoolData = await mempoolResponse.json();
        
        setNetworkStats({
          latestBlock: blocksData[0]?.height || 0,
          avgFeeRate: feeData.fastestFee?.toString() || '0',
          pendingTxns: mempoolData.count || 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      // Fix: Ensure error is converted to string
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingChainData(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Bitcoin Testnet data
  const fetchBitcoinTestnetData = async () => {
    try {
      setIsLoadingChainData(true);
      setIsRefreshing(true);
      setError(null);
      
      // Use origin for absolute URLs
      const origin = window.location.origin;
      
      // Fetch recent blocks
      const blocksUrl = encodeURIComponent('https://mempool.space/testnet/api/blocks');
      const blocksResponse = await fetch(`${origin}/api/blockchain-data?url=${blocksUrl}`);
      
      if (!blocksResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin testnet blocks: ${blocksResponse.statusText}`);
      }
      
      const blocksData = await blocksResponse.json();
      setLatestBlocks(blocksData.slice(0, 10));
      
      if (blocksData.length > 0) {
        setNetworkStats(prev => ({
          ...prev,
          latestBlock: blocksData[0].height
        }));
      }
      
      // Fetch recent transactions
      const txUrl = encodeURIComponent('https://mempool.space/testnet/api/mempool/recent');
      const txResponse = await fetch(`${origin}/api/blockchain-data?url=${txUrl}`);
      
      if (!txResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin testnet transactions: ${txResponse.statusText}`);
      }
      
      const txData = await txResponse.json();
      setRecentTransactions(txData.slice(0, 10));
      
      // Fetch fee estimates
      const feeUrl = encodeURIComponent('https://mempool.space/testnet/api/v1/fees/recommended');
      const feeResponse = await fetch(`${origin}/api/blockchain-data?url=${feeUrl}`);
      
      if (!feeResponse.ok) {
        throw new Error(`Failed to fetch Bitcoin testnet fee estimates: ${feeResponse.statusText}`);
      }
      
      const feeData = await feeResponse.json();
      
      // Fetch mempool stats
      const mempoolUrl = encodeURIComponent('https://mempool.space/testnet/api/mempool/stats');
      const mempoolResponse = await fetch(`${origin}/api/blockchain-data?url=${mempoolUrl}`);
      
      if (!mempoolResponse.ok) {
        // Try alternative endpoint
        const altMempoolUrl = encodeURIComponent('https://mempool.space/testnet/api/mempool');
        const altResponse = await fetch(`${origin}/api/blockchain-data?url=${altMempoolUrl}`);
        
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch testnet mempool stats: ${mempoolResponse.statusText}`);
        }
        
        const mempoolData = await altResponse.json();
        
        setNetworkStats({
          latestBlock: blocksData[0]?.height || 0,
          avgFeeRate: feeData.fastestFee?.toString() || '0',
          pendingTxns: mempoolData.count || 0
        });
      } else {
        const mempoolData = await mempoolResponse.json();
        
        setNetworkStats({
          latestBlock: blocksData[0]?.height || 0,
          avgFeeRate: feeData.fastestFee?.toString() || '0',
          pendingTxns: mempoolData.count || 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching Bitcoin testnet data:', error);
      // Fix: Ensure error is converted to string
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingChainData(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Stacks data
  const fetchStacksData = async () => {
    try {
      setIsLoadingChainData(true);
      setIsRefreshing(true);
      setError(null);
      
      const apiUrl = STACKS_NETWORKS[activeSubNetwork].apiUrl;
      
      // Use origin for absolute URLs
      const origin = window.location.origin;
      
      // Fetch recent blocks
      try {
        const encodedUrl = encodeURIComponent(`${apiUrl}/extended/v1/block?limit=10`);
        const blocksResponse = await fetch(`${origin}/api/blockchain-data?url=${encodedUrl}`);
        
        if (!blocksResponse.ok) {
          throw new Error(`Failed to fetch Stacks blocks: ${blocksResponse.statusText}`);
        }
        
        const blocksData = await blocksResponse.json();
        
        if (blocksData && blocksData.results && Array.isArray(blocksData.results)) {
          setLatestBlocks(blocksData.results);
          
          if (blocksData.results.length > 0) {
            setNetworkStats(prev => ({
              ...prev,
              latestBlock: blocksData.results[0].height
            }));
          }
        } else {
          console.error('Invalid blocks data format:', blocksData);
          throw new Error('Invalid blocks data format from API');
        }
      } catch (blockError) {
        console.error('Error fetching Stacks blocks:', blockError);
        setLatestBlocks([]);
      }
      
      // Fetch recent transactions
      try {
        const encodedUrl = encodeURIComponent(`${apiUrl}/extended/v1/tx?limit=10`);
        const txResponse = await fetch(`${origin}/api/blockchain-data?url=${encodedUrl}`);
        
        if (!txResponse.ok) {
          throw new Error(`Failed to fetch Stacks transactions: ${txResponse.statusText}`);
        }
        
        const txData = await txResponse.json();
        
        if (txData && txData.results && Array.isArray(txData.results)) {
          setRecentTransactions(txData.results);
        } else {
          console.error('Invalid transactions data format:', txData);
          throw new Error('Invalid transactions data format from API');
        }
      } catch (txError) {
        console.error('Error fetching Stacks transactions:', txError);
        setRecentTransactions([]);
      }
      
      // Fetch mempool info and fee estimate
      let mempoolCount = 0;
      let feeEstimate = '0';
      
      try {
        const mempoolUrl = encodeURIComponent(`${apiUrl}/extended/v1/tx/mempool`);
        const mempoolResponse = await fetch(`${origin}/api/blockchain-data?url=${mempoolUrl}`);
        
        if (mempoolResponse.ok) {
          const mempoolData = await mempoolResponse.json();
          mempoolCount = mempoolData.total || 0;
        }
        
        const feeUrl = encodeURIComponent(`${apiUrl}/v2/fees/transfer`);
        const feeResponse = await fetch(`${origin}/api/blockchain-data?url=${feeUrl}`);
        
        if (feeResponse.ok) {
          const feeData = await feeResponse.json();
          feeEstimate = feeData.estimated_cost_scalar?.toString() || '0';
        }
      } catch (statsError) {
        console.error('Error fetching Stacks stats:', statsError);
        // Use default values
      }
      
      // Update network stats with available data
      setNetworkStats({
        latestBlock: latestBlocks.length > 0 ? latestBlocks[0]?.height || 0 : 0,
        avgFeeRate: feeEstimate,
        pendingTxns: mempoolCount
      });
      
    } catch (error) {
      console.error('Error fetching Stacks data:', error);
      // Fix: Ensure error is converted to string
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingChainData(false);
      setIsRefreshing(false);
    }
  };

  // Fetch blockchain data based on active network
  const fetchBlockchainData = async () => {
    if (activeNetwork === 'bitcoin') {
      if (activeSubNetwork === 'mainnet') {
        await fetchBitcoinData();
      } else {
        await fetchBitcoinTestnetData();
      }
    } else if (activeNetwork === 'stacks') {
      await fetchStacksData();
    }
  };

  // Set up polling for updates
  useEffect(() => {
    // Initial fetch
    fetchBlockchainData();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchBlockchainData, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [activeNetwork, activeSubNetwork]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle network change
  const handleNetworkChange = (network: string, subNetwork: string) => {
    setActiveNetwork(network);
    setActiveSubNetwork(subNetwork);
    
    // Reset UI state when changing networks
    setShowSbtcAnalytics(false);
    setShowDeFiDashboard(false);
    setShowMetaprotocols(false);
    setShowBIP300Dashboard(network === 'sidechain');
  };

  // Add this useEffect to handle sidechain selection
  useEffect(() => {
    if (activeNetwork === 'sidechain') {
      // Show sidechain explorer when sidechain network is selected
      setShowMetaprotocols(false);
      setShowSbtcAnalytics(false);
      setShowDeFiDashboard(false);
      setShowBIP300Dashboard(true);
    } else {
      // Hide sidechain explorer when other networks are selected
      setShowBIP300Dashboard(false);
    }
  }, [activeNetwork]);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if input is a transaction hash, address, or a question
    const inputValue = input.trim();
    
    // Simple validation for Bitcoin and Stacks transactions/addresses
    const isBitcoinTx = /^[0-9a-f]{64}$/i.test(inputValue);
    const isStacksTx = (inputValue.startsWith('0x') && inputValue.length === 66) || 
                       (!inputValue.startsWith('0x') && /^[0-9a-f]{64}$/i.test(inputValue));
    const isBitcoinAddress = validateBitcoinAddress(inputValue);
    const isStacksAddress = validateStacksAddress(inputValue);
    
    // Update network based on detected input type
    if (isStacksTx || isStacksAddress) {
      // If we detect a Stacks transaction or address, switch to Stacks network
      if (activeNetwork !== 'stacks') {
        setActiveNetwork('stacks');
      }
    } else if (isBitcoinTx || isBitcoinAddress) {
      // If we detect a Bitcoin transaction or address, switch to Bitcoin network
      if (activeNetwork !== 'bitcoin') {
        setActiveNetwork('bitcoin');
      }
    }
    
    if (isBitcoinTx || isStacksTx) {
      setIsSearchMode(true);
      
      // If it's a Stacks tx but missing 0x prefix, add it
      if (isStacksTx && !inputValue.startsWith('0x') && activeNetwork === 'stacks') {
        setSelectedTxHash(`0x${inputValue}`);
      } else {
        setSelectedTxHash(inputValue);
      }
      
      setSelectedAddress(null);
      setCurrentMessage(null);
      setMermaidChart(null);
      setShowSbtcAnalytics(false);
      setShowDeFiDashboard(false);
      setShowMetaprotocols(false);
    } else if (isBitcoinAddress || isStacksAddress) {
      setIsSearchMode(true);
      setSelectedAddress(inputValue);
      setSelectedTxHash(null);
      setCurrentMessage(null);
      setMermaidChart(null);
      
      // Show sBTC Analytics automatically for addresses, especially for Stacks addresses
      setShowSbtcAnalytics(true);
      setShowDeFiDashboard(isStacksAddress);
      
      // For Bitcoin addresses, also show metaprotocols explorer
      if (isBitcoinAddress) {
        setShowMetaprotocols(true);
      } else {
        setShowMetaprotocols(false);
      }
    } else {
      // Treat as a general question
      setIsSearchMode(true);
      setSelectedTxHash(null);
      setSelectedAddress(null);
      setCurrentMessage(null);
      setMermaidChart(null);
      setShowSbtcAnalytics(false);
      setShowDeFiDashboard(false);
      setShowMetaprotocols(false);
    }
    
    chatHandleSubmit(e);
  };

  // Handle search for a specific hash
  const handleSearch = (hash: string) => {
    console.log('handleSearch called with hash:', hash);
    
    // First set the input value
    setInput(hash);
    
    // Then update other state
    setIsSearchMode(true);
    
    // Determine if this is a transaction or address
    const isBitcoinTx = /^[0-9a-f]{64}$/i.test(hash);
    const isStacksTx = (hash.startsWith('0x') && hash.length === 66) || 
                      (!hash.startsWith('0x') && /^[0-9a-f]{64}$/i.test(hash));
    const isBitcoinAddress = validateBitcoinAddress(hash);
    const isStacksAddress = validateStacksAddress(hash);
    
    if (isBitcoinTx || isStacksTx) {
      setSelectedTxHash(hash);
      setSelectedAddress(null);
      setShowSbtcAnalytics(false);
      setShowMetaprotocols(false);
    } else if (isBitcoinAddress || isStacksAddress) {
      setSelectedAddress(hash);
      setSelectedTxHash(null);
      setShowSbtcAnalytics(true);
      setShowDeFiDashboard(isStacksAddress);
      
      // For Bitcoin addresses, also show metaprotocols explorer
      if (isBitcoinAddress) {
        setShowMetaprotocols(true);
      } else {
        setShowMetaprotocols(false);
      }
    }
    
    setCurrentMessage(null);
    setMermaidChart(null);

    // Use requestAnimationFrame to ensure input value is set before submitting
    requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    });
  };

  // Handle going back to explorer view
  const handleBackToExplorer = () => {
    setIsSearchMode(false);
    setSelectedTxHash(null);
    setSelectedAddress(null);
    setCurrentMessage(null);
    setMermaidChart(null);
    setShowSbtcAnalytics(false);
    setShowDeFiDashboard(false);
    setShowMetaprotocols(false);
    setShowBIP300Dashboard(false);
    setIsSidechainTransaction(false);
    setSidechainType('');
    setShowSidechainAnalyzer(false);
    setIsBlock(false);
    setSidechainTransactionType('transaction');
  };

  // Handle reload button click
  const handleReload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    reload();
  };
  
  // Handle block click
  const handleBlockClick = (block: any) => {
    // Determine which hash property to use based on the format of the block
    const blockHash = block.id || block.hash;
    
    if (blockHash) {
      // Use the block hash as input for search
      handleSearch(blockHash);
    } else {
      console.error('No hash found for block:', block);
    }
  };
  
  // Toggle sBTC Analytics panel
  const toggleSbtcAnalytics = () => {
    setShowSbtcAnalytics(!showSbtcAnalytics);
  };
  
  // Toggle DeFi Dashboard panel
  const toggleDeFiDashboard = () => {
    setShowDeFiDashboard(!showDeFiDashboard);
  };
  
  // Toggle Metaprotocols Explorer panel
  const toggleMetaprotocols = () => {
    setShowMetaprotocols(!showMetaprotocols);
  };

  // Add a toggle function for BIP300 Dashboard
  const toggleBIP300Dashboard = () => {
    setShowBIP300Dashboard(!showBIP300Dashboard);
  };

  // Dismiss info message
  const dismissInfoMessage = () => {
    setInfoMessage(null);
  };
  
  // Render transaction item based on network type
  const renderTransactionItem = (tx: any, index: number) => {
    if (activeNetwork === 'bitcoin') {
      // Handle Mempool.space API transaction format
      // txid is the main identifier in Mempool.space API
      const txId = tx.txid || tx.hash;
      
      if (!txId) {
        console.error('Transaction is missing identifier:', tx);
        return null;
      }
      
      // Calculate value and format based on available data
      let value = '0';
      let fee = '0';
      
      if (tx.value) {
        // Value is sometimes provided directly
        value = (tx.value / 100000000).toFixed(8);
      } else if (tx.vout) {
        // Sum vout values for total transaction value
        value = (tx.vout.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000).toFixed(8);
      } else if (tx.out) {
        // Alternative format
        value = (tx.out.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000).toFixed(8);
      }
      
      // Calculate fee if available
      if (tx.fee !== undefined) {
        fee = (tx.fee / 100000000).toFixed(8);
      }
      
      // Determine from address
      let fromAddress = 'Unknown';
      if (tx.vin && tx.vin.length > 0) {
        fromAddress = tx.vin.length > 1 ? 'Multiple Inputs' : (tx.vin[0].prevout?.scriptpubkey_address || 'Unknown');
      } else if (tx.inputs && tx.inputs.length > 0) {
        fromAddress = tx.inputs.length > 1 ? 'Multiple Inputs' : (tx.inputs[0].prev_out?.addr || 'Unknown');
      }
      
      return (
        <div 
          key={txId || index}
          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
          onClick={() => handleSearch(txId)}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 mr-3 flex-shrink-0">
            <Hash className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{formatAddress(txId)}</div>
            <div className="text-sm text-gray-500 truncate">
              From: {formatAddress(fromAddress)}
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="font-medium text-gray-900">
              {value} BTC
            </div>
            <div className="text-sm text-gray-500">
              Fee: {fee} BTC
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      );
    } else if (activeNetwork === 'stacks') {
      // Check if tx has the necessary fields
      if (!tx || (!tx.tx_id && !tx.txid)) {
        console.error('Invalid Stacks transaction data:', tx);
        return null;
      }
      
      // Handle Stacks transaction format
      const txId = tx.tx_id || tx.txid;
      
      // Calculate display value based on transaction type
      let displayValue = '0';
      let displayAddress = 'Unknown';
      
      if (tx.tx_type === 'token_transfer' && tx.token_transfer) {
        // For token transfers, divide by 1,000,000 (Stacks uses 6 decimal places)
        const amount = parseInt(tx.token_transfer.amount || '0');
        if (!isNaN(amount)) {
          displayValue = (amount / 1000000).toFixed(6);
        }
        displayAddress = tx.token_transfer.recipient_address || 'Unknown';
      } else if (tx.tx_type === 'contract_call' && tx.contract_call) {
        displayValue = '0';
        displayAddress = tx.contract_call.contract_id || 'Unknown';
      } else if (tx.tx_type === 'smart_contract' && tx.smart_contract) {
        displayValue = '0';
        displayAddress = tx.smart_contract.contract_id || 'Unknown';
      }
      
      // Format fee if available 
      let fee = '0';
      if (tx.fee_rate) {
        const feeRate = parseInt(tx.fee_rate || '0');
        if (!isNaN(feeRate)) {
          fee = (feeRate / 1000000).toFixed(6);
        }
      }
      
      return (
        <div 
          key={txId || index}
          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
          onClick={() => handleSearch(txId)}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-100 mr-3 flex-shrink-0">
            <Hash className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{formatAddress(txId)}</div>
            <div className="text-sm text-gray-500 truncate">
              From: {formatAddress(tx.sender_address || 'Unknown')}
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="font-medium text-gray-900">
              {displayValue} STX
            </div>
            <div className="text-sm text-gray-500">
              Fee: {fee} STX
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      );
    }
    
    return null;
  };

  // Render block item based on network type
  const renderBlockItem = (block: any, index: number) => {
    if (activeNetwork === 'bitcoin') {
      // Mempool.space block format
      // Ensure we have required fields
      // Mempool.space block format
      // Ensure we have required fields
      if (!block) {
        console.error('Missing block data for rendering');
        return null;
      }
      
      const blockHeight = block.height;
      const blockHash = block.id || block.hash;
      const txCount = block.tx_count || block.n_tx || 0;
      const timestamp = block.timestamp || block.time * 1000; // Mempool.space uses seconds
      
      if (!blockHeight || !blockHash) {
        console.error('Bitcoin block is missing required data:', block);
        return null;
      }
      
      return (
        <div 
          key={blockHash || index}
          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
          onClick={() => handleBlockClick(block)}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 mr-3 flex-shrink-0">
            <Layers className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">Block #{blockHeight}</div>
            <div className="text-sm text-gray-500 flex items-center gap-x-4">
              <span>{txCount} transactions</span>
              <span className="text-xs text-gray-400">
                {timestamp ? new Date(timestamp).toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      );
    } else if (activeNetwork === 'stacks') {
      // Stacks block format
      // Check if block data is valid
      if (!block) {
        console.warn('Missing Stacks block data for rendering');
        return null;
      }
      
      // Safely extract required fields with fallbacks
      const blockHeight = block.height;
      const blockHash = block.hash;
      const txCount = block.tx_count || 0;
      
      // Extra safety check for required fields
      if (blockHeight === undefined || blockHash === undefined) {
        // Instead of error, just skip rendering this block
        console.warn('Skipping Stacks block with missing data:', block);
        return null;
      }
      
      // Handle different timestamp formats from Stacks API
      let timestamp;
      if (block.burn_block_time) {
        // Convert from Unix timestamp (seconds) to milliseconds
        timestamp = block.burn_block_time * 1000;
      } else if (block.burn_block_time_iso) {
        // Parse ISO timestamp
        timestamp = new Date(block.burn_block_time_iso).getTime();
      }
      
      return (
        <div 
          key={blockHash || index}
          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
          onClick={() => handleBlockClick(block)}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-100 mr-3 flex-shrink-0">
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">Block #{blockHeight}</div>
            <div className="text-sm text-gray-500 flex items-center gap-x-4">
              <span>{txCount} transactions</span>
              <span className="text-xs text-gray-400">
                {timestamp ? new Date(timestamp).toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      );
    }
    
    return null;
  };

  // Handle selecting a sidechain transaction for analysis
  const handleSidechainTransaction = async (txHash: string, network: string) => {
    try {
      // Extract the sidechain type from the network string
      // network format is 'sidechain-thunder', 'sidechain-zside', etc.
      const sidechainType = network.split('-')[1];
      
      if (!sidechainType) {
        console.error('Invalid sidechain network format:', network);
        return;
      }
      
      // Set UI state for analysis
      setIsSearchMode(true);
      setSelectedTxHash(txHash);
      setSelectedAddress(null);
      setCurrentMessage(null);
      setMermaidChart(null);
      setShowSbtcAnalytics(false);
      setShowDeFiDashboard(false);
      setShowMetaprotocols(false);
      setShowBIP300Dashboard(false);
      
      // Special handling for the input field to trigger AI analysis
      setInput(`Analyze this ${sidechainType} sidechain transaction in detail: ${txHash}`);
      
      // Use requestAnimationFrame to ensure input value is set before submitting
      requestAnimationFrame(() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      });
    } catch (error) {
      console.error('Error handling sidechain transaction:', error);
      setError(error instanceof Error ? error.message : 'An error occurred analyzing the sidechain transaction');
    }
  };

  // Handle selecting a sidechain block for analysis
  const handleSidechainBlock = async (blockHash: string, network: string) => {
    try {
      // Extract the sidechain type from the network string
      const sidechainType = network.split('-')[1];
      
      if (!sidechainType) {
        console.error('Invalid sidechain network format:', network);
        return;
      }
      
      // Set UI state for analysis
      setIsSearchMode(true);
      setSelectedTxHash(blockHash); // Use the txHash field to store block hash
      setSelectedAddress(null);
      setCurrentMessage(null);
      setMermaidChart(null);
      setShowSbtcAnalytics(false);
      setShowDeFiDashboard(false);
      setShowMetaprotocols(false);
      setShowBIP300Dashboard(false);
      
      // Special handling for the input field to trigger AI analysis
      setInput(`Analyze this ${sidechainType} sidechain block in detail: ${blockHash}`);
      
      // Use requestAnimationFrame to ensure input value is set before submitting
      requestAnimationFrame(() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      });
    } catch (error) {
      console.error('Error handling sidechain block:', error);
      setError(error instanceof Error ? error.message : 'An error occurred analyzing the sidechain block');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bitcoin-gradient rounded-xl">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BitcoinInsightAI</h1>
                <p className="text-sm text-gray-500">AI-powered Bitcoin and sBTC transaction explorer</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NetworkSelector 
                activeNetwork={activeNetwork}
                activeSubNetwork={activeSubNetwork}
                onChange={handleNetworkChange}
              />
              {!isSearchMode && (
                <button 
                  onClick={fetchBlockchainData}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={activeNetwork === 'bitcoin' 
                ? "Search by Bitcoin transaction hash, address, or ask a question..." 
                : "Search by Stacks transaction hash, address, or ask a question..."}
              disabled={isLoading}
              className="w-full pl-12 pr-44 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              {isSearchMode && (
                <button
                  type="button"
                  onClick={handleBackToExplorer}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Back to Explorer
                </button>
              )}
              <button 
                type="submit" 
                disabled={isLoading || !input}
                className={`px-6 py-2 ${activeNetwork === 'bitcoin' 
                  ? 'bitcoin-gradient' 
                  : 'stacks-gradient'} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
          {(chatError || error) && (
            <div className="mt-4 flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{typeof chatError === 'object' ? (chatError instanceof Error ? chatError.message : JSON.stringify(chatError)) : chatError || error}</span>
              </div>
              <button 
                onClick={handleReload}
                className="px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-2 border border-red-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isSearchMode && selectedAddress && (
        <div className="bg-white border-b py-2">
          <div className="container mx-auto flex items-center gap-4 flex-wrap px-4">
            <button
              onClick={toggleSbtcAnalytics}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                showSbtcAnalytics 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Bitcoin className="w-4 h-4" />
              <span>sBTC Analytics</span>
            </button>
            {activeNetwork === 'stacks' && (
              <button
                onClick={toggleDeFiDashboard}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  showDeFiDashboard 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>DeFi Dashboard</span>
              </button>
            )}
            {activeNetwork === 'bitcoin' && (
              <button
                onClick={toggleMetaprotocols}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  showMetaprotocols 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <CircleDollarSign className="w-4 h-4 mr-1" />
                <span>Metaprotocols</span>
              </button>
            )}
            {activeNetwork === 'sidechain' && (
              <button
                onClick={toggleBIP300Dashboard}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  showBIP300Dashboard 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>BIP300 Dashboard</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Info Message */}
      {infoMessage && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-blue-700">{infoMessage}</span>
            </div>
            <button 
              onClick={dismissInfoMessage}
              className="text-blue-500 hover:text-blue-700"
            >
              <span className="sr-only">Dismiss</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
  
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {isSearchMode ? (
          // Analysis Section
          <div id="analysis-section" className="space-y-8">
            {/* Transaction Analysis */}
            {(selectedTxHash || (!selectedAddress && input)) && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedTxHash ? `Analysis for ${formatAddress(selectedTxHash)}` : 'AI Analysis'}
                </h2>
                
                {/* Add the BIP300TransactionAnalyzer component */}
                {showSidechainAnalyzer && (
                  <div className="mb-8">
                    {isBlock ? (
                      <SidechainBlockAnalyzer 
                        blockHash={selectedTxHash || ''} 
                        sidechainType={sidechainType}
                      />
                    ) : (
                      <BIP300TransactionAnalyzer 
                        txHash={selectedTxHash || ''} 
                        sidechainType={sidechainType}
                      />
                    )}
                  </div>
                )}
                
                <div className="space-y-6">
                  {mermaidChart && (
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
                  <div className="prose max-w-none">
                    {currentMessage && (
                      <div dangerouslySetInnerHTML={{ 
                        __html: formatAssistantMessage(currentMessage)
                      }} />
                    )}
                  </div>
                </div>
                {isLoading && (
                  <div className="mt-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-gray-600">Analyzing transaction...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Metaprotocols Explorer */}
            {selectedAddress && showMetaprotocols && activeNetwork === 'bitcoin' && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-amber-500" />
                    <span>Metaprotocols Explorer</span>
                  </h2>
                  <div className="text-sm text-gray-500">Powered by Rebar Labs</div>
                </div>
                
                {/* Metaprotocols Tabs */}
                <div className="bg-gray-50 rounded-lg p-1 flex mb-6">
                  <button
                    onClick={() => setActiveMetaprotocolTab('runes')}
                    className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${
                      activeMetaprotocolTab === 'runes' 
                        ? 'bg-white shadow text-amber-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Bitcoin className="w-4 h-4" />
                    <span>Runes</span>
                  </button>
                  <button
                    onClick={() => setActiveMetaprotocolTab('ordinals')}
                    className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${
                      activeMetaprotocolTab === 'ordinals' 
                        ? 'bg-white shadow text-indigo-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Ordinals</span>
                  </button>
                  <button
                    onClick={() => setActiveMetaprotocolTab('brc20')}
                    className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${
                      activeMetaprotocolTab === 'brc20' 
                        ? 'bg-white shadow text-amber-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <CircleDollarSign className="w-4 h-4" />
                    <span>BRC-20</span>
                  </button>
                </div>
                
                {/* Selected Tab Content */}
                <div className="mt-4">
                  {activeMetaprotocolTab === 'runes' && (
                    <div className="address-runes">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Runes Balances for {formatAddress(selectedAddress || '')}</h3>
                      <RunesExplorer />
                    </div>
                  )}
                  
                  {activeMetaprotocolTab === 'ordinals' && (
                    <div className="address-ordinals">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Ordinals Inscriptions for {formatAddress(selectedAddress || '')}</h3>
                      <OrdinalsExplorer />
                    </div>
                  )}
                  
                  {activeMetaprotocolTab === 'brc20' && (
                    <div className="address-brc20">
                      <h3 className="text-base font-medium text-gray-900 mb-4">BRC-20 Tokens for {formatAddress(selectedAddress || '')}</h3>
                      <Brc20Explorer />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* sBTC Analytics */}
            {selectedAddress && showSbtcAnalytics && (
              <SbtcAnalyticsTab 
                address={selectedAddress} 
                network={activeSubNetwork as 'mainnet' | 'testnet'} 
                txId={selectedTxHash || undefined}
              />
            )}
            
            {/* DeFi Dashboard */}
            {selectedAddress && activeNetwork === 'stacks' && showDeFiDashboard && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">DeFi Dashboard</h3>
                <p className="text-gray-500">
                  DeFi dashboard functionality is currently being updated. Please check back soon.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Explorer View with new professional dashboard
          <>
            {activeNetwork === 'sidechain' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Network className="w-5 h-5 text-blue-500" />
                      <span>Bitcoin BIP300 Sidechains</span>
                    </h2>
                    <div className="text-sm text-gray-500">Powered by Layer Two Labs</div>
                  </div>
                  <div className="p-6">
                    <SidechainExplorer 
                      initialSidechain={activeSubNetwork}
                      onSelectTransaction={handleSidechainTransaction}
                      onSelectBlock={handleSidechainBlock}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <DashboardTabs 
                latestBlocks={latestBlocks}
                recentTransactions={recentTransactions}
                isLoadingChainData={isLoadingChainData}
                isRefreshing={isRefreshing}
                handleBlockClick={handleBlockClick}
                handleSearch={handleSearch}
                renderBlockItem={renderBlockItem}
                renderTransactionItem={renderTransactionItem}
                fetchBlockchainData={fetchBlockchainData}
                activeNetwork={activeNetwork}
                networkStats={networkStats}
              />
            )}
          </>
        )}
      </div>
  
      {/* Add the modal component */}
      <DiagramModal
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
        chart={mermaidChart || ''}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default BitcoinExplorer;
