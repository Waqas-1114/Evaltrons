import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getContract, getSigner, getProvider } from '../utils/contract';
import { getAllStates, getDistrictsByState } from '../data/indiaData';

interface Property {
  propertyId: number;
  propertyAddress: string;
  district: string;
  state: string;
  area: number;
  propertyType: string;
  surveyNumber: string;
  subDivision: string;
  currentOwner: string;
  documentHash: string;
  isRegistered: boolean;
  isVerified: boolean;
  isTransferable: boolean;
  registrationDate: number;
  lastTransferDate: number;
  verificationFee: number;
}

interface Owner {
  ownerAddress: string;
  name: string;
  idDocument: string;
  contactInfo: string;
  homeState: string;
  homeDistrict: string;
  isVerified: boolean;
}

export default function Search() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [searchType, setSearchType] = useState<'property' | 'owner' | 'location' | 'idDocument'>('property');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const [totalProperties, setTotalProperties] = useState(0);
  
  // Location search
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [states] = useState(getAllStates());
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    checkWalletConnection();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedState) {
      const stateDistricts = getDistrictsByState(selectedState);
      setDistricts(stateDistricts);
      setSelectedDistrict('');
    }
  }, [selectedState]);

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

  const loadStats = async () => {
    try {
      const provider = getProvider();
      const contract = getContract(provider);
      
      const total = await contract.getTotalProperties();
      setTotalProperties(Number(total));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setSearching(true);
    setError('');
    setProperty(null);
    setOwner(null);
    setProperties([]);

    try {
      const provider = getProvider();
      const contract = getContract(provider);

      if (searchType === 'property') {
        if (!searchQuery.trim()) {
          setError('Please enter a property ID');
          return;
        }

        const propertyId = parseInt(searchQuery);
        if (isNaN(propertyId) || propertyId <= 0) {
          setError('Please enter a valid property ID (positive number)');
          return;
        }

        try {
          const details = await contract.getPropertyDetails(propertyId);
          
          if (!details.isRegistered) {
            setError('Property not found');
            return;
          }

          setProperty({
            propertyId: propertyId,
            propertyAddress: details.propertyAddress,
            district: details.district,
            state: details.state,
            area: Number(details.area),
            propertyType: details.propertyType,
            surveyNumber: details.surveyNumber,
            subDivision: details.subDivision,
            currentOwner: details.currentOwner,
            documentHash: details.documentHash,
            isRegistered: details.isRegistered,
            isVerified: details.isVerified,
            isTransferable: details.isTransferable,
            registrationDate: Number(details.registrationDate),
            lastTransferDate: Number(details.lastTransferDate),
            verificationFee: Number(details.verificationFee)
          });
        } catch (error) {
          setError('Property not found');
        }
      } else if (searchType === 'owner') {
        if (!searchQuery.trim()) {
          setError('Please enter an owner address');
          return;
        }

        if (!ethers.isAddress(searchQuery)) {
          setError('Please enter a valid Ethereum address');
          return;
        }

        try {
          const ownerDetails = await contract.getOwnerDetails(searchQuery);
          
          if (!ownerDetails.name) {
            setError('Owner not found');
            return;
          }

          setOwner({
            ownerAddress: ownerDetails.ownerAddress,
            name: ownerDetails.name,
            idDocument: ownerDetails.idDocument,
            contactInfo: ownerDetails.contactInfo,
            homeState: ownerDetails.homeState,
            homeDistrict: ownerDetails.homeDistrict,
            isVerified: ownerDetails.isVerified
          });
        } catch (error) {
          setError('Owner not found');
        }
      } else if (searchType === 'location') {
        if (!selectedState) {
          setError('Please select a state');
          return;
        }

        try {
          const propertyIds = await contract.searchPropertiesByLocation(selectedState, selectedDistrict);
          
          if (propertyIds.length === 0) {
            setError('No properties found in the selected location');
            return;
          }

          // Fetch details for each property
          const propertyPromises = propertyIds.map(async (id: any) => {
            const details = await contract.getPropertyDetails(Number(id));
            return {
              propertyId: Number(id),
              propertyAddress: details.propertyAddress,
              district: details.district,
              state: details.state,
              area: Number(details.area),
              propertyType: details.propertyType,
              surveyNumber: details.surveyNumber,
              subDivision: details.subDivision,
              currentOwner: details.currentOwner,
              documentHash: details.documentHash,
              isRegistered: details.isRegistered,
              isVerified: details.isVerified,
              isTransferable: details.isTransferable,
              registrationDate: Number(details.registrationDate),
              lastTransferDate: Number(details.lastTransferDate),
              verificationFee: Number(details.verificationFee)
            };
          });

          const propertiesData = await Promise.all(propertyPromises);
          setProperties(propertiesData);
        } catch (error) {
          setError('Failed to search properties by location');
        }
      } else if (searchType === 'idDocument') {
        if (!searchQuery.trim()) {
          setError('Please enter an ID document number');
          return;
        }

        try {
          const result = await contract.searchPropertiesByOwnerIdDocument(searchQuery);
          
          if (result[0].length === 0) {
            setError('No owners found with this ID document');
            return;
          }

          // For now, show the first owner found
          const ownerAddress = ethers.getAddress(`0x${result[0][0].toString(16).padStart(40, '0')}`);
          const ownerDetails = await contract.getOwnerDetails(ownerAddress);
          
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
          console.error('ID Document search error:', error);
          setError('Failed to search by ID document');
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError('Search failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Search Properties & Owners - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
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
                  <p className="text-xs text-gray-500">Search & Verify</p>
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
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    Connect Wallet
                  </button>
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
                <span className="text-gray-700 font-semibold">Search</span>
              </li>
            </ol>
          </nav>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Public Registry Search</h2>
              <p className="text-gray-600 mb-4">
                Verify property ownership and access public records
              </p>
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold">📊</span>
                <span className="text-blue-800 font-semibold">
                  {totalProperties.toLocaleString()} Properties Registered
                </span>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Search Registry</h2>
              <p className="text-gray-600">
                Look up properties by ID or owners by address
              </p>
            </div>

            {/* Search Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-1">
                <button
                  onClick={() => {
                    setSearchType('property');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setProperties([]);
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                    searchType === 'property'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  🏡 Property ID
                </button>
                <button
                  onClick={() => {
                    setSearchType('owner');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setProperties([]);
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                    searchType === 'owner'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  👤 Owner Address
                </button>
                <button
                  onClick={() => {
                    setSearchType('location');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setProperties([]);
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                    searchType === 'location'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  � By Location
                </button>
                <button
                  onClick={() => {
                    setSearchType('idDocument');
                    setSearchQuery('');
                    setProperty(null);
                    setOwner(null);
                    setProperties([]);
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                    searchType === 'idDocument'
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  🆔 By ID Document
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              {(searchType === 'property' || searchType === 'owner' || searchType === 'idDocument') && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {searchType === 'property' && 'Property ID'}
                    {searchType === 'owner' && 'Owner Wallet Address'}
                    {searchType === 'idDocument' && 'ID Document Number (Aadhaar/PAN/Passport)'}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={
                      searchType === 'property' ? 'e.g., 1' : 
                      searchType === 'owner' ? 'e.g., 0x123...abc' :
                      'e.g., ABCDE1234F'
                    }
                  />
                </div>
              )}

              {searchType === 'location' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
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
                      District (Optional)
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={!selectedState}
                    >
                      <option value="">All Districts</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    {!selectedState && (
                      <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={searching || (searchType !== 'location' && !searchQuery.trim()) || (searchType === 'location' && !selectedState)}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Property Results */}
          {property && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Property #{property.propertyId}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  property.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {property.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Property Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold">{property.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">
                        {property.district}, {property.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Property Type</p>
                      <p className="font-semibold">{property.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold">{property.area.toLocaleString()} sq m</p>
                    </div>
                    {property.surveyNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Survey Number</p>
                        <p className="font-semibold">{property.surveyNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Ownership & History</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Current Owner</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {property.currentOwner}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-semibold">{formatDate(property.registrationDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Transfer</p>
                      <p className="font-semibold">{formatDate(property.lastTransferDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transferable Status</p>
                      <p className={`font-semibold ${
                        property.isTransferable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {property.isTransferable ? '✅ Transferable' : '❌ Not Transferable'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {property.documentHash && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Document Hash</h4>
                  <p className="font-mono text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-all">
                    {property.documentHash}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  href={`/property/${property.propertyId}`}
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  View Full Details & History
                </Link>
              </div>
            </div>
          )}

          {/* Owner Results */}
          {owner && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Owner Profile</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  owner.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {owner.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Owner Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{owner.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Information</p>
                      <p className="font-semibold">{owner.contactInfo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Home Location</p>
                      <p className="font-semibold">{owner.homeDistrict}, {owner.homeState}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Wallet Address</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {owner.ownerAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Verification Status</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">ID Document (Hash)</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {owner.idDocument}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verification</p>
                      <p className={`font-semibold ${
                        owner.isVerified ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {owner.isVerified ? 'Government Verified' : 'Pending Government Verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Properties Results (Location Search) */}
          {properties.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Properties Found ({properties.length})
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <div key={prop.propertyId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Property #{prop.propertyId}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        prop.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prop.isVerified ? '✅' : '⏳'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-semibold">{prop.propertyAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type & Area</p>
                        <p className="text-sm font-semibold">
                          {prop.propertyType} • {prop.area.toLocaleString()} sq m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Owner</p>
                        <p className="text-xs font-mono text-gray-600">
                          {prop.currentOwner.slice(0, 8)}...{prop.currentOwner.slice(-6)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${
                        prop.isTransferable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {prop.isTransferable ? 'Transferable' : 'Not Transferable'}
                      </span>
                      
                      <Link
                        href={`/property/${prop.propertyId}`}
                        className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
