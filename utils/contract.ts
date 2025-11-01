import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS || '';
const GANACHE_URL = process.env.NEXT_PUBLIC_GANACHE_URL || 'http://127.0.0.1:8545';

// ABI - will be generated after contract compilation
// Import this from artifacts after compiling contracts
export const CONTRACT_ABI = [
  // Owner functions
  "function registerOwner(string memory _name, string memory _idDocument, string memory _contactInfo, string memory _homeState, string memory _homeDistrict) external",
  "function getOwnerDetails(address _ownerAddress) external view returns (tuple(address ownerAddress, string name, string idDocument, string contactInfo, bool isVerified, string homeState, string homeDistrict))",
  
  // Government officer functions
  "function registerGovernmentOfficer(string memory _employeeId, string memory _name, string memory _department, string memory _state, string memory _district) external",
  "function setOfficerStatus(string memory _employeeId, bool _isActive) external",
  "function getGovernmentOfficerDetails(string memory _employeeId) external view returns (tuple(string employeeId, string name, string department, string state, string district, bool isActive, uint256 registrationDate))",
  
  // Property functions
  "function registerProperty(string memory _propertyAddress, string memory _district, string memory _state, uint256 _area, string memory _propertyType, string memory _surveyNumber, string memory _subDivision, string memory _documentHash) external returns (uint256)",
  "function getPropertyDetails(uint256 _propertyId) external view returns (tuple(uint256 propertyId, string propertyAddress, string district, string state, uint256 area, string propertyType, string surveyNumber, string subDivision, address currentOwner, string documentHash, bool isRegistered, bool isVerified, bool isTransferable, uint256 registrationDate, uint256 lastTransferDate, uint256 verificationFee))",
  "function getOwnerProperties(address _owner) external view returns (uint256[] memory)",
  "function isPropertyTransferable(uint256 _propertyId) external view returns (bool)",
  
  // Verification functions
  "function requestPropertyVerification(uint256 _propertyId) external payable returns (uint256)",
  "function verifyProperty(uint256 _verificationId, string memory _employeeId, bool _approve, string memory _notes) external",
  "function getVerificationRequestDetails(uint256 _verificationId) external view returns (tuple(uint256 verificationId, uint256 propertyId, address propertyOwner, uint256 requestDate, uint256 feePaid, bool isPending, bool isApproved, string officerEmployeeId, string verificationNotes))",
  "function getPendingVerificationRequests() external view returns (uint256[] memory)",
  
  // Transfer functions
  "function createTransferRequest(uint256 _propertyId, address _toOwner, string memory _transferDocumentHash) external payable returns (uint256)",
  "function approveTransferRequest(uint256 _requestId, string memory _employeeId) external",
  "function completeTransfer(uint256 _requestId) external",
  "function getTransferRequestDetails(uint256 _requestId) external view returns (tuple(uint256 requestId, uint256 propertyId, address fromOwner, address toOwner, uint256 requestDate, bool isApproved, bool isCompleted, string transferDocumentHash, uint256 transferFee))",
  "function getPendingTransferRequests() external view returns (uint256[] memory)",
  "function getPropertyTransferHistory(uint256 _propertyId) external view returns (uint256[] memory)",
  
  // Search functions
  "function searchPropertiesByLocation(string memory _state, string memory _district) external view returns (uint256[] memory)",
  "function searchPropertiesByOwnerIdDocument(string memory _idDocument) external view returns (uint256[] memory, uint256[][] memory)",
  
  // General functions
  "function getTotalProperties() external view returns (uint256)",
  "function getTotalTransferRequests() external view returns (uint256)",
  "function getTotalVerificationRequests() external view returns (uint256)",
  "function withdrawFees() external",
  "function owner() external view returns (address)",
  
  // Constants
  "function VERIFICATION_FEE() external view returns (uint256)",
  "function TRANSFER_FEE() external view returns (uint256)",
  
  // Events
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string propertyAddress, string state, string district, uint256 registrationDate)",
  "event VerificationRequested(uint256 indexed verificationId, uint256 indexed propertyId, address indexed owner, uint256 feePaid, uint256 requestDate)",
  "event PropertyVerified(uint256 indexed propertyId, uint256 indexed verificationId, string officerEmployeeId, uint256 verificationDate)",
  "event TransferRequestCreated(uint256 indexed requestId, uint256 indexed propertyId, address indexed fromOwner, address toOwner, uint256 requestDate)",
  "event TransferRequestApproved(uint256 indexed requestId, string officerEmployeeId, uint256 approvalDate)",
  "event PropertyTransferred(uint256 indexed propertyId, address indexed fromOwner, address indexed toOwner, uint256 transferDate)",
  "event OwnerRegistered(address indexed ownerAddress, string name, string state, string district, uint256 registrationDate)",
  "event GovernmentOfficerRegistered(string indexed employeeId, string name, string department, string state, string district, uint256 registrationDate)",
  "event GovernmentOfficerStatusChanged(string indexed employeeId, bool isActive, uint256 changeDate)"
];

export const getContract = (providerOrSigner: ethers.Provider | ethers.Signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner);
};

export const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    // Cast to Eip1193Provider so TypeScript knows `request` is present
    return new ethers.BrowserProvider((window as any).ethereum as ethers.Eip1193Provider);
  }
  // Fallback to JSON-RPC provider for read-only operations
  return new ethers.JsonRpcProvider(GANACHE_URL);
};

export const getSigner = async () => {
  const provider = getProvider();
  if (provider instanceof ethers.BrowserProvider) {
    return await provider.getSigner();
  }
  throw new Error('No wallet connected');
};

export { CONTRACT_ADDRESS };
