import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../utils/contract';

interface Property {
  propertyId: number;
  propertyAddress: string;
  district: string;
  city: string;
  state: string;
  area: number;
  currentOwner: string;
  documentHash: string;
  isRegistered: boolean;
  isVerified: boolean;
  registrationDate: number;
  lastTransferDate: number;
}

interface Owner {
  ownerAddress: string;
  name: string;
  idDocument: string;
  contactInfo: string;
  isVerified: boolean;
}

export default function Search() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [searchType, setSearchType] = useState<'property' | 'owner'>('property');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [error, setError] = useState('');
  const [totalProperties, setTotalProperties] = useState(0);

  useEffect(() => {
    checkWalletConnection();
    loadStats();
  }, []);

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

  const loadStats = async () => {
    try {
      const provider = getProvider();
      const contract = getContract(provider);
      
      const total = await contract.getTotalProperties();
      setTotalProperties(Number(total));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError('');
    setProperty(null);
    setOwner(null);

    try {
      const provider = getProvider();
      const contract = getContract(provider);

      if (searchType === 'property') {
        // Search by property ID
        const propertyId = parseInt(searchQuery);
        if (isNaN(propertyId) || propertyId <= 0) {
          setError('Please enter a valid property ID (positive number)');
          return;
        }

        try {
          const details = await contract.getPropertyDetails(propertyId);
          
          if (!details.isRegistered) {
            setError('Property not found');
            return;
          }

          setProperty({
            propertyId: propertyId,
            propertyAddress: details.propertyAddress,
            district: details.district,
            city: details.city,
            state: details.state,
            area: Number(details.area),
            currentOwner: details.currentOwner,
            documentHash: details.documentHash,
            isRegistered: details.isRegistered,
            isVerified: details.isVerified,
            registrationDate: Number(details.registrationDate),
            lastTransferDate: Number(details.lastTransferDate)
          });
        } catch (error) {
          setError('Property not found');
        }
      } else {
        // Search by owner address
        if (!ethers.isAddress(searchQuery)) {
          setError('Please enter a valid Ethereum address');
          return;
        }

        try {
          const ownerDetails = await contract.getOwnerDetails(searchQuery);
          
          if (!ownerDetails.name) {
            setError('Owner not found');
            return;
          }

          setOwner({
            ownerAddress: ownerDetails.ownerAddress,
            name: ownerDetails.name,
            idDocument: ownerDetails.idDocument,
            contactInfo: ownerDetails.contactInfo,
            isVerified: ownerDetails.isVerified
          });
        } catch (error) {
          setError('Owner not found');
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError('Search failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Search Properties & Owners - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
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
                  <p className="text-xs text-gray-500">Search & Verify</p>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Connected Account</p>
                    <p className="text-sm font-mono font-semibold text-gray-700">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    Connect Wallet
                  </button>
                )}
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
                <span className="text-gray-700 font-semibold">Search</span>
              </li>
            </ol>
          </nav>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Public Registry Search</h2>
              <p className="text-gray-600 mb-4">
                Verify property ownership and access public records
              </p>
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold">📊</span>
                <span className="text-blue-800 font-semibold">
                  {totalProperties.toLocaleString()} Properties Registered
                </span>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Search Registry</h2>
              <p className="text-gray-600">
                Look up properties by ID or owners by address
              </p>
            </div>

            {/* Search Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setSearchType('property');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setError('');
                  }}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    searchType === 'property'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  🏡 Search Property
                </button>
                <button
                  onClick={() => {
                    setSearchType('owner');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setError('');
                  }}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    searchType === 'owner'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  👤 Search Owner
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {searchType === 'property' ? 'Property ID' : 'Owner Address'}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={
                    searchType === 'property' 
                      ? 'e.g., 1' 
                      : 'e.g., 0x123...abc'
                  }
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Property Results */}
          {property && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Property #{property.propertyId}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  property.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {property.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Property Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold">{property.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">
                        {property.district && `${property.district}, `}{property.city}, {property.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold">{property.area.toLocaleString()} sq m</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Ownership & History</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Current Owner</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {property.currentOwner}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-semibold">{formatDate(property.registrationDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Transfer</p>
                      <p className="font-semibold">{formatDate(property.lastTransferDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {property.documentHash && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Document Hash</h4>
                  <p className="font-mono text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-all">
                    {property.documentHash}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  href={`/property/${property.propertyId}`}
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  View Full Details & History
                </Link>
              </div>
            </div>
          )}

          {/* Owner Results */}
          {owner && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Owner Profile</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  owner.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {owner.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Owner Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{owner.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Information</p>
                      <p className="font-semibold">{owner.contactInfo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Wallet Address</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {owner.ownerAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Verification Status</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">ID Document (Hash)</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {owner.idDocument}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verification</p>
                      <p className={`font-semibold ${
                        owner.isVerified ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {owner.isVerified ? 'Government Verified' : 'Pending Government Verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
