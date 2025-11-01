import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getSigner } from '../utils/contract';

interface Owner {
  ownerAddress: string;
  name: string;
  idDocument: string;
  contactInfo: string;
  isVerified: boolean;
}

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

export default function MyProperties() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    toAddress: '',
    documentHash: ''
  });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (account) {
      loadOwnerDetails();
      loadMyProperties();
    }
  }, [account]);

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
          isVerified: ownerDetails.isVerified
        });
      }
    } catch (error) {
      console.error('Error loading owner details:', error);
    }
  };

  const loadMyProperties = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      
      const propertyIds = await contract.getOwnerProperties(account);
      
      // Get list of deleted properties from localStorage
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
      
      const propertyPromises = propertyIds.map(async (id: bigint) => {
        const propertyId = Number(id);
        
        // Skip if property is marked as deleted
        if (deletedProperties.includes(propertyId)) {
          return null;
        }
        
        const details = await contract.getPropertyDetails(id);
        return {
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
        };
      });
      
      const propertiesData = await Promise.all(propertyPromises);
      // Filter out null values (deleted properties)
      setProperties(propertiesData.filter(p => p !== null) as Property[]);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProperty || !transferData.toAddress) return;

    setTransferring(true);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      
      const tx = await contract.createTransferRequest(
        selectedProperty.propertyId,
        transferData.toAddress,
        transferData.documentHash || 'QmTransferDoc'
      );
      
      console.log('Transfer request sent:', tx.hash);
      alert('Transfer request created! Waiting for government approval...');
      
      await tx.wait();
      alert('Transfer request created successfully!');
      
      setShowTransferModal(false);
      setSelectedProperty(null);
      setTransferData({ toAddress: '', documentHash: '' });
      
    } catch (error: any) {
      console.error('Error creating transfer request:', error);
      alert('Failed to create transfer request: ' + (error.message || 'Unknown error'));
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>My Properties - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your MetaMask wallet to view your properties
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
        <title>My Properties - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
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
                  <p className="text-xs text-gray-500">My Properties</p>
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
                <span className="text-gray-700 font-semibold">My Properties</span>
              </li>
            </ol>
          </nav>

          {/* Owner Info */}
          {owner && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Owner: {owner.name}</h2>
                  <p className="text-gray-600">Contact: {owner.contactInfo}</p>
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
          )}

          {/* Properties Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">My Properties</h2>
                <p className="text-gray-600">Properties registered under your account</p>
              </div>
              <Link
                href="/register-property"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Property</span>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading properties...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏘️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Properties Found</h3>
                <p className="text-gray-600 mb-6">
                  You haven't registered any properties yet
                </p>
                <Link
                  href="/register-property"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Register Your First Property
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {properties.map((property) => (
                  <div key={property.propertyId} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Property #{property.propertyId}
                        </h3>
                        <p className="text-lg text-gray-700">{property.propertyAddress}</p>
                        <p className="text-gray-600">
                          {property.district && `${property.district}, `}{property.city}, {property.state}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          property.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Area</p>
                        <p className="font-semibold">{property.area.toLocaleString()} sq m</p>
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

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Document Hash</p>
                        <p className="font-mono text-sm text-gray-700">
                          {property.documentHash || 'No document hash'}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Link
                          href={`/property/${property.propertyId}`}
                          className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold"
                        >
                          View Details
                        </Link>
                        {property.isVerified && (
                          <button
                            onClick={() => {
                              setSelectedProperty(property);
                              setShowTransferModal(true);
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                          >
                            Transfer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Transfer Modal */}
        {showTransferModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Transfer Property #{selectedProperty.propertyId}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedProperty.propertyAddress}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transfer To (Address) *
                  </label>
                  <input
                    type="text"
                    value={transferData.toAddress}
                    onChange={(e) => setTransferData(prev => ({ ...prev, toAddress: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transfer Document Hash (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferData.documentHash}
                    onChange={(e) => setTransferData(prev => ({ ...prev, documentHash: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="IPFS hash of transfer documents"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedProperty(null);
                    setTransferData({ toAddress: '', documentHash: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferring || !transferData.toAddress}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {transferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Transfer Request</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
