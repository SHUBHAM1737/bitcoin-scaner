'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  LinkIcon, 
  AlertCircle, 
  Check, 
  LogOut, 
  ChevronRight,
  ExternalLink, 
  Copy
} from 'lucide-react';
import { formatAddress } from '@/app/utils/formatUtils';
import { showConnect, UserSession } from '@stacks/connect-react';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// Types for wallet connection
interface WalletInfo {
  address: string;
  publicKey?: string;
  network: 'mainnet' | 'testnet';
  userData?: any;
}

interface WalletConnectorProps {
  onConnect: (walletInfo: WalletInfo) => void;
  onDisconnect: () => void;
  network?: 'mainnet' | 'testnet';
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ 
  onConnect, 
  onDisconnect, 
  network = 'mainnet' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Initialize the UserSession
  useEffect(() => {
    const appConfig = {
      appName: 'BitcoinInsightAI',
      appIconUrl: 'https://bitcoin-insight-ai.vercel.app/logo.png',
      redirectTo: '/',
      network: network === 'mainnet' ? new StacksMainnet() : new StacksTestnet(),
    };
    
    const session = new UserSession({ appConfig });
    setUserSession(session);

    // Check if user is already signed in
    if (session.isUserSignedIn()) {
      try {
        const userData = session.loadUserData();
        const walletInfo: WalletInfo = {
          address: userData.profile.stxAddress[network],
          network,
          userData
        };
        setConnectedWallet(walletInfo);
        onConnect(walletInfo);
      } catch (err) {
        console.error('Error loading user data:', err);
        session.signUserOut();
      }
    }
  }, [network, onConnect]);

  // Handle wallet connection
  const connectWallet = useCallback(() => {
    if (!userSession) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      showConnect({
        userSession,
        appDetails: {
          name: 'BitcoinInsightAI',
          icon: 'https://bitcoin-insight-ai.vercel.app/logo.png',
        },
        onFinish: () => {
          setIsConnecting(false);
          setIsOpen(false);
          
          const userData = userSession.loadUserData();
          const walletInfo: WalletInfo = {
            address: userData.profile.stxAddress[network],
            network,
            userData
          };
          
          setConnectedWallet(walletInfo);
          onConnect(walletInfo);
        },
        onCancel: () => {
          setIsConnecting(false);
          setError('Wallet connection cancelled');
        },
        redirectTo: '/'
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
      setIsConnecting(false);
    }
  }, [userSession, network, onConnect]);

  // Handle wallet disconnection
  const disconnectWallet = useCallback(() => {
    if (!userSession) return;
    
    userSession.signUserOut();
    setConnectedWallet(null);
    onDisconnect();
    setIsOpen(false);
  }, [userSession, onDisconnect]);

  // Handle address copy
  const copyAddress = useCallback(() => {
    if (!connectedWallet) return;
    
    navigator.clipboard.writeText(connectedWallet.address);
    setCopiedAddress(true);
    
    setTimeout(() => {
      setCopiedAddress(false);
    }, 2000);
  }, [connectedWallet]);

  return (
    <div className="relative">
      {/* Wallet button */}
      {connectedWallet ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Wallet className="w-5 h-5 text-amber-500 mr-2" />
          <span className="text-sm font-medium">{formatAddress(connectedWallet.address)}</span>
          <ChevronRight className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <LinkIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Connect Wallet</span>
        </button>
      )}
      
      {/* Wallet modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md z-10">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {connectedWallet ? 'Wallet Connected' : 'Connect Wallet'}
              </h3>
            </div>
            
            {connectedWallet ? (
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-500 mb-1">Connected Address</div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 font-medium break-all">
                      {connectedWallet.address}
                    </div>
                    <button 
                      onClick={copyAddress}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-500 mb-1">Network</div>
                  <div className="text-gray-900 font-medium capitalize">
                    {connectedWallet.network}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <a 
                    href={`https://explorer.stacks.co/address/${connectedWallet.address}?chain=${connectedWallet.network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                  
                  <button
                    onClick={disconnectWallet}
                    className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
                
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Connect your Stacks wallet to perform sBTC operations:
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      View your sBTC balance
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Deposit BTC to get sBTC
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Withdraw sBTC back to BTC
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Transfer sBTC to other addresses
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={connectWallet}
                  disabled={isConnecting || !userSession}
                  className="w-full flex items-center justify-center p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      <span>Connect with Stacks Wallet</span>
                    </>
                  )}
                </button>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <span>Don't have a wallet? </span>
                  <a 
                    href="https://www.stacks.co/explore/find-a-wallet" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 inline-flex items-center"
                  >
                    <span>Get a Stacks wallet</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;