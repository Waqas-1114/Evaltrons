import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../utils/contract';
import { getAllStates, getDistrictsByState } from '../data/indiaData';

interface Property {
    propertyId: number;
    propertyAddress: string;
    district: string;
    state: string;
    isVerified: boolean;
    isTransferable: boolean;
}

export default function RequestTransfer() {
    const router = useRouter();
    const [account, setAccount] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Property selection
    const [myProperties, setMyProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number>(0);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Transfer form
    const [receiverAddress, setReceiverAddress] = useState('');
    const [transferDocument, setTransferDocument] = useState<File | null>(null);
    const [transferDocumentPreview, setTransferDocumentPreview] = useState<string>('');
    const [transferFee, setTransferFee] = useState('0.002');

    const states = getAllStates();

    useEffect(() => {
        checkWalletConnection();
    }, []);

    useEffect(() => {
        if (isConnected && account) {
            loadMyProperties();
        }
    }, [isConnected, account]);

    useEffect(() => {
        if (selectedPropertyId > 0) {
            const property = myProperties.find(p => p.propertyId === selectedPropertyId);
            setSelectedProperty(property || null);
        }
    }, [selectedPropertyId, myProperties]);

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

    const loadMyProperties = async () => {
        try {
            const provider = getProvider();
            const contract = getContract(provider);

            const propertyIds = await contract.getOwnerProperties(account);
            const properties: Property[] = [];

            for (const id of propertyIds) {
                const details = await contract.getPropertyDetails(Number(id));
                properties.push({
                    propertyId: Number(id),
                    propertyAddress: details.propertyAddress,
                    district: details.district,
                    state: details.state,
                    isVerified: details.isVerified,
                    isTransferable: details.isTransferable
                });
            }

            setMyProperties(properties.filter(p => p.isVerified && p.isTransferable));
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage('❌ Document file size must be less than 5MB');
                return;
            }

            setTransferDocument(file);

            // Create preview for PDFs and images
            const reader = new FileReader();
            reader.onloadend = () => {
                setTransferDocumentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPropertyId) {
            setMessage('❌ Please select a property');
            return;
        }

        if (!receiverAddress || !ethers.isAddress(receiverAddress)) {
            setMessage('❌ Please enter a valid receiver address');
            return;
        }

        if (receiverAddress.toLowerCase() === account.toLowerCase()) {
            setMessage('❌ Cannot transfer to yourself');
            return;
        }

        if (!transferDocument) {
            setMessage('❌ Please upload transfer document');
            return;
        }

        setLoading(true);
        try {
            setMessage('🔄 Preparing transfer request...');

            // Generate document hash (in production, upload to IPFS)
            const documentHash = ethers.keccak256(ethers.toUtf8Bytes(transferDocument.name + Date.now()));

            // Store only document metadata (not the full file to avoid quota issues)
            // In production, upload to IPFS and use the IPFS hash
            const metadata = {
                name: transferDocument.name,
                size: transferDocument.size,
                type: transferDocument.type,
                timestamp: Date.now()
            };
            localStorage.setItem(`transfer_doc_${documentHash}`, JSON.stringify(metadata));

            setMessage('🔄 Requesting MetaMask approval...');

            const signer = await getSigner();
            const contract = getContract(signer);

            // Create transfer request with fee
            const feeInWei = ethers.parseEther(transferFee);
            const tx = await contract.createTransferRequest(
                selectedPropertyId,
                receiverAddress,
                documentHash,
                { value: feeInWei }
            );

            setMessage(`⏳ Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`);

            const receipt = await tx.wait();
            console.log('Transfer request created:', receipt);

            setMessage(
                `✅ Transfer request submitted successfully! ` +
                `Transfer fee of ${transferFee} ETH has been paid. ` +
                `The request will be sent to government officers in ${selectedProperty?.district}, ${selectedProperty?.state} for approval.`
            );

            // Reset form after delay
            setTimeout(() => {
                router.push('/my-properties');
            }, 4000);

        } catch (error: any) {
            console.error('Error creating transfer request:', error);

            let errorMessage = 'Failed to create transfer request';

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
                    <title>Request Transfer - Land Registry</title>
                </Head>

                <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="text-5xl mb-4">🔄</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Request Property Transfer</h1>
                        <p className="text-gray-600 mb-6">
                            Please connect your wallet to request property transfer
                        </p>
                        <button
                            onClick={connectWallet}
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
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
                <title>Request Property Transfer - Land Registry</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
                {/* Header */}
                <header className="bg-white shadow-md">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center">
                            <Link href="/" className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">🏠</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
                                    <p className="text-xs text-gray-500">Request Transfer</p>
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
                                <Link href="/" className="text-gray-500 hover:text-purple-600">Home</Link>
                            </li>
                            <li>
                                <span className="text-gray-400 mx-2">/</span>
                                <Link href="/my-properties" className="text-gray-500 hover:text-purple-600">My Properties</Link>
                            </li>
                            <li>
                                <span className="text-gray-400 mx-2">/</span>
                                <span className="text-gray-700 font-semibold">Request Transfer</span>
                            </li>
                        </ol>
                    </nav>

                    {/* Form */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="text-5xl mb-4">🔄</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Request Property Transfer</h2>
                                <p className="text-gray-600">
                                    Transfer your verified property to a new owner
                                </p>
                            </div>

                            {myProperties.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">📭</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Transferable Properties</h3>
                                    <p className="text-gray-600 mb-6">
                                        You don't have any verified and transferable properties
                                    </p>
                                    <Link
                                        href="/my-properties"
                                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                                    >
                                        View My Properties
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Property Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Property to Transfer *
                                        </label>
                                        <select
                                            value={selectedPropertyId}
                                            onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value={0}>Choose a property</option>
                                            {myProperties.map((property) => (
                                                <option key={property.propertyId} value={property.propertyId}>
                                                    Property #{property.propertyId} - {property.propertyAddress} ({property.district}, {property.state})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedProperty && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-800 mb-2">Selected Property Details:</h4>
                                            <p className="text-sm text-blue-700"><strong>Address:</strong> {selectedProperty.propertyAddress}</p>
                                            <p className="text-sm text-blue-700"><strong>Location:</strong> {selectedProperty.district}, {selectedProperty.state}</p>
                                            <p className="text-sm text-blue-700"><strong>Status:</strong> ✅ Verified & Transferable</p>
                                        </div>
                                    )}

                                    {/* Receiver Address */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Receiver Wallet Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={receiverAddress}
                                            onChange={(e) => setReceiverAddress(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                                            placeholder="0x..."
                                            required
                                        />
                                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-800">
                                                ℹ️ <strong>Note:</strong> The receiver doesn't need to be registered yet.
                                                After government approval, they can log in with this wallet address to acknowledge and complete the transfer.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transfer Document */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Transfer Document *
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition">
                                            <input
                                                type="file"
                                                onChange={handleDocumentChange}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                id="transfer-document"
                                                required
                                            />
                                            <label htmlFor="transfer-document" className="cursor-pointer">
                                                <div className="text-4xl mb-2">📄</div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                                    {transferDocument ? transferDocument.name : 'Upload Transfer Document'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PDF, JPG, or PNG (Max 5MB)
                                                </p>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Upload sale deed, transfer agreement, or other legal documents
                                        </p>
                                    </div>

                                    {/* Transfer Fee Info */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-yellow-800 mb-2">💰 Transfer Fee</h4>
                                        <p className="text-sm text-yellow-700 mb-2">
                                            A transfer fee of <strong>{transferFee} ETH</strong> will be charged for government verification.
                                        </p>
                                        <p className="text-xs text-yellow-600">
                                            This fee will be paid to the government officer who verifies and approves your transfer request.
                                        </p>
                                    </div>

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

                                    <button
                                        type="submit"
                                        disabled={loading || !selectedPropertyId || !receiverAddress || !transferDocument}
                                        className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🔄</span>
                                                <span>Submit Transfer Request</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
