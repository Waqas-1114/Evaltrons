import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../utils/contract';
import { getAllStates, getDistrictsByState } from '../data/indiaData';

// Utility function to ensure Ganache Local network
const ensureGanacheNetwork = async (provider: ethers.BrowserProvider): Promise<void> => {
  try {
    const network = await provider.getNetwork();
    if (network.chainId !== 1337n) {
      console.log('Current network:', network.chainId, 'Need to switch to 1337');

      try {
        // Try to switch to Ganache Local network automatically
        await provider.send('wallet_switchEthereumChain', [
          { chainId: '0x539' } // 0x539 is hex for 1337
        ]);
        console.log('Successfully switched to Ganache Local');
      } catch (switchError: any) {
        console.log('Switch error:', switchError);

        // If the network doesn't exist, add it
        if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain ID')) {
          console.log('Adding Ganache Local network...');
          await provider.send('wallet_addEthereumChain', [
            {
              chainId: '0x539',
              chainName: 'Ganache Local',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
            },
          ]);
          console.log('Successfully added Ganache Local network');
        } else {
          console.error('Failed to switch network:', switchError);
          throw new Error(`Unable to switch to Ganache Local network: ${switchError.message || 'Unknown error'}`);
        }
      }

      // Verify we're now on the correct network
      const newNetwork = await provider.getNetwork();
      if (newNetwork.chainId !== 1337n) {
        throw new Error(`Network switch failed. Current chain ID: ${newNetwork.chainId}, expected: 1337`);
      }
    }
  } catch (error: any) {
    console.error('ensureGanacheNetwork error:', error);
    throw error;
  }
};

// Component for ID-based login
function IdLoginForm({ onAccountFound }: { onAccountFound: (walletAddress: string) => void }) {
  const [idDocument, setIdDocument] = useState('');
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [foundOwner, setFoundOwner] = useState<any>(null);

  const handleIdSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idDocument.trim()) {
      setMessage('❌ Please enter your ID document number');
      return;
    }

    setSearching(true);
    setMessage('🔍 Searching for your account...');

    try {
      // Check if we have a blockchain connection
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Use a more robust provider setup
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      // Ensure we're connected to Ganache Local network - auto-switch if needed
      await ensureGanacheNetwork(provider);

      const contract = getContract(provider);

      // Search for properties by owner ID document
      const result = await contract.searchPropertiesByOwnerIdDocument(idDocument);

      if (result[0].length === 0) {
        setMessage('❌ No account found with this ID document number. Please register as a new user.');
        setFoundOwner(null);
        return;
      }

      // Get the first owner address found
      const ownerAddress = ethers.getAddress(`0x${result[0][0].toString(16).padStart(40, '0')}`);
      const ownerDetails = await contract.getOwnerDetails(ownerAddress);

      if (ownerDetails.name) {
        setFoundOwner({
          address: ownerAddress,
          name: ownerDetails.name,
          idDocument: ownerDetails.idDocument,
          contactInfo: ownerDetails.contactInfo,
          homeState: ownerDetails.homeState,
          homeDistrict: ownerDetails.homeDistrict,
          isVerified: ownerDetails.isVerified
        });

        setMessage(`✅ Account found! Owner: ${ownerDetails.name}. Please connect your wallet with address ${ownerAddress.slice(0, 8)}...${ownerAddress.slice(-6)} to continue.`);
        onAccountFound(ownerAddress);
      } else {
        setMessage('❌ Account data could not be retrieved. Please try again.');
        setFoundOwner(null);
      }
    } catch (error: any) {
      console.error('ID search error:', error);

      let errorMessage = 'Search failed. ';

      if (error.message?.includes('MetaMask not installed')) {
        errorMessage = 'Please install MetaMask to search for accounts.';
      } else if (error.message?.includes('Chain ID')) {
        errorMessage = 'Please switch MetaMask to Ganache Local network (Chain ID: 1337).';
      } else if (error.message?.includes('circuit breaker')) {
        errorMessage = 'Connection issue. Please refresh the page and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Make sure Ganache is running and MetaMask is connected.';
      } else {
        errorMessage += 'Please check your ID document number and try again.';
      }

      setMessage(`❌ ${errorMessage}`);
      setFoundOwner(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleIdSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Government ID Document Number
          </label>
          <input
            type="text"
            value={idDocument}
            onChange={(e) => setIdDocument(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter Aadhaar, PAN, or Passport Number"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the same ID document you used during registration
          </p>
        </div>

        <button
          type="submit"
          disabled={searching}
          className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching...
            </>
          ) : (
            '🔍 Find My Account'
          )}
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅')
          ? 'bg-green-50 border border-green-200 text-green-800'
          : message.includes('❌')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
          {message}
        </div>
      )}

      {foundOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">Account Found!</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Name:</strong> {foundOwner.name}</p>
            <p><strong>Contact:</strong> {foundOwner.contactInfo}</p>
            <p><strong>Location:</strong> {foundOwner.homeDistrict}, {foundOwner.homeState}</p>
            <p><strong>Wallet Address:</strong>
              <span className="font-mono text-xs ml-1">
                {foundOwner.address}
              </span>
            </p>
            <p><strong>Status:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${foundOwner.isVerified
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {foundOwner.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Next Steps:</strong>
            </p>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Click "Connect MetaMask" button above</li>
              <li>Make sure MetaMask is set to the account: <br />
                <span className="font-mono text-xs bg-white px-1 rounded">{foundOwner.address}</span>
              </li>
              <li>If needed, switch accounts in MetaMask to match this address</li>
              <li>Once connected, you'll be automatically logged in</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterOwner() {
  const router = useRouter();
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    idDocument: '',
    contactInfo: '',
    homeState: '',
    homeDistrict: ''
  });
  const [states] = useState(getAllStates());
  const [districts, setDistricts] = useState<string[]>([]);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginIdDocument, setLoginIdDocument] = useState('');
  const [checkingUser, setCheckingUser] = useState(false);
  const [expectedWalletAddress, setExpectedWalletAddress] = useState<string>('');

  useEffect(() => {
    checkWalletConnection();

    // Monitor network changes and force back to Ganache if needed
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleNetworkChange = async (chainId: string) => {
        const chainIdDecimal = parseInt(chainId, 16);
        if (chainIdDecimal !== 1337 && isConnected) {
          try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            await ensureGanacheNetwork(provider);
            setMessage('🔄 Automatically switched back to Ganache Local network');
            setTimeout(() => setMessage(''), 3000);
          } catch (error) {
            setMessage('⚠️ Please switch back to Ganache Local network (Chain ID: 1337)');
          }
        }
      };

      // Listen for network changes
      window.ethereum.on('chainChanged', handleNetworkChange);

      // Cleanup listener on component unmount
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleNetworkChange);
        }
      };
    }
  }, [isConnected]);

  useEffect(() => {
    if (account) {
      checkExistingUser();
    }
  }, [account]);

  useEffect(() => {
    if (formData.homeState) {
      const stateDistricts = getDistrictsByState(formData.homeState);
      setDistricts(stateDistricts);
      setFormData(prev => ({ ...prev, homeDistrict: '' }));
    }
  }, [formData.homeState]);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          try {
            // Ensure we're on Ganache Local network
            await ensureGanacheNetwork(provider);
          } catch (networkError) {
            console.error('Network switching failed during connection check:', networkError);
            // Don't fail the entire connection check, just log the error
            // The user can manually switch networks later
          }

          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setLoading(true);
        setMessage('🔗 Connecting to MetaMask...');

        const provider = new ethers.BrowserProvider((window as any).ethereum);

        // Request account access
        await provider.send('eth_requestAccounts', []);

        // Verify network and auto-switch if needed
        const network = await provider.getNetwork();
        if (network.chainId !== 1337n) {
          setMessage('🔄 Switching to Ganache Local network...');
          await ensureGanacheNetwork(provider);
        }

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setIsConnected(true);
        setMessage('✅ Wallet connected successfully!');

        // Clear message after a delay
        setTimeout(() => setMessage(''), 2000);
      } catch (error: any) {
        console.error('Error connecting wallet:', error);

        let errorMessage = 'Failed to connect wallet. ';

        if (error.code === 4001 || error.message?.includes('rejected')) {
          errorMessage = 'Connection rejected by user.';
        } else if (error.message?.includes('circuit breaker')) {
          errorMessage = 'Connection issue. Please close and reopen MetaMask, then try again.';
        } else {
          errorMessage += 'Please make sure MetaMask is installed and unlocked.';
        }

        setMessage(`❌ ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this application.');
    }
  };

  const checkExistingUser = async () => {
    if (!account) return;

    setCheckingUser(true);
    try {
      console.log('Checking existing user for account:', account);

      // If user connected with an expected wallet address (from ID search), show confirmation
      if (expectedWalletAddress && account.toLowerCase() === expectedWalletAddress.toLowerCase()) {
        setMessage('✅ Correct wallet connected! You can now access your account.');
        setExpectedWalletAddress(''); // Clear the expected address
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = getContract(provider);

      console.log('Contract address:', await contract.getAddress());
      const ownerDetails = await contract.getOwnerDetails(account);
      console.log('Owner details received:', ownerDetails);

      // Check if the owner details indicate a registered user
      // The contract returns default values if user is not registered
      if (ownerDetails && ownerDetails.name && ownerDetails.name.trim() !== '' && ownerDetails.name !== '0x0000000000000000000000000000000000000000') {
        // User is already registered
        console.log('User is already registered');
        setIsExistingUser(true);
        setExistingUserData({
          name: ownerDetails.name,
          idDocument: ownerDetails.idDocument,
          contactInfo: ownerDetails.contactInfo,
          homeState: ownerDetails.homeState,
          homeDistrict: ownerDetails.homeDistrict,
          isVerified: ownerDetails.isVerified
        });

        // Auto-redirect to dashboard after 2 seconds
        setMessage('✅ Welcome back! You are already registered. Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // User is not registered
        console.log('User is not registered - showing registration form');
        setIsExistingUser(false);

        // If they connected with a different wallet than expected, show warning
        if (expectedWalletAddress && account.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
          setMessage('⚠️ This wallet address does not match the account found with your ID document. Please connect the correct wallet or register as a new user.');
        }
      }
    } catch (error: any) {
      console.error('Error checking existing user:', error);
      console.error('Error details:', error.message);

      // If there's an error (like user not found), assume they need to register
      setIsExistingUser(false);

      // Only show error message if it's not a "not found" type error
      if (!error.message?.includes('call revert exception') && !error.message?.includes('execution reverted')) {
        setMessage('⚠️ Could not check registration status. You can still register if you are new.');
      }
    } finally {
      setCheckingUser(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginIdDocument.trim()) {
      setMessage('❌ Please enter your ID document number');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (!existingUserData) {
        setMessage('❌ No user data found');
        return;
      }

      // Verify ID document matches
      if (existingUserData.idDocument.toLowerCase() !== loginIdDocument.toLowerCase()) {
        setMessage('❌ ID document number does not match our records');
        return;
      }

      setMessage('✅ Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Login error:', error);
      setMessage('❌ Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('Starting registration...');
      console.log('Contract Address:', process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS);

      setMessage('🔄 Connecting to blockchain...');

      const signer = await getSigner();
      console.log('Signer obtained:', await signer.getAddress());

      const contract = getContract(signer);
      console.log('Contract instance created');

      setMessage('📝 Submitting registration...');
      console.log('Calling registerOwner with:', formData);

      const tx = await contract.registerOwner(
        formData.name,
        formData.idDocument,
        formData.contactInfo,
        formData.homeState,
        formData.homeDistrict
      );

      console.log('Transaction submitted:', tx.hash);
      setMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setMessage('✅ Successfully registered as owner! Redirecting to dashboard...');
      setFormData({ name: '', idDocument: '', contactInfo: '', homeState: '', homeDistrict: '' });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error reason:', error.reason);

      let errorMessage = 'Transaction failed';

      if (error.message && error.message.includes('circuit breaker')) {
        errorMessage = 'MetaMask connection issue. Please: 1) Close and reopen MetaMask, 2) Switch to Ganache Local network, 3) Try again';
      } else if (error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Make sure you\'re on Ganache Local network (Chain ID: 1337)';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Contract execution failed. Make sure Ganache is running and contract is deployed.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register as Owner - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏠</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          {!isConnected ? (
            /* Wallet Connection Required - with ID Login Option */
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
                <p className="text-gray-600 mb-6">
                  Please connect your MetaMask wallet to continue with registration or login
                </p>
                <button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    'Connect MetaMask'
                  )}
                </button>

                {message && (
                  <div className={`mt-4 p-4 rounded-lg ${message.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : message.includes('❌') || message.includes('⚠️')
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                    }`}>
                    {message}
                  </div>
                )}
              </div>

              {/* Alternative ID Login */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🆔</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Already Registered? Login with ID</h3>
                  <p className="text-gray-600">
                    Enter your government ID to find your account, then connect your associated wallet
                  </p>
                </div>

                <IdLoginForm onAccountFound={setExpectedWalletAddress} />
              </div>
            </div>
          ) : checkingUser ? (
            /* Checking User Status */
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Checking Registration Status</h2>
              <p className="text-gray-600">Please wait while we verify your account...</p>
            </div>
          ) : isExistingUser === true ? (
            /* Existing User - Login or Auto-redirect */
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                <p className="text-gray-600">We found your account. You can login or go directly to dashboard.</p>
              </div>

              {existingUserData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">Your Account Details:</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>Name:</strong> {existingUserData.name}</p>
                    <p><strong>Contact:</strong> {existingUserData.contactInfo}</p>
                    <p><strong>Location:</strong> {existingUserData.homeDistrict}, {existingUserData.homeState}</p>
                    <p><strong>Status:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${existingUserData.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {existingUserData.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {!showLogin ? (
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Go to Dashboard
                  </button>

                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                  >
                    Verify with ID Document
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter your ID Document Number to verify
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdDocument}
                      onChange={(e) => setLoginIdDocument(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your ID Document Number"
                    />
                  </div>

                  {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅')
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                      }`}>
                      {message}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowLogin(false)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Login'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* New User Registration */
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Register as Owner</h2>
                <p className="text-gray-600">Create your owner account in the land registry system</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Document Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idDocument}
                    onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="National ID or Passport Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Information *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Email or Phone Number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Home State *
                    </label>
                    <select
                      required
                      value={formData.homeState}
                      onChange={(e) => setFormData({ ...formData, homeState: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Home District *
                    </label>
                    <select
                      required
                      value={formData.homeDistrict}
                      onChange={(e) => setFormData({ ...formData, homeDistrict: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={!formData.homeState}
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    {!formData.homeState && (
                      <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                    )}
                  </div>
                </div>



                {message && (
                  <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Register as Owner'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/" className="text-primary-600 hover:text-primary-700">
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}

          {/* Connected Account Display */}
          {isConnected && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Connected: <span className="font-mono font-semibold">{account.slice(0, 6)}...{account.slice(-4)}</span>
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
