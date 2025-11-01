import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getProvider, getContract } from '@/utils/contract';

export default function VerifyOwner() {
    const [address, setAddress] = useState('');
    const [ownerData, setOwnerData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkOwner = async () => {
        if (!address) return;

        setLoading(true);
        setError('');
        setOwnerData(null);

        try {
            const provider = getProvider();
            const contract = getContract(provider);

            console.log('Checking owner:', address);
            const result = await contract.getOwnerDetails(address);

            console.log('Owner details:', result);
            setOwnerData({
                ownerAddress: result.ownerAddress,
                name: result.name,
                idDocument: result.idDocument,
                contactInfo: result.contactInfo,
                isVerified: result.isVerified
            });
        } catch (err: any) {
            console.error('Error:', err);
            setError('Owner not found or not registered');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Verify Owner - Land Registry</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
                <header className="bg-white shadow-md">
                    <div className="container mx-auto px-4 py-4">
                        <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
                            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🔍</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Verify Owner Registration</h1>
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-12 max-w-2xl">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Check Owner Registration</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Owner Address
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC"
                                    />
                                    <button
                                        onClick={checkOwner}
                                        disabled={loading || !address}
                                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50"
                                    >
                                        {loading ? 'Checking...' : 'Check'}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-lg bg-red-50 text-red-800">
                                    {error}
                                </div>
                            )}

                            {ownerData && (
                                <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                                    <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Owner Found!</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Address:</strong> {ownerData.ownerAddress}</div>
                                        <div><strong>Name:</strong> {ownerData.name}</div>
                                        <div><strong>ID Document:</strong> {ownerData.idDocument}</div>
                                        <div><strong>Contact:</strong> {ownerData.contactInfo}</div>
                                        <div><strong>Verified:</strong>
                                            <span className={`ml-1 px-2 py-1 rounded text-xs ${ownerData.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {ownerData.isVerified ? 'Verified' : 'Pending Verification'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 text-center">
                            <Link href="/" className="text-primary-600 hover:text-primary-700">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
