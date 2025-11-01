import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<string>('');

  useEffect(() => {
    checkWalletConnection();
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
          
          const network = await provider.getNetwork();
          setChainId(network.chainId.toString());
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
        
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please make sure MetaMask is installed.');
      }
    } else {
      alert('Please install MetaMask to use this application.');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    setChainId('');
  };

  return (
    <>
      <Head>
        <title>Blockchain Land Registry - Property Management System</title>
        <meta name="description" content="Blockchain-based Land and Property Record Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🏠</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
                  <p className="text-xs text-gray-500">Blockchain-Powered Property Management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Connected Account</p>
                      <p className="text-sm font-mono font-semibold text-gray-700">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400">Chain ID: {chainId}</p>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              India Land Registry System 🇮🇳
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A blockchain-driven property registration system for India, featuring state-wise district management, 
              government verification portal, and comprehensive search capabilities across all Indian states and districts.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tamper-Proof Records</h3>
              <p className="text-gray-600">
                All property records are stored on the blockchain, making them immutable and secure from tampering.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Transparent History</h3>
              <p className="text-gray-600">
                Complete ownership history and transfer records are publicly accessible and verifiable.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Government Verification</h3>
              <p className="text-gray-600">
                Separate government portal for officials to verify properties without wallet requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">�️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">India-Wide Coverage</h3>
              <p className="text-gray-600">
                Complete coverage of all Indian states and districts with location-based search capabilities.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">�</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ID Document Search</h3>
              <p className="text-gray-600">
                Search properties by owner's Aadhaar, PAN, or Passport number for comprehensive verification.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Contracts</h3>
              <p className="text-gray-600">
                Automated processes powered by Ethereum smart contracts for reliability.
              </p>
            </div>
          </div>

          {/* Action Cards */}
          {isConnected ? (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/register-owner">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">👤</div>
                    <h3 className="text-lg font-bold mb-2">Register as Owner</h3>
                    <p className="text-sm text-blue-100">
                      Register yourself to start managing properties
                    </p>
                  </div>
                </Link>

                <Link href="/register-property">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">🏡</div>
                    <h3 className="text-lg font-bold mb-2">Register Property</h3>
                    <p className="text-sm text-green-100">
                      Add a new property to the blockchain
                    </p>
                  </div>
                </Link>

                <Link href="/my-properties">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">📋</div>
                    <h3 className="text-lg font-bold mb-2">My Properties</h3>
                    <p className="text-sm text-purple-100">
                      View and manage your properties
                    </p>
                  </div>
                </Link>

                <Link href="/search">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">🔍</div>
                    <h3 className="text-lg font-bold mb-2">Search Properties</h3>
                    <p className="text-sm text-orange-100">
                      Search by ID, location, or owner details
                    </p>
                  </div>
                </Link>
              </div>

              {/* Additional Navigation */}
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/dashboard">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="text-lg font-bold mb-2">Analytics Dashboard</h3>
                    <p className="text-sm text-indigo-100">
                      View registry statistics and recent activity
                    </p>
                  </div>
                </Link>

                <Link href="/government-portal">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                    <div className="text-3xl mb-3">🏛️</div>
                    <h3 className="text-lg font-bold mb-2">Government Portal</h3>
                    <p className="text-sm text-red-100">
                      Official portal for property verification & transfers
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">🔌</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Please connect your MetaMask wallet to access the Land Registry system
              </p>
              <button
                onClick={connectWallet}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-lg"
              >
                Connect MetaMask
              </button>
            </div>
          )}

          {/* Tech Stack Section */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Built With Modern Technology</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <p className="font-semibold text-gray-700">Next.js</p>
                <p className="text-sm text-gray-500">React Framework</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📘</div>
                <p className="font-semibold text-gray-700">TypeScript</p>
                <p className="text-sm text-gray-500">Type Safety</p>
              </div>
              <div>
                <div className="text-3xl mb-2">⛓️</div>
                <p className="font-semibold text-gray-700">Ethereum</p>
                <p className="text-sm text-gray-500">Blockchain</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎨</div>
                <p className="font-semibold text-gray-700">Tailwind CSS</p>
                <p className="text-sm text-gray-500">Styling</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-16 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-300">
              © 2025 Blockchain Land Registry. Built with Solidity, Hardhat, Ethers.js, and Next.js
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Reducing corruption and disputes in land management through blockchain technology
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
