import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getSigner, getContract } from '@/utils/contract';

export default function RegisterOwner() {
  const [formData, setFormData] = useState({
    name: '',
    idDocument: '',
    contactInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('Starting registration...');
      console.log('Contract Address:', process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS);
      
      // Check network first
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        console.log('Current Chain ID:', chainId);
        
        if (chainId !== '0x539') { // 0x539 = 1337 in hex
          console.log('Wrong network detected, trying to switch...');
          try {
            // Try to switch to Ganache network
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }], // 1337 in hex
            });
            console.log('Successfully switched to Ganache network');
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Network not added to MetaMask, try to add it
              try {
                await (window as any).ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x539',
                    chainName: 'Ganache Local',
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                  }],
                });
                console.log('Successfully added and switched to Ganache network');
              } catch (addError) {
                setMessage('❌ Please manually switch to Ganache Local network in MetaMask');
                setLoading(false);
                return;
              }
            } else {
              setMessage('❌ Please manually switch to Ganache Local network in MetaMask');
              setLoading(false);
              return;
            }
          }
        }
      }
      
      const signer = await getSigner();
      console.log('Signer obtained:', await signer.getAddress());
      
      const contract = getContract(signer);
      console.log('Contract instance created');

      console.log('Calling registerOwner with:', formData);
      const tx = await contract.registerOwner(
        formData.name,
        formData.idDocument,
        formData.contactInfo
      );

      console.log('Transaction submitted:', tx.hash);
      setMessage(`Transaction submitted: ${tx.hash}. Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setMessage('✅ Successfully registered as owner!');
      setFormData({ name: '', idDocument: '', contactInfo: '' });
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error reason:', error.reason);

      let errorMessage = 'Transaction failed';
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Make sure you\'re on Ganache Local network.';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Contract execution failed. Check if contract is deployed correctly.';
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

  return (
    <>
      <Head>
        <title>Register as Owner - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏠</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Land Registry</h1>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Register as Owner</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Document Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.idDocument}
                  onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="National ID or Passport Number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Information *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Email or Phone Number"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Register as Owner'}
              </button>
            </form>

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
