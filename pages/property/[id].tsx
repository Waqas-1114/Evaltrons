import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../../utils/contract';

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

interface TransferRequest {
  requestId: number;
  propertyId: number;
  fromOwner: string;
  toOwner: string;
  requestDate: number;
  isApproved: boolean;
  isCompleted: boolean;
  transferDocumentHash: string;
}

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (id) {
      loadPropertyDetails();
    }
  }, [id]);

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

  const loadPropertyDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const provider = getProvider();
      const contract = getContract(provider);
      
      const propertyId = parseInt(id as string);
      if (isNaN(propertyId) || propertyId <= 0) {
        setError('Invalid property ID');
        return;
      }

      // Load property details
      const details = await contract.getPropertyDetails(propertyId);
      
      if (!details.isRegistered) {
        setError('Property not found');
        return;
      }

      const propertyData: Property = {
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

      setProperty(propertyData);

      // Load owner details
      const ownerDetails = await contract.getOwnerDetails(details.currentOwner);
      if (ownerDetails.name) {
        setOwner({
          ownerAddress: ownerDetails.ownerAddress,
          name: ownerDetails.name,
          idDocument: ownerDetails.idDocument,
          contactInfo: ownerDetails.contactInfo,
          isVerified: ownerDetails.isVerified
        });
      }

      // Load transfer history
      const transferIds = await contract.getPropertyTransferHistory(propertyId);
      const transferPromises = transferIds.map(async (transferId: bigint) => {
        const transferDetails = await contract.getTransferRequestDetails(transferId);
        return {
          requestId: Number(transferId),
          propertyId: Number(transferDetails.propertyId),
          fromOwner: transferDetails.fromOwner,
          toOwner: transferDetails.toOwner,
          requestDate: Number(transferDetails.requestDate),
          isApproved: transferDetails.isApproved,
          isCompleted: transferDetails.isCompleted,
          transferDocumentHash: transferDetails.transferDocumentHash
        };
      });

      const transfers = await Promise.all(transferPromises);
      setTransferHistory(transfers);

    } catch (error: any) {
      console.error('Error loading property details:', error);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Property Details - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Head>
          <title>Property Not Found - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested property could not be found'}</p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Search Properties
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Property #{property.propertyId} - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
                  <p className="text-xs text-gray-500">Property #{property.propertyId}</p>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                {isConnected && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Connected Account</p>
                    <p className="text-sm font-mono font-semibold text-gray-700">
                      {formatAddress(account)}
                    </p>
                  </div>
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
                <Link href="/search" className="text-gray-500 hover:text-primary-600">Search</Link>
              </li>
              <li>
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-700 font-semibold">Property #{property.propertyId}</span>
              </li>
            </ol>
          </nav>

          {/* Property Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Property #{property.propertyId}
                </h1>
                <p className="text-xl text-gray-700 mb-2">{property.propertyAddress}</p>
                <p className="text-gray-600">
                  {property.district && `${property.district}, `}{property.city}, {property.state}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  property.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {property.isVerified ? '✅ Government Verified' : '⏳ Pending Verification'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{property.area.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Square Meters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatDate(property.registrationDate).split(',')[0]}
                </div>
                <div className="text-sm text-gray-500">Registration Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDate(property.lastTransferDate).split(',')[0]}
                </div>
                <div className="text-sm text-gray-500">Last Transfer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{transferHistory.length}</div>
                <div className="text-sm text-gray-500">Total Transfers</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Current Owner */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Current Owner</h2>
                {owner ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{owner.name}</p>
                        <p className="text-gray-600">{owner.contactInfo}</p>
                        <p className="font-mono text-sm text-gray-500 break-all">{owner.ownerAddress}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        owner.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {owner.isVerified ? '✅ Verified Owner' : '⏳ Unverified'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Owner information not available</p>
                    <p className="font-mono text-sm text-gray-400 mt-2 break-all">{property.currentOwner}</p>
                  </div>
                )}
              </div>

              {/* Transfer History */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transfer History</h2>
                {transferHistory.length > 0 ? (
                  <div className="space-y-4">
                    {transferHistory.map((transfer, index) => (
                      <div key={transfer.requestId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">Transfer #{transfer.requestId}</h3>
                            <p className="text-sm text-gray-500">{formatDate(transfer.requestDate)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            transfer.isCompleted
                              ? 'bg-green-100 text-green-800'
                              : transfer.isApproved
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transfer.isCompleted ? 'Completed' : transfer.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">From</p>
                            <p className="font-mono break-all">{formatAddress(transfer.fromOwner)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">To</p>
                            <p className="font-mono break-all">{formatAddress(transfer.toOwner)}</p>
                          </div>
                        </div>
                        {transfer.transferDocumentHash && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-gray-500 text-sm">Document Hash</p>
                            <p className="font-mono text-xs text-gray-600 break-all">{transfer.transferDocumentHash}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-500">No transfers recorded yet</p>
                    <p className="text-sm text-gray-400">This property has not been transferred since registration</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Document Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Document Hash</h3>
                {property.documentHash ? (
                  <div>
                    <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-3 rounded-lg">
                      {property.documentHash}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This hash represents the property documents stored on IPFS
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No document hash available</p>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/search"
                    className="w-full block text-center px-4 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold"
                  >
                    🔍 Search Other Properties
                  </Link>
                  
                  {isConnected && account.toLowerCase() === property.currentOwner.toLowerCase() && (
                    <Link
                      href="/my-properties"
                      className="w-full block text-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                      📋 My Properties
                    </Link>
                  )}
                  
                  <Link
                    href="/"
                    className="w-full block text-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                  >
                    🏠 Back to Home
                  </Link>
                </div>
              </div>

              {/* Property Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Property Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered</span>
                    <span className="font-semibold text-green-600">
                      {property.isRegistered ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified</span>
                    <span className={`font-semibold ${property.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {property.isVerified ? 'Yes' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfers</span>
                    <span className="font-semibold">{transferHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area</span>
                    <span className="font-semibold">{property.area.toLocaleString()} m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
