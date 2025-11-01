import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS || '';
const GANACHE_URL = process.env.NEXT_PUBLIC_GANACHE_URL || 'http://127.0.0.1:8545';

// ABI - will be generated after contract compilation
// Import this from artifacts after compiling contracts
export const CONTRACT_ABI = [
  "function registerOwner(string memory _name, string memory _idDocument, string memory _contactInfo) external",
  "function registerProperty(string memory _propertyAddress, string memory _district, string memory _city, string memory _state, uint256 _area, string memory _documentHash) external returns (uint256)",
  "function verifyProperty(uint256 _propertyId) external",
  "function verifyOwner(address _ownerAddress) external",
  "function createTransferRequest(uint256 _propertyId, address _toOwner, string memory _transferDocumentHash) external returns (uint256)",
  "function approveTransferRequest(uint256 _requestId) external",
  "function completeTransfer(uint256 _requestId) external",
  "function getOwnerProperties(address _owner) external view returns (uint256[] memory)",
  "function getPropertyDetails(uint256 _propertyId) external view returns (tuple(uint256 propertyId, string propertyAddress, string district, string city, string state, uint256 area, address currentOwner, string documentHash, bool isRegistered, bool isVerified, uint256 registrationDate, uint256 lastTransferDate))",
  "function getOwnerDetails(address _ownerAddress) external view returns (tuple(address ownerAddress, string name, string idDocument, string contactInfo, bool isVerified))",
  "function getTransferRequestDetails(uint256 _requestId) external view returns (tuple(uint256 requestId, uint256 propertyId, address fromOwner, address toOwner, uint256 requestDate, bool isApproved, bool isCompleted, string transferDocumentHash))",
  "function getTotalProperties() external view returns (uint256)",
  "function getTotalTransferRequests() external view returns (uint256)",
  "function getPropertyTransferHistory(uint256 _propertyId) external view returns (uint256[] memory)",
  "function updatePropertyDocument(uint256 _propertyId, string memory _newDocumentHash) external",
  "function addVerifier(address _verifier) external",
  "function removeVerifier(address _verifier) external",
  "function verifiers(address) external view returns (bool)",
  "function owner() external view returns (address)",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string propertyAddress, uint256 registrationDate)",
  "event PropertyVerified(uint256 indexed propertyId, address indexed verifier, uint256 verificationDate)",
  "event TransferRequestCreated(uint256 indexed requestId, uint256 indexed propertyId, address indexed fromOwner, address toOwner, uint256 requestDate)",
  "event PropertyTransferred(uint256 indexed propertyId, address indexed fromOwner, address indexed toOwner, uint256 transferDate)",
  "event OwnerRegistered(address indexed ownerAddress, string name, uint256 registrationDate)"
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
