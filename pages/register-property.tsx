import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getContract, getSigner } from '../utils/contract';
import { getAllStates, getDistrictsByState } from '../data/indiaData';

interface Owner {
  ownerAddress: string;
  name: string;
  idDocument: string;
  contactInfo: string;
  homeState: string;
  homeDistrict: string;
  isVerified: boolean;
}

const PROPERTY_TYPES = [
  'Residential',
  'Commercial', 
  'Agricultural',
  'Industrial'
];

export default function RegisterProperty() {
  const router = useRouter();
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [propertyData, setPropertyData] = useState({
    address: '',
    district: '',
    state: '',
    area: '',
    propertyType: '',
    surveyNumber: '',
    subDivision: '',
    documentHash: ''
  });

  const [states] = useState(getAllStates());
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (account) {
      loadOwnerDetails();
    }
  }, [account]);

  useEffect(() => {
    if (propertyData.state) {
      const stateDistricts = getDistrictsByState(propertyData.state);
      setDistricts(stateDistricts);
      setPropertyData(prev => ({ ...prev, district: '' }));
    }
  }, [propertyData.state]);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
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
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please make sure MetaMask is installed.');
      }
    } else {
      alert('Please install MetaMask to use this application.');
    }
  };

  const loadOwnerDetails = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      
      const ownerDetails = await contract.getOwnerDetails(account);
      
      if (ownerDetails.name) {
        setOwner({
          ownerAddress: ownerDetails.ownerAddress,
          name: ownerDetails.name,
          idDocument: ownerDetails.idDocument,
          contactInfo: ownerDetails.contactInfo,
          homeState: ownerDetails.homeState,
          homeDistrict: ownerDetails.homeDistrict,
          isVerified: ownerDetails.isVerified
        });
      }
    } catch (error) {
      console.error('Error loading owner details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!owner) {
      alert('Please register as an owner first');
      return;
    }

    if (!propertyData.address || !propertyData.district || !propertyData.state || !propertyData.area || !propertyData.propertyType) {
      alert('Please fill in all required fields');
      return;
    }

    setRegistering(true);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      
      const tx = await contract.registerProperty(
        propertyData.address,
        propertyData.district,
        propertyData.state,
        ethers.parseUnits(propertyData.area, 0), // Convert to BigNumber
        propertyData.propertyType,
        propertyData.surveyNumber || '',
        propertyData.subDivision || '',
        propertyData.documentHash || 'QmPropertyDocument' // Placeholder IPFS hash
      );
      
      console.log('Transaction sent:', tx.hash);
      setMessage('Property registration transaction sent! Please wait for confirmation...');
      
      await tx.wait();
      setMessage('✅ Property registered successfully! Redirecting to dashboard...');
      
      // Clear form
      setPropertyData({
        address: '',
        district: '',
        state: '',
        area: '',
        propertyType: '',
        surveyNumber: '',
        subDivision: '',
        documentHash: ''
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error registering property:', error);
      setMessage('❌ Failed to register property: ' + (error.message || 'Unknown error'));
    } finally {
      setRegistering(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Register Property - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your MetaMask wallet to register properties
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Connect MetaMask
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Register Property - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🏠</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
                  <p className="text-xs text-gray-500">Register Property</p>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Connected Account</p>
                  <p className="text-sm font-mono font-semibold text-gray-700">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link>
              </li>
              <li>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-700 font-semibold">Register Property</span>
              </li>
            </ol>
          </nav>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading owner information...</span>
            </div>
          ) : !owner ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Owner Registration Required</h3>
              <p className="text-gray-600 mb-6">
                You need to register as an owner before you can register properties
              </p>
              <Link 
                href="/register-owner"
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Register as Owner
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Owner Status */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Owner: {owner.name}</h2>
                    <p className="text-gray-600">Contact: {owner.contactInfo}</p>
                    <p className="text-gray-600">Location: {owner.homeDistrict}, {owner.homeState}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      owner.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {owner.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🏡</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Register New Property</h2>
                  <p className="text-gray-600">
                    Add a new property to the blockchain registry
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Property Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={propertyData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 123 Main Street"
                      required
                    />
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        name="state"
                        value={propertyData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        District *
                      </label>
                      <select
                        name="district"
                        value={propertyData.district}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={!propertyData.state}
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      {!propertyData.state && (
                        <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                      )}
                    </div>
                  </div>

                  {/* Property Type and Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <select
                        name="propertyType"
                        value={propertyData.propertyType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Property Type</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Survey Number
                      </label>
                      <input
                        type="text"
                        name="surveyNumber"
                        value={propertyData.surveyNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Survey No. 123/4"
                      />
                    </div>
                  </div>

                  {/* Sub Division */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Division (if any)
                    </label>
                    <input
                      type="text"
                      name="subDivision"
                      value={propertyData.subDivision}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Plot A, Block 1"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Area (Square Meters) *
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={propertyData.area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 1000"
                      min="1"
                      required
                    />
                  </div>

                  {/* Document Hash */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Document Hash (Optional)
                    </label>
                    <input
                      type="text"
                      name="documentHash"
                      value={propertyData.documentHash}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="IPFS hash of property documents"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      If you have uploaded property documents to IPFS, enter the hash here
                    </p>
                  </div>

                  {/* Message Display */}
                  {message && (
                    <div className={`p-4 rounded-lg ${
                      message.includes('✅') 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : message.includes('❌')
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-blue-50 border border-blue-200 text-blue-800'
                    }`}>
                      <p className="font-semibold">{message}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-between items-center pt-6">
                    <Link
                      href="/"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </Link>
                    
                    <button
                      type="submit"
                      disabled={registering}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {registering ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>🏡</span>
                          <span>Register Property</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
