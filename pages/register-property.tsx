import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getContract, getSigner } from '../utils/contract';
import { getAllStates, getDistrictsByState } from '../data/indiaData';

interface Owner {
  ownerAddress: string;
  name: string;
  idDocument: string;
  contactInfo: string;
  homeState: string;
  homeDistrict: string;
  isVerified: boolean;
}

const PROPERTY_TYPES = [
  'Residential',
  'Commercial',
  'Agricultural',
  'Industrial'
];

export default function RegisterProperty() {
  const router = useRouter();
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [propertyData, setPropertyData] = useState({
    address: '',
    district: '',
    state: '',
    area: '',
    propertyType: '',
    surveyNumber: '',
    subDivision: '',
    documentHash: ''
  });

  const [states] = useState(getAllStates());
  const [districts, setDistricts] = useState<string[]>([]);

  // File uploads state
  const [propertyDocument, setPropertyDocument] = useState<File | null>(null);
  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);

  // Verification dialog state
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [registeredPropertyId, setRegisteredPropertyId] = useState<string>('');
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (account) {
      loadOwnerDetails();
    }
  }, [account]);

  useEffect(() => {
    if (propertyData.state) {
      const stateDistricts = getDistrictsByState(propertyData.state);
      setDistricts(stateDistricts);
      setPropertyData(prev => ({ ...prev, district: '' }));
    }
  }, [propertyData.state]);

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

    setLoading(true);
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
          homeState: ownerDetails.homeState,
          homeDistrict: ownerDetails.homeDistrict,
          isVerified: ownerDetails.isVerified
        });
      }
    } catch (error) {
      console.error('Error loading owner details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setPropertyDocument(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview('');
      }
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate total photos (max 5)
    if (propertyPhotos.length + files.length > 5) {
      alert('You can upload maximum 5 photos');
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach(file => {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }

      // Validate file size (max 3MB per photo)
      if (file.size > 3 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 3MB`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPhotosPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setPropertyPhotos(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setPropertyPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = () => {
    setPropertyDocument(null);
    setDocumentPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!owner) {
      alert('Please register as an owner first');
      return;
    }

    if (!propertyData.address || !propertyData.district || !propertyData.state || !propertyData.area || !propertyData.propertyType) {
      setMessage('❌ Please fill in all required fields');
      return;
    }

    if (!propertyDocument) {
      setMessage('❌ Please upload a property document');
      return;
    }

    // Generate document hash from uploaded files
    let documentHash = 'QmPropertyDocument'; // Placeholder
    if (propertyDocument || propertyPhotos.length > 0) {
      // In production, you would upload to IPFS and get the hash
      // For now, we'll create a simple hash
      const timestamp = Date.now();
      documentHash = `Qm${timestamp}${propertyDocument?.name || 'docs'}`;

      // Store files in localStorage (convert to base64)
      // In production, upload to IPFS and use the IPFS hash
      const propertyFiles: any = {
        timestamp: timestamp
      };

      // Store document
      if (propertyDocument && documentPreview) {
        propertyFiles.document = documentPreview;
      }

      // Store photos
      if (propertyPhotos.length > 0) {
        propertyFiles.photos = photosPreviews;
      }

      // Save to localStorage
      try {
        localStorage.setItem(`property_files_${documentHash}`, JSON.stringify(propertyFiles));
      } catch (error) {
        console.error('Error saving files to localStorage:', error);
        setMessage('⚠️ Warning: Could not save files locally, but property will still be registered');
      }
    }

    setRegistering(true);
    setMessage('📤 Uploading documents and registering property...');

    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      const tx = await contract.registerProperty(
        propertyData.address,
        propertyData.district,
        propertyData.state,
        ethers.parseUnits(propertyData.area, 0), // Convert to BigNumber
        propertyData.propertyType,
        propertyData.surveyNumber || '',
        propertyData.subDivision || '',
        documentHash
      );

      console.log('Transaction sent:', tx.hash);
      setMessage('⏳ Property registration transaction sent! Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      // Extract property ID from transaction logs or events
      let propertyId = '0';

      try {
        // Try to parse events from the receipt
        if (receipt && receipt.logs && receipt.logs.length > 0) {
          // Get the property ID from the first log topic (event emission)
          const log = receipt.logs[0];
          if (log && log.topics && log.topics.length > 1) {
            // Convert hex to decimal
            propertyId = parseInt(log.topics[1], 16).toString();
          }
        }

        // Fallback: get total properties from contract
        if (propertyId === '0') {
          const totalProperties = await contract.getTotalProperties();
          propertyId = totalProperties.toString();
        }
      } catch (error) {
        console.error('Error extracting property ID:', error);
        // Use timestamp as fallback
        propertyId = Date.now().toString();
      }

      setRegisteredPropertyId(propertyId);

      setMessage('✅ Property registered successfully!');

      // Show verification dialog
      setShowVerificationDialog(true);

    } catch (error: any) {
      console.error('Error registering property:', error);

      let errorMessage = 'Failed to register property';

      if (error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in wallet to complete transaction';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        // Extract meaningful error from message
        const match = error.message.match(/reason="([^"]+)"/);
        if (match) {
          errorMessage = match[1];
        } else {
          errorMessage = error.message.substring(0, 100);
        }
      }

      setMessage('❌ ' + errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleSendForVerification = async () => {
    setSendingVerification(true);
    setMessage('📝 Sending property for verification...');

    try {
      const signer = await getSigner();
      const contract = getContract(signer);

      // Get verification fee from contract
      const verificationFee = await contract.VERIFICATION_FEE();

      const tx = await contract.requestPropertyVerification(
        registeredPropertyId,
        { value: verificationFee }
      );

      console.log('Verification request sent:', tx.hash);
      setMessage('⏳ Verification request transaction sent! Waiting for confirmation...');

      await tx.wait();
      setMessage('✅ Property sent for verification! Redirecting to dashboard...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error sending for verification:', error);

      let errorMessage = 'Failed to send for verification';

      if (error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in wallet. Need at least 0.001 ETH for verification fee plus gas';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        // Extract meaningful error from message
        const match = error.message.match(/reason="([^"]+)"/);
        if (match) {
          errorMessage = match[1];
        } else {
          errorMessage = error.message.substring(0, 100);
        }
      }

      setMessage('❌ ' + errorMessage);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Register Property - Land Registry</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <div className="text-5xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your MetaMask wallet to register properties
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
        <title>Register Property - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
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
                  <p className="text-xs text-gray-500">Register Property</p>
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
                <span className="text-gray-700 font-semibold">Register Property</span>
              </li>
            </ol>
          </nav>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading owner information...</span>
            </div>
          ) : !owner ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Owner Registration Required</h3>
              <p className="text-gray-600 mb-6">
                You need to register as an owner before you can register properties
              </p>
              <Link
                href="/register-owner"
                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Register as Owner
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Owner Status */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Owner: {owner.name}</h2>
                    <p className="text-gray-600">Contact: {owner.contactInfo}</p>
                    <p className="text-gray-600">Location: {owner.homeDistrict}, {owner.homeState}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${owner.isVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {owner.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🏡</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Register New Property</h2>
                  <p className="text-gray-600">
                    Add a new property to the blockchain registry
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Property Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={propertyData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 123 Main Street"
                      required
                    />
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        name="state"
                        value={propertyData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        District *
                      </label>
                      <select
                        name="district"
                        value={propertyData.district}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={!propertyData.state}
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      {!propertyData.state && (
                        <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                      )}
                    </div>
                  </div>

                  {/* Property Type and Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <select
                        name="propertyType"
                        value={propertyData.propertyType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Property Type</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Survey Number
                      </label>
                      <input
                        type="text"
                        name="surveyNumber"
                        value={propertyData.surveyNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Survey No. 123/4"
                      />
                    </div>
                  </div>

                  {/* Sub Division */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Division (if any)
                    </label>
                    <input
                      type="text"
                      name="subDivision"
                      value={propertyData.subDivision}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Plot A, Block 1"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Area (Square Meters) *
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={propertyData.area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 1000"
                      min="1"
                      required
                    />
                  </div>

                  {/* Property Document Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Document *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition">
                      {!propertyDocument ? (
                        <div className="text-center">
                          <div className="text-4xl mb-2">📄</div>
                          <label className="cursor-pointer">
                            <span className="text-primary-600 hover:text-primary-700 font-semibold">
                              Click to upload property document
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleDocumentUpload}
                              className="hidden"
                              required
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            PDF or Image (JPG, PNG) - Max 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {documentPreview ? (
                              <img src={documentPreview} alt="Document preview" className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">{propertyDocument.name}</p>
                              <p className="text-xs text-gray-500">
                                {(propertyDocument.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeDocument}
                            className="text-red-600 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Photos Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Photos (Optional - Max 5)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition">
                      {propertyPhotos.length < 5 && (
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">📸</div>
                          <label className="cursor-pointer">
                            <span className="text-primary-600 hover:text-primary-700 font-semibold">
                              Click to upload property photos
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotosUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Images only - Max 3MB each - {5 - propertyPhotos.length} remaining
                          </p>
                        </div>
                      )}

                      {propertyPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {photosPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Property photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {propertyPhotos[index].name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Display */}
                  {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅')
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : message.includes('❌')
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-blue-50 border border-blue-200 text-blue-800'
                      }`}>
                      <p className="font-semibold">{message}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-between items-center pt-6">
                    <Link
                      href="/"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={registering}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {registering ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>🏡</span>
                          <span>Register Property</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* Verification Dialog Modal */}
        {showVerificationDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Property Registered!
                </h3>
                <p className="text-gray-600">
                  Your property has been successfully registered on the blockchain.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Property ID:</strong> #{registeredPropertyId.toString()}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Would you like to send this property for verification by a government officer?
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800">Fast Verification</p>
                    <p className="text-sm text-gray-600">Get verified by state officials</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800">Enable Transfers</p>
                    <p className="text-sm text-gray-600">Verified properties can be transferred</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800">Official Recognition</p>
                    <p className="text-sm text-gray-600">Get government authentication</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Verification requires a small fee (0.001 ETH) and will be processed by government officers in your state and district.
                </p>
              </div>

              {message && message.includes('verification') && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('✅')
                  ? 'bg-green-50 text-green-800'
                  : message.includes('❌')
                    ? 'bg-red-50 text-red-800'
                    : 'bg-blue-50 text-blue-800'
                  }`}>
                  {message}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleBackToHome}
                  disabled={sendingVerification}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
                >
                  Back to Home
                </button>
                <button
                  onClick={handleSendForVerification}
                  disabled={sendingVerification}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {sendingVerification ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      <span>Send for Verification</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                You can also send for verification later from your dashboard
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
