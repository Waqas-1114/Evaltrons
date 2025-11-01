import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getContract, getProvider } from '../utils/contract';

interface VerificationRequest {
  verificationId: number;
  propertyId: number;
  propertyOwner: string;
  requestDate: number;
  feePaid: number;
  isPending: boolean;
  isApproved: boolean;
  officerEmployeeId: string;
  verificationNotes: string;
}

interface TransferRequest {
  requestId: number;
  propertyId: number;
  fromOwner: string;
  toOwner: string;
  requestDate: number;
  isApproved: boolean;
  isCompleted: boolean;
  transferDocumentHash: string;
  transferFee: number;
}

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

export default function GovernmentPortal() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState('');
  const [loginDistrict, setLoginDistrict] = useState('');
  const [currentOfficer, setCurrentOfficer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'verification' | 'transfer' | 'properties'>('verification');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Data states
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<Owner | null>(null);
  
  // Properties view states
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [verificationNotes, setVerificationNotes] = useState('');
  const [approvalDecision, setApprovalDecision] = useState<boolean | null>(null);
  
  // Document and photo viewing states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  // Mock property documents and photos (in real system, these would come from IPFS/blockchain)
  const [propertyDocumentUrl, setPropertyDocumentUrl] = useState<string>('');
  const [propertyPhotos, setPropertyPhotos] = useState<string[]>([]);

  // Mock government officers (in real system, this would be from a secure database)
  const GOVERNMENT_OFFICERS = {
    'GVT001': { 
      name: 'Rajesh Kumar', 
      department: 'Land Revenue', 
      state: 'Maharashtra', 
      district: 'Mumbai',
      password: 'admin123'
    },
    'GVT002': { 
      name: 'Priya Sharma', 
      department: 'Registration', 
      state: 'Delhi', 
      district: 'Central Delhi',
      password: 'admin123'
    },
    'GVT003': { 
      name: 'Amit Singh', 
      department: 'Revenue', 
      state: 'Uttar Pradesh', 
      district: 'Lucknow',
      password: 'admin123'
    },
    'GVT004': { 
      name: 'Sanjay Mukherjee', 
      department: 'Land Records', 
      state: 'West Bengal', 
      district: 'Kolkata',
      password: 'admin123'
    }
  };

  // Indian states and districts for login selection
  const STATES_DISTRICTS: { [key: string]: string[] } = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Delhi': ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri', 'Durgapur'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem']
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'properties') {
        loadAllProperties();
      } else {
        loadPendingRequests();
      }
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginState || !loginDistrict) {
      setMessage('❌ Please select both state and district');
      return;
    }
    
    const officer = GOVERNMENT_OFFICERS[employeeId as keyof typeof GOVERNMENT_OFFICERS];
    if (officer && officer.password === password) {
      setCurrentOfficer({ 
        ...officer, 
        employeeId,
        selectedState: loginState,
        selectedDistrict: loginDistrict
      });
      setIsLoggedIn(true);
      setMessage(`✅ Login successful! Viewing properties in ${loginDistrict}, ${loginState}.`);
    } else {
      setMessage('❌ Invalid credentials. Please check your Employee ID and password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmployeeId('');
    setPassword('');
    setLoginState('');
    setLoginDistrict('');
    setCurrentOfficer(null);
    setMessage('');
    setSelectedRequest(null);
    setPropertyDetails(null);
    setOwnerDetails(null);
    setSelectedProperty(null);
    setAllProperties([]);
    setFilteredProperties([]);
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      // Get list of deleted properties from localStorage
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');

      if (activeTab === 'verification') {
        const pendingIds = await contract.getPendingVerificationRequests();
        const requests = [];

        for (const id of pendingIds) {
          const request = await contract.getVerificationRequestDetails(Number(id));
          const propertyId = Number(request.propertyId);
          
          // Skip if property is deleted
          if (deletedProperties.includes(propertyId)) {
            continue;
          }
          
          requests.push({
            verificationId: Number(id),
            propertyId: propertyId,
            propertyOwner: request.propertyOwner,
            requestDate: Number(request.requestDate),
            feePaid: Number(request.feePaid),
            isPending: request.isPending,
            isApproved: request.isApproved,
            officerEmployeeId: request.officerEmployeeId,
            verificationNotes: request.verificationNotes
          });
        }

        setVerificationRequests(requests);
      } else {
        const pendingIds = await contract.getPendingTransferRequests();
        const requests = [];

        for (const id of pendingIds) {
          const request = await contract.getTransferRequestDetails(Number(id));
          const propertyId = Number(request.propertyId);
          
          // Skip if property is deleted
          if (deletedProperties.includes(propertyId)) {
            continue;
          }
          
          requests.push({
            requestId: Number(id),
            propertyId: propertyId,
            fromOwner: request.fromOwner,
            toOwner: request.toOwner,
            requestDate: Number(request.requestDate),
            isApproved: request.isApproved,
            isCompleted: request.isCompleted,
            transferDocumentHash: request.transferDocumentHash,
            transferFee: Number(request.transferFee)
          });
        }

        setTransferRequests(requests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setMessage('❌ Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAllProperties = async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const totalProperties = await contract.getTotalProperties();
      const properties: Property[] = [];

      // Get list of deleted properties from localStorage
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');

      // Load all properties
      for (let i = 1; i <= Number(totalProperties); i++) {
        try {
          // Skip if property is deleted
          if (deletedProperties.includes(i)) {
            continue;
          }
          
          const propDetails = await contract.getPropertyDetails(i);
          properties.push({
            propertyId: i,
            propertyAddress: propDetails.propertyAddress,
            district: propDetails.district,
            state: propDetails.state,
            area: Number(propDetails.area),
            propertyType: propDetails.propertyType,
            surveyNumber: propDetails.surveyNumber,
            subDivision: propDetails.subDivision,
            currentOwner: propDetails.currentOwner,
            documentHash: propDetails.documentHash,
            isRegistered: propDetails.isRegistered,
            isVerified: propDetails.isVerified,
            isTransferable: propDetails.isTransferable,
            registrationDate: Number(propDetails.registrationDate),
            lastTransferDate: Number(propDetails.lastTransferDate),
            verificationFee: Number(propDetails.verificationFee)
          });
        } catch (error) {
          console.error(`Error loading property ${i}:`, error);
        }
      }

      setAllProperties(properties);
      
      // Auto-filter by officer's selected state and district
      if (currentOfficer?.selectedState && currentOfficer?.selectedDistrict) {
        const filtered = properties.filter(p => 
          p.state.toLowerCase() === currentOfficer.selectedState.toLowerCase() &&
          p.district.toLowerCase() === currentOfficer.selectedDistrict.toLowerCase()
        );
        setFilteredProperties(filtered);
      } else {
        setFilteredProperties(properties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setMessage('❌ Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFilter = (query: string) => {
    setSearchQuery(query);
    applyFilters(query);
  };

  const applyFilters = (query: string) => {
    let filtered = [...allProperties];

    // Filter by officer's selected state and district
    if (currentOfficer?.selectedState && currentOfficer?.selectedDistrict) {
      filtered = filtered.filter(p => 
        p.state.toLowerCase() === currentOfficer.selectedState.toLowerCase() &&
        p.district.toLowerCase() === currentOfficer.selectedDistrict.toLowerCase()
      );
    }

    // Filter by search query (address or property ID)
    if (query) {
      filtered = filtered.filter(p =>
        p.propertyAddress.toLowerCase().includes(query.toLowerCase()) ||
        p.propertyId.toString().includes(query)
      );
    }

    setFilteredProperties(filtered);
  };

  const viewPropertyDetails = async (property: Property) => {
    // Check if property is deleted
    const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
    if (deletedProperties.includes(property.propertyId)) {
      setMessage('❌ This property has been deleted and cannot be viewed.');
      return;
    }
    
    setSelectedProperty(property);
    
    // Load owner details
    try {
      const provider = getProvider();
      const contract = getContract(provider);
      const owner = await contract.getOwnerDetails(property.currentOwner);
      
      setOwnerDetails({
        ownerAddress: owner.ownerAddress,
        name: owner.name,
        idDocument: owner.idDocument,
        contactInfo: owner.contactInfo,
        homeState: owner.homeState,
        homeDistrict: owner.homeDistrict,
        isVerified: owner.isVerified
      });
    } catch (error) {
      console.error('Error loading owner details:', error);
    }
  };

  const loadPropertyDocumentsAndPhotos = (propertyId: number) => {
    // In a real system, these would be fetched from IPFS/decentralized storage
    // For demo purposes, we retrieve from localStorage using the property's documentHash
    
    if (propertyDetails?.documentHash) {
      try {
        const storedFiles = localStorage.getItem(`property_files_${propertyDetails.documentHash}`);
        
        if (storedFiles) {
          const files = JSON.parse(storedFiles);
          
          // Set the actual document uploaded by owner
          if (files.document) {
            setPropertyDocumentUrl(files.document);
          } else {
            // Fallback to dummy if no document found
            setPropertyDocumentUrl(`https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`);
          }
          
          // Set the actual photos uploaded by owner
          if (files.photos && files.photos.length > 0) {
            setPropertyPhotos(files.photos);
          } else {
            // Fallback to empty array if no photos found
            setPropertyPhotos([]);
          }
        } else {
          // No files stored - set empty/fallback
          console.log('No files found for documentHash:', propertyDetails.documentHash);
          setPropertyDocumentUrl('');
          setPropertyPhotos([]);
        }
      } catch (error) {
        console.error('Error loading property files:', error);
        setPropertyDocumentUrl('');
        setPropertyPhotos([]);
      }
    } else {
      setPropertyDocumentUrl('');
      setPropertyPhotos([]);
    }
  };

  const loadRequestDetails = async (request: any) => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const propertyId = activeTab === 'verification' ? request.propertyId : request.propertyId;
      
      // Check if property is deleted
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
      if (deletedProperties.includes(propertyId)) {
        setMessage('❌ This property has been deleted and cannot be viewed or approved.');
        setLoading(false);
        return;
      }
      
      // Load property details
      const propDetails = await contract.getPropertyDetails(propertyId);
      setPropertyDetails({
        propertyId: propertyId,
        propertyAddress: propDetails.propertyAddress,
        district: propDetails.district,
        state: propDetails.state,
        area: Number(propDetails.area),
        propertyType: propDetails.propertyType,
        surveyNumber: propDetails.surveyNumber,
        subDivision: propDetails.subDivision,
        currentOwner: propDetails.currentOwner,
        documentHash: propDetails.documentHash,
        isRegistered: propDetails.isRegistered,
        isVerified: propDetails.isVerified,
        isTransferable: propDetails.isTransferable,
        registrationDate: Number(propDetails.registrationDate),
        lastTransferDate: Number(propDetails.lastTransferDate),
        verificationFee: Number(propDetails.verificationFee)
      });

      // Load owner details
      const ownerAddress = activeTab === 'verification' ? request.propertyOwner : request.fromOwner;
      const owner = await contract.getOwnerDetails(ownerAddress);
      setOwnerDetails({
        ownerAddress: owner.ownerAddress,
        name: owner.name,
        idDocument: owner.idDocument,
        contactInfo: owner.contactInfo,
        homeState: owner.homeState,
        homeDistrict: owner.homeDistrict,
        isVerified: owner.isVerified
      });

      // Load mock property documents and photos
      // In a real system, these would be fetched from IPFS using the documentHash
      loadPropertyDocumentsAndPhotos(propertyId);

      setSelectedRequest(request);
    } catch (error) {
      console.error('Error loading request details:', error);
      setMessage('❌ Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProperty = async () => {
    if (approvalDecision === null) {
      setMessage('❌ Please select approve or reject');
      return;
    }

    // Check if property is deleted before allowing verification
    if (propertyDetails) {
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
      if (deletedProperties.includes(propertyDetails.propertyId)) {
        setMessage('❌ This property has been deleted and cannot be verified.');
        return;
      }
    }

    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      // In a real implementation, this would require the government officer's signature
      // For demo purposes, we'll show what the transaction would look like
      setMessage('🔄 In a real system, this would submit the verification decision to the blockchain...');
      
      // Simulate processing time
      setTimeout(() => {
        setMessage(
          approvalDecision 
            ? '✅ Property verification approved! The decision has been recorded on the blockchain.'
            : '❌ Property verification rejected. The decision has been recorded with notes.'
        );
        
        // Reset form
        setApprovalDecision(null);
        setVerificationNotes('');
        setSelectedRequest(null);
        setPropertyDetails(null);
        setOwnerDetails(null);
        
        // Reload requests
        loadPendingRequests();
      }, 2000);

    } catch (error) {
      console.error('Error processing verification:', error);
      setMessage('❌ Failed to process verification');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransfer = async () => {
    // Check if property is deleted before allowing transfer approval
    if (propertyDetails) {
      const deletedProperties = JSON.parse(localStorage.getItem('deleted_properties') || '[]');
      if (deletedProperties.includes(propertyDetails.propertyId)) {
        setMessage('❌ This property has been deleted and transfers cannot be approved.');
        return;
      }
    }

    setLoading(true);
    try {
      setMessage('🔄 In a real system, this would approve the transfer request on the blockchain...');
      
      // Simulate processing time
      setTimeout(() => {
        setMessage('✅ Transfer request approved! The parties can now complete the transfer.');
        
        // Reset
        setSelectedRequest(null);
        setPropertyDetails(null);
        setOwnerDetails(null);
        
        // Reload requests
        loadPendingRequests();
      }, 2000);

    } catch (error) {
      console.error('Error approving transfer:', error);
      setMessage('❌ Failed to approve transfer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatEther = (wei: number) => {
    return (wei / 1e18).toFixed(4);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Head>
          <title>Government Portal - Land Registry</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🏛️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Government Portal</h1>
              <p className="text-gray-600">Secure access for government officials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., GVT001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select State *
                </label>
                <select
                  value={loginState}
                  onChange={(e) => {
                    setLoginState(e.target.value);
                    setLoginDistrict(''); // Reset district when state changes
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose your jurisdiction state</option>
                  {Object.keys(STATES_DISTRICTS).map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select District *
                </label>
                <select
                  value={loginDistrict}
                  onChange={(e) => setLoginDistrict(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={!loginState}
                  required
                >
                  <option value="">Choose your jurisdiction district</option>
                  {loginState && STATES_DISTRICTS[loginState]?.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {!loginState && (
                  <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                )}
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Login to Portal
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Employee ID:</strong> GVT001, GVT002, GVT003, GVT004</p>
                <p><strong>Password:</strong> admin123 (for all)</p>
                <p className="mt-2 pt-2 border-t border-blue-300"><strong>Note:</strong> Select any State & District to view properties in that jurisdiction</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
                ← Back to Public Portal
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
        <title>Government Dashboard - Land Registry</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🏛️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Government Portal</h1>
                  <p className="text-xs text-gray-500">Official Land Registry Administration</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{currentOfficer.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentOfficer.department} • {currentOfficer.district}, {currentOfficer.state}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-1 rounded-lg flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      activeTab === 'verification'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    🔍 Verification ({verificationRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      activeTab === 'transfer'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    🔄 Transfers ({transferRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('properties')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      activeTab === 'properties'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    🏘️ Properties ({currentOfficer?.selectedDistrict})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : message.includes('❌')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {/* Properties View */}
          {activeTab === 'properties' ? (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchFilter(e.target.value)}
                      placeholder="Search by property ID or address..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>{filteredProperties.length}</strong> properties in <strong>{currentOfficer?.selectedDistrict}, {currentOfficer?.selectedState}</strong>
                  </div>
                </div>
              </div>

              {/* Properties Grid */}
              {loading ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading properties...</p>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-5xl mb-4">🏘️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Properties Found</h3>
                  <p className="text-gray-600">
                    No properties registered in {currentOfficer?.selectedDistrict}, {currentOfficer?.selectedState}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <div
                      key={property.propertyId}
                      onClick={() => viewPropertyDetails(property)}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            Property #{property.propertyId}
                          </h3>
                          <p className="text-sm text-gray-600">{property.propertyAddress}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          property.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.isVerified ? '✅' : '⏳'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-semibold">{property.propertyType}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Area:</span>
                          <span className="font-semibold">{property.area.toLocaleString()} sq m</span>
                        </div>
                        {property.surveyNumber && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Survey No:</span>
                            <span className="font-semibold">{property.surveyNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        Registered: {new Date(property.registrationDate * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Property Details Modal */}
              {selectedProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Property #{selectedProperty.propertyId}</h2>
                        <p className="text-gray-600">{selectedProperty.propertyAddress}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProperty(null);
                          setOwnerDetails(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Property Details */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Property Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-semibold">{selectedProperty.district}, {selectedProperty.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-semibold">{selectedProperty.propertyType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Area</p>
                            <p className="font-semibold">{selectedProperty.area.toLocaleString()} sq m</p>
                          </div>
                          {selectedProperty.surveyNumber && (
                            <div>
                              <p className="text-sm text-gray-500">Survey Number</p>
                              <p className="font-semibold">{selectedProperty.surveyNumber}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${
                              selectedProperty.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedProperty.isVerified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner Details */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Owner Information</h3>
                        {ownerDetails ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-semibold">{ownerDetails.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Contact</p>
                              <p className="font-semibold">{ownerDetails.contactInfo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">ID Document</p>
                              <p className="font-mono text-sm">{ownerDetails.idDocument}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Home Location</p>
                              <p className="font-semibold">{ownerDetails.homeDistrict}, {ownerDetails.homeState}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedProperty(null);
                          setOwnerDetails(null);
                        }}
                        className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Requests List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {activeTab === 'verification' ? 'Pending Verifications' : 'Pending Transfers'}
                </h3>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading requests...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTab === 'verification' ? (
                      verificationRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No pending verification requests</p>
                      ) : (
                        verificationRequests.map((request) => (
                          <div
                            key={request.verificationId}
                            onClick={() => loadRequestDetails(request)}
                            className={`p-4 border rounded-lg cursor-pointer transition ${
                              selectedRequest?.verificationId === request.verificationId
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-red-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800">
                                Property #{request.propertyId}
                              </h4>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Pending
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Fee: {formatEther(request.feePaid)} ETH
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.requestDate)}
                            </p>
                          </div>
                        ))
                      )
                    ) : (
                      transferRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No pending transfer requests</p>
                      ) : (
                        transferRequests.map((request) => (
                          <div
                            key={request.requestId}
                            onClick={() => loadRequestDetails(request)}
                            className={`p-4 border rounded-lg cursor-pointer transition ${
                              selectedRequest?.requestId === request.requestId
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-red-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800">
                                Property #{request.propertyId}
                              </h4>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Transfer
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Fee: {formatEther(request.transferFee)} ETH
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.requestDate)}
                            </p>
                          </div>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="lg:col-span-2">
              {selectedRequest ? (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    {activeTab === 'verification' ? 'Verification' : 'Transfer'} Request Details
                  </h3>

                  {propertyDetails && ownerDetails && (
                    <div className="space-y-6">
                      {/* Property Information - Full Details */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">🏠</span> Complete Property Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Property ID</p>
                            <p className="text-lg font-bold text-gray-800">#{propertyDetails.propertyId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Registration Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              propertyDetails.isRegistered 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {propertyDetails.isRegistered ? '✅ Registered' : '⏳ Pending'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Verification Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              propertyDetails.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {propertyDetails.isVerified ? '✅ Verified' : '⏳ Awaiting Verification'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Transfer Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              propertyDetails.isTransferable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {propertyDetails.isTransferable ? '✅ Transferable' : '❌ Non-Transferable'}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold">Property Address</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.propertyAddress}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">District</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.district}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">State</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Property Type</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.propertyType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Total Area</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.area.toLocaleString()} sq m</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Survey Number</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.surveyNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Sub Division</p>
                            <p className="text-base font-bold text-gray-800">{propertyDetails.subDivision || 'N/A'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold">Document Hash (Blockchain)</p>
                            <p className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-300 break-all">
                              {propertyDetails.documentHash}
                            </p>
                          </div>
                          
                          {/* Property Documents and Photos */}
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold mb-2">Property Documents & Media</p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowDocumentModal(true)}
                                disabled={!propertyDocumentUrl}
                                className={`flex-1 px-4 py-3 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 ${
                                  propertyDocumentUrl
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                📄 {propertyDocumentUrl ? 'View Property Document' : 'No Document Available'}
                              </button>
                              <button
                                onClick={() => setShowPhotosModal(true)}
                                disabled={propertyPhotos.length === 0}
                                className={`flex-1 px-4 py-3 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 ${
                                  propertyPhotos.length > 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                🖼️ {propertyPhotos.length > 0 ? `View Property Photos (${propertyPhotos.length})` : 'No Photos Available'}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Registration Date</p>
                            <p className="text-base font-bold text-gray-800">
                              {new Date(propertyDetails.registrationDate * 1000).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Verification Fee Paid</p>
                            <p className="text-base font-bold text-green-700">
                              {formatEther(propertyDetails.verificationFee)} ETH
                            </p>
                          </div>
                          {propertyDetails.lastTransferDate > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Last Transfer Date</p>
                              <p className="text-base font-bold text-gray-800">
                                {new Date(propertyDetails.lastTransferDate * 1000).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owner Information - Full Details */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">👤</span> Complete Owner Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Owner Name</p>
                            <p className="text-lg font-bold text-gray-800">{ownerDetails.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Owner Verification Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              ownerDetails.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ownerDetails.isVerified ? '✅ Verified Owner' : '⏳ Pending Verification'}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold">Contact Information</p>
                            <p className="text-base font-bold text-gray-800">{ownerDetails.contactInfo}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold">Government ID Document</p>
                            <p className="text-base font-mono font-bold text-gray-800 bg-white px-3 py-2 rounded border border-gray-300">
                              {ownerDetails.idDocument}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Home District</p>
                            <p className="text-base font-bold text-gray-800">{ownerDetails.homeDistrict}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Home State</p>
                            <p className="text-base font-bold text-gray-800">{ownerDetails.homeState}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 font-semibold">Blockchain Wallet Address</p>
                            <p className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-300 break-all">
                              {ownerDetails.ownerAddress}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Verification Request Details */}
                      {activeTab === 'verification' && selectedRequest && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">📋</span> Verification Request Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Verification Request ID</p>
                              <p className="text-lg font-bold text-gray-800">#{selectedRequest.verificationId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Request Status</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                selectedRequest.isPending 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : selectedRequest.isApproved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedRequest.isPending ? '⏳ Pending Review' : selectedRequest.isApproved ? '✅ Approved' : '❌ Rejected'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Request Date & Time</p>
                              <p className="text-base font-bold text-gray-800">
                                {new Date(selectedRequest.requestDate * 1000).toLocaleString('en-IN', {
                                  dateStyle: 'full',
                                  timeStyle: 'short'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-semibold">Verification Fee Paid</p>
                              <p className="text-base font-bold text-green-700">
                                {formatEther(selectedRequest.feePaid)} ETH
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600 font-semibold">Property Owner (Requester)</p>
                              <p className="text-xs font-mono bg-white px-3 py-2 rounded border border-gray-300 break-all">
                                {selectedRequest.propertyOwner}
                              </p>
                            </div>
                            {selectedRequest.officerEmployeeId && (
                              <div>
                                <p className="text-sm text-gray-600 font-semibold">Assigned Officer ID</p>
                                <p className="text-base font-bold text-gray-800">{selectedRequest.officerEmployeeId || 'Not Assigned'}</p>
                              </div>
                            )}
                            {selectedRequest.verificationNotes && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 font-semibold">Previous Notes</p>
                                <p className="text-base text-gray-800 bg-white px-3 py-2 rounded border border-gray-300">
                                  {selectedRequest.verificationNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Section */}
                  {activeTab === 'verification' ? (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Verification Decision</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Decision
                          </label>
                          <div className="flex space-x-4">
                            <button
                              onClick={() => setApprovalDecision(true)}
                              className={`px-6 py-2 rounded-lg font-semibold transition ${
                                approvalDecision === true
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => setApprovalDecision(false)}
                              className={`px-6 py-2 rounded-lg font-semibold transition ${
                                approvalDecision === false
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                              }`}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Verification Notes
                          </label>
                          <textarea
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows={4}
                            placeholder="Enter verification notes and comments..."
                          />
                        </div>

                        <button
                          onClick={handleVerifyProperty}
                          disabled={loading || approvalDecision === null}
                          className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Processing...' : 'Submit Verification Decision'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Transfer Approval</h4>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h5 className="font-semibold text-blue-800 mb-2">Transfer Details:</h5>
                        <p className="text-blue-700 text-sm">
                          <strong>From:</strong> {selectedRequest.fromOwner}
                        </p>
                        <p className="text-blue-700 text-sm">
                          <strong>To:</strong> {selectedRequest.toOwner}
                        </p>
                        <p className="text-blue-700 text-sm">
                          <strong>Fee Paid:</strong> {formatEther(selectedRequest.transferFee)} ETH
                        </p>
                      </div>

                      <button
                        onClick={handleApproveTransfer}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processing...' : 'Approve Transfer Request'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Request</h3>
                  <p className="text-gray-600">
                    Choose a {activeTab === 'verification' ? 'verification' : 'transfer'} request from the list to view details and take action.
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </main>

        {/* Document Viewer Modal */}
        {showDocumentModal && propertyDocumentUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">📄 Property Document</h2>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-gray-100">
                {propertyDocumentUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={propertyDocumentUrl}
                    className="w-full h-full border border-gray-300 rounded-lg bg-white"
                    title="Property Document"
                  />
                ) : propertyDocumentUrl.startsWith('data:image/') ? (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={propertyDocumentUrl}
                      alt="Property Document"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <iframe
                    src={propertyDocumentUrl}
                    className="w-full h-full border border-gray-300 rounded-lg bg-white"
                    title="Property Document"
                  />
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <a
                  href={propertyDocumentUrl}
                  download="property-document"
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-center"
                >
                  💾 Download Document
                </a>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos Viewer Modal */}
        {showPhotosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  🖼️ Property Photos ({selectedPhotoIndex + 1} of {propertyPhotos.length})
                </h2>
                <button
                  onClick={() => {
                    setShowPhotosModal(false);
                    setSelectedPhotoIndex(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden p-6 flex items-center justify-center bg-gray-100">
                {propertyPhotos.length > 0 && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={propertyPhotos[selectedPhotoIndex]}
                      alt={`Property Photo ${selectedPhotoIndex + 1}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    
                    {/* Navigation Arrows */}
                    {propertyPhotos.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : propertyPhotos.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedPhotoIndex((prev) => (prev < propertyPhotos.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {propertyPhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-4 transition ${
                        selectedPhotoIndex === index
                          ? 'border-blue-600 shadow-lg'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPhotosModal(false);
                    setSelectedPhotoIndex(0);
                  }}
                  className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                >
                  Close Gallery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
