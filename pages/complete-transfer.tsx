import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../utils/contract';

interface TransferRequest {
    requestId: number;
    propertyId: number;
    fromOwner: string;
    toOwner: string;
    requestDate: number;
    isApproved: boolean;
    isCompleted: boolean;
    transferDocumentHash: string;
    transferFee: bigint;
}

export default function CompleteTransfer() {
    const [account, setAccount] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [myTransferRequests, setMyTransferRequests] = useState<TransferRequest[]>([]);
    const [selectedRequestId, setSelectedRequestId] = useState<number>(0);

    useEffect(() => {
        checkWalletConnection();
    }, []);

    useEffect(() => {
        if (isConnected && account) {
            loadMyTransferRequests();
        }
    }, [isConnected, account]);

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
                setMessage('❌ Failed to connect wallet');
            }
        } else {
            setMessage('❌ Please install MetaMask');
        }
    };

    const loadMyTransferRequests = async () => {
        try {
            const provider = getProvider();
            const contract = getContract(provider);

            // Get transfer request counter
            const counter = await contract.transferRequestCounter();
            const requests: TransferRequest[] = [];

            console.log(`Checking ${counter} transfer requests for account ${account}`);

            // Loop through all requests and find ones involving current user
            for (let i = 1; i <= Number(counter); i++) {
                try {
                    const request = await contract.transferRequests(i);

                    console.log(`Request ${i}:`, {
                        fromOwner: request.fromOwner,
                        toOwner: request.toOwner,
                        isApproved: request.isApproved,
                        isCompleted: request.isCompleted
                    });

                    // Include if user is sender OR receiver, and request is approved but not completed
                    if (
                        (request.fromOwner.toLowerCase() === account.toLowerCase() ||
                            request.toOwner.toLowerCase() === account.toLowerCase()) &&
                        request.isApproved &&
                        !request.isCompleted
                    ) {
                        const propertyDetails = await contract.getPropertyDetails(request.propertyId);

                        requests.push({
                            requestId: i,
                            propertyId: Number(request.propertyId),
                            fromOwner: request.fromOwner,
                            toOwner: request.toOwner,
                            requestDate: Number(request.requestDate),
                            isApproved: request.isApproved,
                            isCompleted: request.isCompleted,
                            transferDocumentHash: request.transferDocumentHash,
                            transferFee: request.transferFee
                        });
                    }
                } catch (error) {
                    // Skip if request doesn't exist
                    continue;
                }
            }

            console.log(`Found ${requests.length} pending transfers`);
            setMyTransferRequests(requests);
        } catch (error) {
            console.error('Error loading transfer requests:', error);
        }
    };

    const handleCompleteTransfer = async (requestId: number) => {
        setLoading(true);
        try {
            setMessage('🔄 Completing transfer...');

            const signer = await getSigner();
            const contract = getContract(signer);

            const tx = await contract.completeTransfer(requestId);

            setMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`);

            const receipt = await tx.wait();
            console.log('Transfer completed:', receipt);

            setMessage('✅ Transfer completed successfully! Property ownership has been transferred.');

            // Reload requests after delay
            setTimeout(() => {
                loadMyTransferRequests();
                setMessage('');
            }, 3000);

        } catch (error: any) {
            console.error('Error completing transfer:', error);

            let errorMessage = 'Failed to complete transfer';

            if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Transaction was rejected by user';
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

    if (!isConnected) {
        return (
            <>
                <Head>
                    <title>Complete Transfer - Land Registry</title>
                </Head>

                <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Complete Property Transfer</h1>
                        <p className="text-gray-600 mb-6">
                            Please connect your wallet to complete property transfers
                        </p>
                        <button
                            onClick={connectWallet}
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                        >
                            Connect Wallet
                        </button>
                        <div className="mt-4">
                            <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Complete Property Transfer - Land Registry</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
                {/* Header */}
                <header className="bg-white shadow-md">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center">
                            <Link href="/" className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">🏠</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
                                    <p className="text-xs text-gray-500">Complete Transfer</p>
                                </div>
                            </Link>

                            <div className="text-right">
                                <p className="text-xs text-gray-500">Connected Account</p>
                                <p className="text-sm font-mono font-semibold text-gray-700">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8">
                    {/* Breadcrumb */}
                    <nav className="flex mb-8" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li>
                                <Link href="/" className="text-gray-500 hover:text-green-600">Home</Link>
                            </li>
                            <li>
                                <span className="text-gray-400 mx-2">/</span>
                                <span className="text-gray-700 font-semibold">Complete Transfer</span>
                            </li>
                        </ol>
                    </nav>

                    {/* Content */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Complete Property Transfer</h2>
                                <p className="text-gray-600">
                                    Finalize approved transfer requests
                                </p>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg mb-6 ${message.includes('✅')
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : message.includes('❌')
                                            ? 'bg-red-50 border border-red-200 text-red-800'
                                            : 'bg-blue-50 border border-blue-200 text-blue-800'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            {myTransferRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">📭</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Pending Transfers</h3>
                                    <p className="text-gray-600 mb-6">
                                        You don't have any approved transfer requests waiting to be completed
                                    </p>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
                                        <h4 className="font-bold text-blue-900 mb-3">📌 What does this mean?</h4>
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <p>✅ <strong>If you're receiving a property:</strong></p>
                                            <ul className="list-disc list-inside ml-4 space-y-1">
                                                <li>The transfer may have already been completed - check "My Properties"</li>
                                                <li>OR the transfer hasn't been approved by government yet</li>
                                                <li>Make sure you're registered as an owner first (visit "Register Owner")</li>
                                            </ul>
                                            
                                            <p className="mt-3">✅ <strong>If you're sending a property:</strong></p>
                                            <ul className="list-disc list-inside ml-4 space-y-1">
                                                <li>The transfer may have already been completed</li>
                                                <li>OR it's still waiting for government approval</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap justify-center gap-3">
                                            <Link
                                                href="/my-properties"
                                                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                                            >
                                                📋 View My Properties
                                            </Link>
                                            <Link
                                                href="/register-owner"
                                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                            >
                                                ✍️ Register as Owner
                                            </Link>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                                            <p className="text-xs text-gray-600 mb-2">
                                                <strong>Your wallet address for receiving properties:</strong>
                                            </p>
                                            <p className="font-mono text-xs bg-white px-3 py-2 rounded border border-gray-300 break-all">
                                                {account}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-blue-800">
                                            ℹ️ <strong>Note:</strong> Either the sender or receiver can complete the transfer.
                                            Once completed, the property ownership will be transferred on the blockchain.
                                        </p>
                                    </div>

                                    {myTransferRequests.map((request) => (
                                        <div key={request.requestId} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                        Transfer Request #{request.requestId}
                                                    </h3>
                                                    <p className="text-gray-600">Property ID: #{request.propertyId}</p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                    ✅ Approved
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">From (Current Owner)</p>
                                                    <p className="font-mono text-sm text-gray-800">{request.fromOwner.slice(0, 20)}...</p>
                                                    {request.fromOwner.toLowerCase() === account.toLowerCase() && (
                                                        <span className="text-xs text-blue-600">(You)</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">To (New Owner)</p>
                                                    <p className="font-mono text-sm text-gray-800">{request.toOwner.slice(0, 20)}...</p>
                                                    {request.toOwner.toLowerCase() === account.toLowerCase() && (
                                                        <span className="text-xs text-blue-600">(You)</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-sm text-gray-500">Request Date</p>
                                                <p className="text-sm text-gray-800">
                                                    {new Date(request.requestDate * 1000).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-sm text-gray-500">Transfer Fee Paid</p>
                                                <p className="text-sm text-gray-800">
                                                    {ethers.formatEther(request.transferFee)} ETH
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleCompleteTransfer(request.requestId)}
                                                disabled={loading}
                                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✅</span>
                                                        <span>Complete Transfer</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
