import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getProvider, getSigner } from '../utils/contract';

interface DashboardStats {
  totalProperties: number;
  totalTransfers: number;
  verifiedProperties: number;
  pendingVerifications: number;
  recentProperties: any[];
  recentTransfers: any[];
}

interface OwnerInfo {
  name: string;
  idDocument: string;
  contactInfo: string;
  isVerified: boolean;
  isRegistered: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTransfers: 0,
    verifiedProperties: 0,
    pendingVerifications: 0,
    recentProperties: [],
    recentTransfers: []
  });
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (account) {
      loadOwnerInfo();
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

  const loadOwnerInfo = async () => {
    if (!account) return;

    setLoadingOwner(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const ownerDetails = await contract.getOwnerDetails(account);

      if (ownerDetails.name) {
        setOwnerInfo({
          name: ownerDetails.name,
          idDocument: ownerDetails.idDocument,
          contactInfo: ownerDetails.contactInfo,
          isVerified: ownerDetails.isVerified,
          isRegistered: true
        });
      } else {
        setOwnerInfo({
          name: '',
          idDocument: '',
          contactInfo: '',
          isVerified: false,
          isRegistered: false
        });
      }
    } catch (error) {
      console.error('Error loading owner info:', error);
      setOwnerInfo({
        name: '',
        idDocument: '',
        contactInfo: '',
        isVerified: false,
        isRegistered: false
      });
    } finally {
      setLoadingOwner(false);
    }
  };

  const handleDeleteProperty = (property: any) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setDeletingProperty(true);
    try {
      // In a real blockchain system, you can't truly "delete" data for immutability
      // Instead, we'll mark it as deleted in localStorage
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
      deletedProperties.push(propertyToDelete.id);
      localStorage.setItem('deleted_properties', JSON.stringify(deletedProperties));

      // Also remove the property files if they exist
      const provider = getProvider();
      const contract = getContract(provider);
      const propDetails = await contract.getPropertyDetails(propertyToDelete.id);
      const documentHash = propDetails.documentHash;

      if (documentHash) {
        localStorage.removeItem(`property_files_${documentHash}`);
      }

      alert('✅ Property marked as deleted successfully! It will no longer appear in your dashboard.');

      // Reload dashboard data
      await loadDashboardData();

      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('❌ Failed to delete property. Please try again.');
    } finally {
      setDeletingProperty(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      // Get basic stats
      const totalProps = await contract.getTotalProperties();
      const totalTrans = await contract.getTotalTransferRequests();

      const totalProperties = Number(totalProps);
      const totalTransfers = Number(totalTrans);

      // Count verified properties
      let verifiedCount = 0;
      let pendingCount = 0;
      const recentProps = [];

      // Get list of deleted properties from localStorage
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');

      for (let i = Math.max(1, totalProperties - 9); i <= totalProperties; i++) {
        try {
          // Skip if property is marked as deleted
          if (deletedProperties.includes(i)) {
            continue;
          }

          const property = await contract.getPropertyDetails(i);
          if (property.isRegistered) {
            if (property.isVerified) {
              verifiedCount++;
            } else {
              pendingCount++;
            }

            recentProps.push({
              id: i,
              address: property.propertyAddress,
              city: property.city,
              state: property.state,
              owner: property.currentOwner,
              verified: property.isVerified,
              registrationDate: Number(property.registrationDate)
            });
          }
        } catch (error) {
          // Skip invalid properties
        }
      }

      // Get recent transfers
      const recentTransfers = [];
      for (let i = Math.max(1, totalTransfers - 4); i <= totalTransfers; i++) {
        try {
          const transfer = await contract.getTransferRequestDetails(i);
          recentTransfers.push({
            id: i,
            propertyId: Number(transfer.propertyId),
            fromOwner: transfer.fromOwner,
            toOwner: transfer.toOwner,
            approved: transfer.isApproved,
            completed: transfer.isCompleted,
            requestDate: Number(transfer.requestDate)
          });
        } catch (error) {
          // Skip invalid transfers
        }
      }

      // Calculate actual total properties (excluding deleted ones)
      const actualTotalProperties = totalProperties - deletedProperties.length;

      setStats({
        totalProperties: actualTotalProperties,
        totalTransfers,
        verifiedProperties: verifiedCount,
        pendingVerifications: pendingCount,
        recentProperties: recentProps.reverse(),
        recentTransfers: recentTransfers.reverse()
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const verificationRate = stats.totalProperties > 0
    ? ((stats.verifiedProperties / stats.totalProperties) * 100).toFixed(1)
    : '0';

  return (
    <>
      <Head>
        <title>Dashboard - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                  <p className="text-xs text-gray-500">Registry Analytics</p>
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
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                  >
                    Connect Wallet
                  </button>
                )}
                <Link
                  href="/"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-4 text-gray-600">Loading dashboard...</span>
            </div>
          ) : (
            <>
              {/* Owner Info Section */}
              {isConnected && (
                <div className="mb-8">
                  {loadingOwner ? (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span className="ml-2 text-gray-600">Loading owner info...</span>
                      </div>
                    </div>
                  ) : ownerInfo?.isRegistered ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">👤</div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">Welcome back, {ownerInfo.name}!</h3>
                            <p className="text-sm text-gray-600">Registered Owner Dashboard</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${ownerInfo.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          <span className="text-sm font-semibold">
                            {ownerInfo.isVerified ? '✅ Government Verified' : '⏳ Pending Verification'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Contact Info</p>
                          <p className="font-semibold text-gray-800">{ownerInfo.contactInfo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                          <p className="font-mono text-sm text-gray-700">{account.slice(0, 20)}...</p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Link
                            href="/register-property"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                          >
                            Register Property
                          </Link>
                          <Link
                            href="/request-transfer"
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm"
                          >
                            Request Transfer
                          </Link>
                          <Link
                            href="/my-properties"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                          >
                            My Properties
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">🆔</div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">Owner Registration Required</h3>
                            <p className="text-sm text-gray-600">Register as an owner to access full features</p>
                          </div>
                        </div>
                        <Link
                          href="/register-owner"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                          Register as Owner
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Properties</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
                    </div>
                    <div className="text-blue-500 text-3xl">🏠</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Verified</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.verifiedProperties.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{verificationRate}% of total</p>
                    </div>
                    <div className="text-green-500 text-3xl">✅</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Pending</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Awaiting verification</p>
                    </div>
                    <div className="text-orange-500 text-3xl">⏳</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Total Transfers</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalTransfers.toLocaleString()}</p>
                    </div>
                    <div className="text-purple-500 text-3xl">🔄</div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Verification Status Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Verification Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Verified Properties</span>
                        <span className="text-sm text-gray-500">{stats.verifiedProperties}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: stats.totalProperties > 0
                              ? `${(stats.verifiedProperties / stats.totalProperties) * 100}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Pending Verification</span>
                        <span className="text-sm text-gray-500">{stats.pendingVerifications}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: stats.totalProperties > 0
                              ? `${(stats.pendingVerifications / stats.totalProperties) * 100}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registry Health */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Registry Health</h3>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${parseFloat(verificationRate) >= 80 ? 'text-green-500' :
                          parseFloat(verificationRate) >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {verificationRate}%
                      </div>
                      <p className="text-gray-600">Properties Verified</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalProperties}</div>
                        <div className="text-xs text-gray-500">Total Registered</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{stats.totalTransfers}</div>
                        <div className="text-xs text-gray-500">Total Transfers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Properties */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Recent Properties</h3>
                    <Link
                      href="/search"
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      View All →
                    </Link>
                  </div>

                  {stats.recentProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🏘️</div>
                      <p className="text-gray-500">No properties registered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentProperties.slice(0, 5).map((property) => (
                        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">#{property.id}</p>
                            <p className="text-sm text-gray-600 truncate max-w-48">
                              {property.address}
                            </p>
                            <p className="text-xs text-gray-500">
                              {property.city}, {property.state}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${property.verified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {property.verified ? 'Verified' : 'Pending'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(property.registrationDate)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteProperty(property)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                              title="Delete Property"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transfers */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Recent Transfers</h3>
                    <Link
                      href="/admin"
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Admin Panel →
                    </Link>
                  </div>

                  {stats.recentTransfers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-gray-500">No transfers recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentTransfers.slice(0, 5).map((transfer) => (
                        <div key={transfer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-800">Transfer #{transfer.id}</p>
                            <p className="text-sm text-gray-600">
                              Property #{transfer.propertyId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatAddress(transfer.fromOwner)} → {formatAddress(transfer.toOwner)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${transfer.completed
                                ? 'bg-green-100 text-green-800'
                                : transfer.approved
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {transfer.completed ? 'Completed' : transfer.approved ? 'Approved' : 'Pending'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(transfer.requestDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-green-500 text-2xl mb-2">🟢</div>
                    <p className="font-semibold text-gray-800">Blockchain Network</p>
                    <p className="text-sm text-gray-600">Connected & Operational</p>
                  </div>
                  <div className="text-center">
                    <div className="text-green-500 text-2xl mb-2">🟢</div>
                    <p className="font-semibold text-gray-800">Smart Contract</p>
                    <p className="text-sm text-gray-600">Deployed & Active</p>
                  </div>
                  <div className="text-center">
                    <div className="text-green-500 text-2xl mb-2">🟢</div>
                    <p className="font-semibold text-gray-800">Registry Services</p>
                    <p className="text-sm text-gray-600">All Systems Online</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Delete Property Confirmation Modal */}
        {showDeleteModal && propertyToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Property?</h2>
                <p className="text-gray-600">
                  Are you sure you want to delete this property? This action will remove it from your dashboard.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-800 mb-1">Property #{propertyToDelete.id}</p>
                <p className="text-sm text-gray-600">{propertyToDelete.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {propertyToDelete.city}, {propertyToDelete.state}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Due to blockchain immutability, the property record will remain on the blockchain but will be hidden from your dashboard.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPropertyToDelete(null);
                  }}
                  disabled={deletingProperty}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProperty}
                  disabled={deletingProperty}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                >
                  {deletingProperty ? '🔄 Deleting...' : '🗑️ Delete Property'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
