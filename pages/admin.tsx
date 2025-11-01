import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getSigner } from '../utils/contract';

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

export default function Admin() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [unverifiedProperties, setUnverifiedProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);

  // Add verifier form
  const [newVerifier, setNewVerifier] = useState('');
  const [addingVerifier, setAddingVerifier] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (account) {
      checkPermissions();
      if (isVerifier) {
        loadAdminData();
      }
    }
  }, [account, isVerifier]);

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
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
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

  const checkPermissions = async () => {
    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      // Check if user is contract owner
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());

      // Check if user is verifier
      const verifier = await contract.verifiers(account);
      setIsVerifier(verifier || owner.toLowerCase() === account.toLowerCase());

    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      // Get total counts
      const totalProps = await contract.getTotalProperties();
      const totalTrans = await contract.getTotalTransferRequests();
      
      setTotalProperties(Number(totalProps));
      setTotalTransfers(Number(totalTrans));

      // Load pending transfer requests
      const pendingTransfersList: TransferRequest[] = [];
      for (let i = 1; i <= Number(totalTrans); i++) {
        try {
          const transfer = await contract.getTransferRequestDetails(i);
          if (!transfer.isCompleted && !transfer.isApproved) {
            pendingTransfersList.push({
              requestId: i,
              propertyId: Number(transfer.propertyId),
              fromOwner: transfer.fromOwner,
              toOwner: transfer.toOwner,
              requestDate: Number(transfer.requestDate),
              isApproved: transfer.isApproved,
              isCompleted: transfer.isCompleted,
              transferDocumentHash: transfer.transferDocumentHash
            });
          }
        } catch (error) {
          // Skip invalid transfer requests
        }
      }
      setPendingTransfers(pendingTransfersList);

      // Load unverified properties
      const unverifiedList: Property[] = [];
      for (let i = 1; i <= Number(totalProps); i++) {
        try {
          const property = await contract.getPropertyDetails(i);
          if (property.isRegistered && !property.isVerified) {
            unverifiedList.push({
              propertyId: i,
              propertyAddress: property.propertyAddress,
              district: property.district,
              city: property.city,
              state: property.state,
              area: Number(property.area),
              currentOwner: property.currentOwner,
              documentHash: property.documentHash,
              isRegistered: property.isRegistered,
              isVerified: property.isVerified,
              registrationDate: Number(property.registrationDate),
              lastTransferDate: Number(property.lastTransferDate)
            });
          }
        } catch (error) {
          // Skip invalid properties
        }
      }
      setUnverifiedProperties(unverifiedList);

    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const approveTransfer = async (requestId: number) => {
    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      const tx = await contract.approveTransferRequest(requestId);
      alert('Approving transfer request...');
      
      await tx.wait();
      alert('Transfer request approved successfully!');
      
      // Reload data
      loadAdminData();
    } catch (error: any) {
      console.error('Error approving transfer:', error);
      alert('Failed to approve transfer: ' + (error.message || 'Unknown error'));
    }
  };

  const verifyProperty = async (propertyId: number) => {
    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      const tx = await contract.verifyProperty(propertyId);
      alert('Verifying property...');
      
      await tx.wait();
      alert('Property verified successfully!');
      
      // Reload data
      loadAdminData();
    } catch (error: any) {
      console.error('Error verifying property:', error);
      alert('Failed to verify property: ' + (error.message || 'Unknown error'));
    }
  };

  const addVerifier = async () => {
    if (!newVerifier || !ethers.isAddress(newVerifier)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    setAddingVerifier(true);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      const tx = await contract.addVerifier(newVerifier);
      alert('Adding verifier...');
      
      await tx.wait();
      alert('Verifier added successfully!');
      
      setNewVerifier('');
    } catch (error: any) {
      console.error('Error adding verifier:', error);
      alert('Failed to add verifier: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingVerifier(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Admin Panel - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Admin Panel - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the admin panel
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

  if (!isVerifier) {
    return (
      <>
        <Head>
          <title>Access Denied - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have verifier permissions to access this panel
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🔐</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Government Verifier Dashboard</p>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isOwner && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      Contract Owner
                    </span>
                  )}
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                    Government Verifier
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Connected Account</p>
                  <p className="text-sm font-mono font-semibold text-gray-700">
                    {formatAddress(account)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalProperties}</div>
                <div className="text-sm text-gray-500">Total Properties</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalTransfers}</div>
                <div className="text-sm text-gray-500">Total Transfers</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{unverifiedProperties.length}</div>
                <div className="text-sm text-gray-500">Pending Properties</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{pendingTransfers.length}</div>
                <div className="text-sm text-gray-500">Pending Transfers</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Transfer Requests */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Pending Transfer Requests ({pendingTransfers.length})
              </h2>
              
              {pendingTransfers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-gray-500">No pending transfer requests</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingTransfers.map((transfer) => (
                    <div key={transfer.requestId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Transfer #{transfer.requestId}</h3>
                          <p className="text-sm text-gray-500">Property #{transfer.propertyId}</p>
                          <p className="text-sm text-gray-500">{formatDate(transfer.requestDate)}</p>
                        </div>
                        <button
                          onClick={() => approveTransfer(transfer.requestId)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        >
                          Approve
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">From</p>
                          <p className="font-mono">{formatAddress(transfer.fromOwner)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">To</p>
                          <p className="font-mono">{formatAddress(transfer.toOwner)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unverified Properties */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Unverified Properties ({unverifiedProperties.length})
              </h2>
              
              {unverifiedProperties.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-gray-500">No unverified properties</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {unverifiedProperties.map((property) => (
                    <div key={property.propertyId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Property #{property.propertyId}</h3>
                          <p className="text-sm text-gray-700">{property.propertyAddress}</p>
                          <p className="text-sm text-gray-500">
                            {property.city}, {property.state}
                          </p>
                        </div>
                        <button
                          onClick={() => verifyProperty(property.propertyId)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                        >
                          Verify
                        </button>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Owner: {formatAddress(property.currentOwner)}</p>
                        <p className="text-gray-500">Area: {property.area.toLocaleString()} sq m</p>
                        <p className="text-gray-500">Registered: {formatDate(property.registrationDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions (Only for Contract Owner) */}
          {isOwner && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Owner Actions</h2>
              
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Verifier</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newVerifier}
                    onChange={(e) => setNewVerifier(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Verifier address (0x...)"
                  />
                  <button
                    onClick={addVerifier}
                    disabled={addingVerifier || !newVerifier}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingVerifier ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Add a new government official as a verifier
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
