'use client';
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  AlertCircle, 
  Bitcoin, 
  CircleDollarSign, 
  HelpCircle,
  Wallet,
  Loader2,
  Check,
  X,
  Info,
  ExternalLink,
  Clock
} from 'lucide-react';
import { STACKS_NETWORKS, BITCOIN_NETWORKS } from '@/app/config/blockchain';
import { validateBitcoinAddress, validateStacksAddress } from '@/app/utils/addressValidator';
import { formatAddress } from '@/app/utils/formatUtils';
import { UserSession } from '@stacks/connect-react';
import { SbtcService, SbtcOperationResult } from '@/app/services/sbtcService';

interface WalletInfo {
  address: string;
  network: 'mainnet' | 'testnet';
  userData?: any;
}

interface SbtcOperationFormsProps {
  walletInfo?: WalletInfo;
  onOperationStart?: (type: string, params: any) => void;
  onOperationComplete?: (txId: string) => void;
}

const SbtcOperationForms: React.FC<SbtcOperationFormsProps> = ({ 
  walletInfo, 
  onOperationStart,
  onOperationComplete
}) => {
  const [activeOperation, setActiveOperation] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeEstimate, setFeeEstimate] = useState<null | {
    stxFee: string;
    btcFee?: string;
    estimatedTime: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    txId?: string;
  } | null>(null);
  const [sbtcBalance, setSbtcBalance] = useState<string>('0');
  const [btcPrice, setBtcPrice] = useState<number>(55000); // Default BTC price
  
  // Form values
  const [depositForm, setDepositForm] = useState({
    amount: '',
    btcAddress: '',
    btcTxid: '', // For demo purposes, we'll include this field
    btcVout: '0' // For demo purposes
  });
  
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    btcAddress: '',
  });
  
  const [transferForm, setTransferForm] = useState({
    amount: '',
    recipient: '',
    memo: '',
  });
  
  // Validation state
  const [depositFormErrors, setDepositFormErrors] = useState({
    amount: '',
    btcAddress: '',
    btcTxid: ''
  });
  
  const [withdrawFormErrors, setWithdrawFormErrors] = useState({
    amount: '',
    btcAddress: '',
  });
  
  const [transferFormErrors, setTransferFormErrors] = useState({
    amount: '',
    recipient: '',
  });
  
  // Maximum amount that can be deposited or withdrawn
  const [maxAmount, setMaxAmount] = useState({
    deposit: '1.0',
    withdraw: '0.0',
  });

  // sBTC service
  const [sbtcService, setSbtcService] = useState<SbtcService | null>(null);
  
  // Initialize sBTC service and fetch balance
  useEffect(() => {
    if (!walletInfo) return;
    
    const userSession = new UserSession({
      appConfig: {
        appName: 'BitcoinInsightAI',
        appIconUrl: 'https://bitcoin-insight-ai.vercel.app/logo.png',
        redirectTo: '/',
      }
    });
    
    const service = new SbtcService(userSession, walletInfo.network);
    setSbtcService(service);
    
    const fetchBalance = async () => {
      try {
        const balanceInfo = await service.getBalance(walletInfo.address);
        setSbtcBalance(balanceInfo.balance);
        
        setMaxAmount(prev => ({
          ...prev,
          withdraw: balanceInfo.balance
        }));
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    
    const fetchBtcPrice = async () => {
      try {
        const priceResponse = await fetch('/api/blockchain-data?url=' + 
          encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'));
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          if (priceData.bitcoin?.usd) {
            setBtcPrice(priceData.bitcoin.usd);
          }
        }
      } catch (priceError) {
        console.error('Error fetching BTC price:', priceError);
      }
    };
    
    fetchBalance();
    fetchBtcPrice();
  }, [walletInfo]);
  
  // Validate deposit form
  const validateDepositForm = () => {
    const errors = {
      amount: '',
      btcAddress: '',
      btcTxid: ''
    };
    
    // Validate amount
    if (!depositForm.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(depositForm.amount)) || parseFloat(depositForm.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    } else if (parseFloat(depositForm.amount) > parseFloat(maxAmount.deposit)) {
      errors.amount = `Amount cannot exceed ${maxAmount.deposit} BTC`;
    }
    
    // Validate BTC address
    if (!depositForm.btcAddress) {
      errors.btcAddress = 'Bitcoin address is required';
    } else if (!validateBitcoinAddress(depositForm.btcAddress)) {
      errors.btcAddress = 'Invalid Bitcoin address';
    }
    
    // For demo purposes, validate txid
    if (!depositForm.btcTxid) {
      errors.btcTxid = 'Bitcoin transaction ID is required';
    } else if (!/^[0-9a-f]{64}$/i.test(depositForm.btcTxid)) {
      errors.btcTxid = 'Invalid Bitcoin transaction ID';
    }
    
    setDepositFormErrors(errors);
    return !errors.amount && !errors.btcAddress && !errors.btcTxid;
  };
  
  // Validate withdraw form
  const validateWithdrawForm = () => {
    const errors = {
      amount: '',
      btcAddress: '',
    };
    
    // Validate amount
    if (!withdrawForm.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(withdrawForm.amount)) || parseFloat(withdrawForm.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    } else if (parseFloat(withdrawForm.amount) > parseFloat(maxAmount.withdraw)) {
      errors.amount = `Amount cannot exceed ${maxAmount.withdraw} sBTC`;
    }
    
    // Validate BTC address
    if (!withdrawForm.btcAddress) {
      errors.btcAddress = 'Bitcoin address is required';
    } else if (!validateBitcoinAddress(withdrawForm.btcAddress)) {
      errors.btcAddress = 'Invalid Bitcoin address';
    }
    
    setWithdrawFormErrors(errors);
    return !errors.amount && !errors.btcAddress;
  };
  
  // Validate transfer form
  const validateTransferForm = () => {
    const errors = {
      amount: '',
      recipient: '',
    };
    
    // Validate amount
    if (!transferForm.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(transferForm.amount)) || parseFloat(transferForm.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    } else if (parseFloat(transferForm.amount) > parseFloat(maxAmount.withdraw)) {
      errors.amount = `Amount cannot exceed ${maxAmount.withdraw} sBTC`;
    }
    
    // Validate recipient
    if (!transferForm.recipient) {
      errors.recipient = 'Recipient address is required';
    } else if (!validateStacksAddress(transferForm.recipient)) {
      errors.recipient = 'Invalid Stacks address';
    }
    
    setTransferFormErrors(errors);
    return !errors.amount && !errors.recipient;
  };
  
  // Estimate fees for the selected operation
  const estimateFees = async () => {
    if (!sbtcService) return;
    
    setIsEstimating(true);
    setError(null);
    
    try {
      const feeEstimates = await sbtcService.estimateFee(activeOperation);
      setFeeEstimate(feeEstimates);
    } catch (error) {
      console.error('Error estimating fees:', error);
      setError('Failed to estimate fees. Please try again.');
    } finally {
      setIsEstimating(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbtcService || !walletInfo) return;
    
    setError(null);
    setSuccess(null);
    
    // Validate form based on active operation
    let isValid = false;
    
    if (activeOperation === 'deposit') {
      isValid = validateDepositForm();
    } else if (activeOperation === 'withdraw') {
      isValid = validateWithdrawForm();
    } else if (activeOperation === 'transfer') {
      isValid = validateTransferForm();
    }
    
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    try {
      // Notify operation start
      if (onOperationStart) {
        onOperationStart(activeOperation, {
          deposit: depositForm,
          withdraw: withdrawForm,
          transfer: transferForm,
        }[activeOperation]);
      }
      
      let result: SbtcOperationResult;
      
      // Perform the operation
      if (activeOperation === 'deposit') {
        // Convert amount to smallest units
        const amount = parseFloat(depositForm.amount) * 100000000;
        
        result = await sbtcService.depositBtc({
          btcTxid: depositForm.btcTxid,
          btcVout: parseInt(depositForm.btcVout),
          amount: BigInt(Math.round(amount)),
          senderBtcAddress: depositForm.btcAddress,
          recipientStxAddress: walletInfo.address,
        });
      } else if (activeOperation === 'withdraw') {
        // Convert amount to smallest units
        const amount = parseFloat(withdrawForm.amount) * 100000000;
        
        result = await sbtcService.withdrawSbtc({
          amount: BigInt(Math.round(amount)),
          recipientBtcAddress: withdrawForm.btcAddress,
        });
      } else { // transfer
        // Convert amount to smallest units
        const amount = parseFloat(transferForm.amount) * 100000000;
        
        result = await sbtcService.transferSbtc({
          amount: BigInt(Math.round(amount)),
          recipient: transferForm.recipient,
          memo: transferForm.memo || undefined,
        });
      }
      
      if (result.success) {
        // Set success message
        setSuccess({
          message: `sBTC ${activeOperation} operation submitted successfully!`,
          txId: result.txId,
        });
        
        // Clear form
        if (activeOperation === 'deposit') {
          setDepositForm({ amount: '', btcAddress: '', btcTxid: '', btcVout: '0' });
        } else if (activeOperation === 'withdraw') {
          setWithdrawForm({ amount: '', btcAddress: '' });
        } else if (activeOperation === 'transfer') {
          setTransferForm({ amount: '', recipient: '', memo: '' });
        }
        
        // Notify operation complete
        if (onOperationComplete && result.txId) {
          onOperationComplete(result.txId);
        }
      } else {
        setError(result.error || `Failed to ${activeOperation} sBTC. Please try again.`);
      }
    } catch (error) {
      console.error(`Error performing ${activeOperation} operation:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${activeOperation} sBTC. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset state when changing operation type
  useEffect(() => {
    setFeeEstimate(null);
    setError(null);
    setSuccess(null);
  }, [activeOperation]);
  
  if (!walletInfo) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Wallet Not Connected</h3>
        <p className="text-gray-500 mb-4">Connect your wallet to perform sBTC operations</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">sBTC Operations</h3>
        
        <div className="bg-gray-100 rounded-lg p-1 grid grid-cols-3 gap-1 mb-6">
          <button
            onClick={() => setActiveOperation('deposit')}
            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeOperation === 'deposit' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setActiveOperation('withdraw')}
            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeOperation === 'withdraw' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => setActiveOperation('transfer')}
            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeOperation === 'transfer' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Transfer</span>
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Operation explanations */}
        <div className="mb-6">
          {activeOperation === 'deposit' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">About sBTC Deposits</p>
                <p>Depositing BTC will lock your Bitcoin and mint an equivalent amount of sBTC on the Stacks blockchain. This process typically takes about 1 hour (12 Bitcoin confirmations).</p>
              </div>
            </div>
          )}
          
          {activeOperation === 'withdraw' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">About sBTC Withdrawals</p>
                <p>Withdrawing sBTC will burn your sBTC tokens and release an equivalent amount of BTC from the Stacks Bitcoin wallet. This process typically takes 1-3 hours (requires 150 Bitcoin confirmations).</p>
              </div>
            </div>
          )}
          
          {activeOperation === 'transfer' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">About sBTC Transfers</p>
                <p>Transferring sBTC moves tokens between Stacks addresses without affecting the underlying BTC. This is fast (typically a few minutes) and only requires Stacks transaction fees.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-100 rounded-lg p-4 flex items-start">
            <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium mb-1">{success.message}</p>
              {success.txId && (
                <p>
                  Transaction ID: <span className="font-mono">{formatAddress(success.txId)}</span>
                  <a 
                    href={`${STACKS_NETWORKS[walletInfo.network].explorerUrl}${success.txId}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-green-600 hover:underline inline-flex items-center"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Wallet info and balance */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Connected Wallet</div>
              <div className="font-medium">{formatAddress(walletInfo.address)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">sBTC Balance</div>
              <div className="font-medium text-amber-600">{sbtcBalance} sBTC</div>
              <div className="text-xs text-gray-500">≈ ${(parseFloat(sbtcBalance) * btcPrice).toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        {/* Deposit form */}
        {activeOperation === 'deposit' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Deposit (BTC)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Bitcoin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="depositAmount"
                  type="text"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className={`pl-10 pr-12 py-2 w-full border ${depositFormErrors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="0.001"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setDepositForm({...depositForm, amount: maxAmount.deposit})}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {depositFormErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{depositFormErrors.amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {maxAmount.deposit} BTC
              </p>
            </div>
            
            <div>
              <label htmlFor="depositBtcAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Your Bitcoin Address (for refunds)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="depositBtcAddress"
                  type="text"
                  value={depositForm.btcAddress}
                  onChange={(e) => setDepositForm({...depositForm, btcAddress: e.target.value})}
                  className={`pl-10 pr-4 py-2 w-full border ${depositFormErrors.btcAddress ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="bc1q..."
                  disabled={isSubmitting}
                />
              </div>
              {depositFormErrors.btcAddress && (
                <p className="mt-1 text-sm text-red-600">{depositFormErrors.btcAddress}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This address will be used in case the deposit needs to be refunded.
              </p>
            </div>
            
            {/* For demo purposes, add Bitcoin transaction ID field */}
            <div>
              <label htmlFor="depositBtcTxid" className="block text-sm font-medium text-gray-700 mb-1">
                Bitcoin Transaction ID (for demonstration)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="depositBtcTxid"
                  type="text"
                  value={depositForm.btcTxid}
                  onChange={(e) => setDepositForm({...depositForm, btcTxid: e.target.value})}
                  className={`pl-10 pr-4 py-2 w-full border ${depositFormErrors.btcTxid ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Bitcoin transaction hash"
                  disabled={isSubmitting}
                />
              </div>
              {depositFormErrors.btcTxid && (
                <p className="mt-1 text-sm text-red-600">{depositFormErrors.btcTxid}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                In a real application, users would not need to provide this.
              </p>
            </div>
          </div>
        )}
        
        {/* Withdraw form */}
        {activeOperation === 'withdraw' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Withdraw (sBTC)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Bitcoin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="withdrawAmount"
                  type="text"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                  className={`pl-10 pr-12 py-2 w-full border ${withdrawFormErrors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="0.001"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({...withdrawForm, amount: maxAmount.withdraw})}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {withdrawFormErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{withdrawFormErrors.amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Available: {maxAmount.withdraw} sBTC
              </p>
            </div>
            
            <div>
              <label htmlFor="withdrawBtcAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Bitcoin Withdrawal Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="withdrawBtcAddress"
                  type="text"
                  value={withdrawForm.btcAddress}
                  onChange={(e) => setWithdrawForm({...withdrawForm, btcAddress: e.target.value})}
                  className={`pl-10 pr-4 py-2 w-full border ${withdrawFormErrors.btcAddress ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="bc1q..."
                  disabled={isSubmitting}
                />
              </div>
              {withdrawFormErrors.btcAddress && (
                <p className="mt-1 text-sm text-red-600">{withdrawFormErrors.btcAddress}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The Bitcoin address where you want to receive BTC.
              </p>
            </div>
          </div>
        )}
        
        {/* Transfer form */}
        {activeOperation === 'transfer' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="transferAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Transfer (sBTC)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Bitcoin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="transferAmount"
                  type="text"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  className={`pl-10 pr-12 py-2 w-full border ${transferFormErrors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="0.001"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setTransferForm({...transferForm, amount: maxAmount.withdraw})}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {transferFormErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{transferFormErrors.amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Available: {maxAmount.withdraw} sBTC
              </p>
            </div>
            
            <div>
              <label htmlFor="transferRecipient" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Stacks Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="transferRecipient"
                  type="text"
                  value={transferForm.recipient}
                  onChange={(e) => setTransferForm({...transferForm, recipient: e.target.value})}
                  className={`pl-10 pr-4 py-2 w-full border ${transferFormErrors.recipient ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="SP..."
                  disabled={isSubmitting}
                />
              </div>
              {transferFormErrors.recipient && (
                <p className="mt-1 text-sm text-red-600">{transferFormErrors.recipient}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The Stacks address to send sBTC to.
              </p>
            </div>
            
            <div>
              <label htmlFor="transferMemo" className="block text-sm font-medium text-gray-700 mb-1">
                Memo (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="transferMemo"
                  value={transferForm.memo}
                  onChange={(e) => setTransferForm({...transferForm, memo: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add an optional message..."
                  rows={2}
                  maxLength={64}
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum 64 characters.
              </p>
            </div>
          </div>
        )}
        
        {/* Fee estimate section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Fee Estimate</h4>
            <button
              type="button"
              onClick={estimateFees}
              disabled={isEstimating || isSubmitting}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {isEstimating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  <span>Estimating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>Refresh estimate</span>
                </>
              )}
            </button>
          </div>
          
          {feeEstimate ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Stacks Fee</div>
                  <div className="font-medium">{feeEstimate.stxFee} STX</div>
                </div>
                {activeOperation !== 'transfer' && feeEstimate.btcFee && (
                  <div>
                    <div className="text-xs text-gray-500">Bitcoin Fee</div>
                    <div className="font-medium">{feeEstimate.btcFee} BTC</div>
                  </div>
                )}
                <div className="col-span-2 flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
                  <div className="text-xs text-gray-600">{feeEstimate.estimatedTime}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
              Click "Refresh estimate" to see fee details
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center px-4 py-3 ${
              activeOperation === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
              activeOperation === 'withdraw' ? 'bg-red-600 hover:bg-red-700' :
              'bg-amber-600 hover:bg-amber-700'
            } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {activeOperation === 'deposit' && <ArrowDownToLine className="w-5 h-5 mr-2" />}
                {activeOperation === 'withdraw' && <ArrowUpFromLine className="w-5 h-5 mr-2" />}
                {activeOperation === 'transfer' && <RefreshCw className="w-5 h-5 mr-2" />}
                <span className="capitalize">{activeOperation} sBTC</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SbtcOperationForms;