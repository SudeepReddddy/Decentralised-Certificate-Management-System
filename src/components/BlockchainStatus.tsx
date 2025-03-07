import React, { useEffect, useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { initWeb3, getCurrentAccount, isWeb3Initialized, isMetaMaskInstalled } from '../lib/blockchain';

const BlockchainStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    setHasMetaMask(isMetaMaskInstalled());
    
    const connectToBlockchain = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const initialized = await initWeb3();
        setIsConnected(initialized);
        
        if (initialized) {
          const currentAccount = await getCurrentAccount();
          setAccount(currentAccount);
          setIsReadOnly(!currentAccount);
        }
      } catch (err: any) {
        console.error('Error connecting to blockchain:', err);
        setError(err.message || 'Failed to connect to blockchain');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    connectToBlockchain();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
        setIsConnected(accounts.length > 0);
        setIsReadOnly(accounts.length === 0);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setIsLoading(true);
      setError(null);
      
      const initialized = await initWeb3();
      setIsConnected(initialized);
      
      if (initialized) {
        const currentAccount = await getCurrentAccount();
        setAccount(currentAccount);
        setIsReadOnly(!currentAccount);
      }
    } catch (err: any) {
      console.error('Error connecting to blockchain:', err);
      setError(err.message || 'Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className={`h-6 w-6 ${isConnected ? (isReadOnly ? 'text-yellow-500' : 'text-green-600') : 'text-gray-400'} mr-3`} />
          <div>
            <h3 className="font-medium">Blockchain Status</h3>
            {isLoading ? (
              <p className="text-sm text-gray-500 flex items-center">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Connecting to blockchain...
              </p>
            ) : isConnected ? (
              <div>
                {isReadOnly ? (
                  <p className="text-sm text-yellow-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Connected in read-only mode
                  </p>
                ) : (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connected to Ethereum
                  </p>
                )}
                {account && (
                  <p className="text-xs text-gray-500 mt-1">
                    Account: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </p>
                )}
                {isReadOnly && hasMetaMask && (
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Connect Wallet" to use MetaMask for issuing certificates
                  </p>
                )}
                {isReadOnly && !hasMetaMask && (
                  <p className="text-xs text-gray-500 mt-1">
                    Install MetaMask to issue certificates on the blockchain
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Not connected
              </p>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        
        {(!isConnected || isReadOnly) && !isLoading && (
          <div>
            {hasMetaMask ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin h-3 w-3 mr-1" />
                    Connecting...
                  </span>
                ) : (
                  isReadOnly ? "Connect Wallet" : "Connect"
                )}
              </button>
            ) : (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                Install MetaMask <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainStatus;