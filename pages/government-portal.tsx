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
  const [currentOfficer, setCurrentOfficer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'verification' | 'transfer'>('verification');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Data states
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<Owner | null>(null);
  
  // Form states
  const [verificationNotes, setVerificationNotes] = useState('');
  const [approvalDecision, setApprovalDecision] = useState<boolean | null>(null);

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
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadPendingRequests();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const officer = GOVERNMENT_OFFICERS[employeeId as keyof typeof GOVERNMENT_OFFICERS];
    if (officer && officer.password === password) {
      setCurrentOfficer({ ...officer, employeeId });
      setIsLoggedIn(true);
      setMessage('✅ Login successful! Welcome to the Government Portal.');
    } else {
      setMessage('❌ Invalid credentials. Please check your Employee ID and password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmployeeId('');
    setPassword('');
    setCurrentOfficer(null);
    setMessage('');
    setSelectedRequest(null);
    setPropertyDetails(null);
    setOwnerDetails(null);
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      if (activeTab === 'verification') {
        const pendingIds = await contract.getPendingVerificationRequests();
        const requests = [];

        for (const id of pendingIds) {
          const request = await contract.getVerificationRequestDetails(Number(id));
          requests.push({
            verificationId: Number(id),
            propertyId: Number(request.propertyId),
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
          requests.push({
            requestId: Number(id),
            propertyId: Number(request.propertyId),
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

  const loadRequestDetails = async (request: any) => {
    setLoading(true);
    try {
      const provider = getProvider();
      const contract = getContract(provider);

      const propertyId = activeTab === 'verification' ? request.propertyId : request.propertyId;
      
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
                <p>Employee ID: <strong>GVT001</strong> (Maharashtra)</p>
                <p>Employee ID: <strong>GVT002</strong> (Delhi)</p>
                <p>Employee ID: <strong>GVT003</strong> (Uttar Pradesh)</p>
                <p>Password: <strong>admin123</strong> (for all)</p>
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
                <div className="bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      activeTab === 'verification'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    🔍 Property Verification ({verificationRequests.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      activeTab === 'transfer'
                        ? 'bg-white text-red-600 shadow-md'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    🔄 Transfer Approval ({transferRequests.length})
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Property Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Property Information</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Property ID</p>
                            <p className="font-semibold">#{propertyDetails.propertyId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-semibold">{propertyDetails.propertyAddress}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-semibold">{propertyDetails.district}, {propertyDetails.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Type & Area</p>
                            <p className="font-semibold">
                              {propertyDetails.propertyType} • {propertyDetails.area.toLocaleString()} sq m
                            </p>
                          </div>
                          {propertyDetails.surveyNumber && (
                            <div>
                              <p className="text-sm text-gray-500">Survey Number</p>
                              <p className="font-semibold">{propertyDetails.surveyNumber}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owner Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Owner Information</h4>
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
                            <p className="text-sm text-gray-500">Home Location</p>
                            <p className="font-semibold">{ownerDetails.homeDistrict}, {ownerDetails.homeState}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">ID Document</p>
                            <p className="font-mono text-sm font-semibold">{ownerDetails.idDocument}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Verification Status</p>
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${
                              ownerDetails.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ownerDetails.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
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
        </main>
      </div>
    </>
  );
}
