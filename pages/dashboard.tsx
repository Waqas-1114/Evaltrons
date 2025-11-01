import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getProvider } from '../utils/contract';

interface DashboardStats {
  totalProperties: number;
  totalTransfers: number;
  verifiedProperties: number;
  pendingVerifications: number;
  recentProperties: any[];
  recentTransfers: any[];
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

      for (let i = Math.max(1, totalProperties - 9); i <= totalProperties; i++) {
        try {
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

      setStats({
        totalProperties,
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
              
              <Link
                href="/"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Back to Home
              </Link>
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
                      <div className={`text-6xl font-bold mb-2 ${
                        parseFloat(verificationRate) >= 80 ? 'text-green-500' :
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
                        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-800">#{property.id}</p>
                            <p className="text-sm text-gray-600 truncate max-w-48">
                              {property.address}
                            </p>
                            <p className="text-xs text-gray-500">
                              {property.city}, {property.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              property.verified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {property.verified ? 'Verified' : 'Pending'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(property.registrationDate)}
                            </p>
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
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              transfer.completed
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
      </div>
    </>
  );
}
