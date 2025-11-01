// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandRegistry
 * @dev Blockchain-based Land and Property Record Management System
 * @notice This contract manages tamper-proof land ownership records and transfers
 */
contract LandRegistry is Ownable, ReentrancyGuard {
    
    // Property structure
    struct Property {
        uint256 propertyId;
        string propertyAddress;
        string district;
        string city;
        string state;
        uint256 area; // in square meters
        address currentOwner;
        string documentHash; // IPFS hash or document hash
        bool isRegistered;
        bool isVerified;
        uint256 registrationDate;
        uint256 lastTransferDate;
    }
    
    // Owner structure
    struct Owner {
        address ownerAddress;
        string name;
        string idDocument; // National ID or passport number (hashed)
        string contactInfo;
        bool isVerified;
    }
    
    // Transfer request structure
    struct TransferRequest {
        uint256 requestId;
        uint256 propertyId;
        address fromOwner;
        address toOwner;
        uint256 requestDate;
        bool isApproved;
        bool isCompleted;
        string transferDocumentHash;
    }
    
    // State variables
    uint256 private propertyCounter;
    uint256 private transferRequestCounter;
    
    // Mappings
    mapping(uint256 => Property) public properties;
    mapping(address => Owner) public owners;
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(address => uint256[]) public ownerProperties;
    mapping(uint256 => uint256[]) public propertyTransferHistory;
    
    // Government officials who can verify properties
    mapping(address => bool) public verifiers;
    
    // Events
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string propertyAddress,
        uint256 registrationDate
    );
    
    event PropertyVerified(
        uint256 indexed propertyId,
        address indexed verifier,
        uint256 verificationDate
    );
    
    event TransferRequestCreated(
        uint256 indexed requestId,
        uint256 indexed propertyId,
        address indexed fromOwner,
        address toOwner,
        uint256 requestDate
    );
    
    event TransferRequestApproved(
        uint256 indexed requestId,
        address indexed approver,
        uint256 approvalDate
    );
    
    event PropertyTransferred(
        uint256 indexed propertyId,
        address indexed fromOwner,
        address indexed toOwner,
        uint256 transferDate
    );
    
    event OwnerRegistered(
        address indexed ownerAddress,
        string name,
        uint256 registrationDate
    );
    
    event VerifierAdded(
        address indexed verifierAddress,
        uint256 addedDate
    );
    
    event VerifierRemoved(
        address indexed verifierAddress,
        uint256 removedDate
    );
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].currentOwner == msg.sender, "Not the property owner");
        _;
    }
    
    modifier propertyExists(uint256 _propertyId) {
        require(properties[_propertyId].isRegistered, "Property does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        propertyCounter = 0;
        transferRequestCounter = 0;
        // Contract owner is automatically a verifier
        verifiers[msg.sender] = true;
    }
    
    /**
     * @dev Register a new owner
     */
    function registerOwner(
        string memory _name,
        string memory _idDocument,
        string memory _contactInfo
    ) external {
        require(bytes(owners[msg.sender].name).length == 0, "Owner already registered");
        
        owners[msg.sender] = Owner({
            ownerAddress: msg.sender,
            name: _name,
            idDocument: _idDocument,
            contactInfo: _contactInfo,
            isVerified: false
        });
        
        emit OwnerRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Verify an owner (only by verifiers)
     */
    function verifyOwner(address _ownerAddress) external onlyVerifier {
        require(bytes(owners[_ownerAddress].name).length > 0, "Owner not registered");
        owners[_ownerAddress].isVerified = true;
    }
    
    /**
     * @dev Register a new property
     */
    function registerProperty(
        string memory _propertyAddress,
        string memory _district,
        string memory _city,
        string memory _state,
        uint256 _area,
        string memory _documentHash
    ) external returns (uint256) {
        require(bytes(owners[msg.sender].name).length > 0, "Owner must be registered first");
        
        propertyCounter++;
        uint256 newPropertyId = propertyCounter;
        
        properties[newPropertyId] = Property({
            propertyId: newPropertyId,
            propertyAddress: _propertyAddress,
            district: _district,
            city: _city,
            state: _state,
            area: _area,
            currentOwner: msg.sender,
            documentHash: _documentHash,
            isRegistered: true,
            isVerified: false,
            registrationDate: block.timestamp,
            lastTransferDate: block.timestamp
        });
        
        ownerProperties[msg.sender].push(newPropertyId);
        
        emit PropertyRegistered(newPropertyId, msg.sender, _propertyAddress, block.timestamp);
        
        return newPropertyId;
    }
    
    /**
     * @dev Verify a property (only by government verifiers)
     */
    function verifyProperty(uint256 _propertyId) 
        external 
        onlyVerifier 
        propertyExists(_propertyId) 
    {
        require(!properties[_propertyId].isVerified, "Property already verified");
        properties[_propertyId].isVerified = true;
        
        emit PropertyVerified(_propertyId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Create a transfer request
     */
    function createTransferRequest(
        uint256 _propertyId,
        address _toOwner,
        string memory _transferDocumentHash
    ) external onlyPropertyOwner(_propertyId) propertyExists(_propertyId) returns (uint256) {
        require(properties[_propertyId].isVerified, "Property must be verified");
        require(bytes(owners[_toOwner].name).length > 0, "Recipient must be registered");
        require(_toOwner != msg.sender, "Cannot transfer to yourself");
        
        transferRequestCounter++;
        uint256 newRequestId = transferRequestCounter;
        
        transferRequests[newRequestId] = TransferRequest({
            requestId: newRequestId,
            propertyId: _propertyId,
            fromOwner: msg.sender,
            toOwner: _toOwner,
            requestDate: block.timestamp,
            isApproved: false,
            isCompleted: false,
            transferDocumentHash: _transferDocumentHash
        });
        
        emit TransferRequestCreated(newRequestId, _propertyId, msg.sender, _toOwner, block.timestamp);
        
        return newRequestId;
    }
    
    /**
     * @dev Approve a transfer request (only by verifiers)
     */
    function approveTransferRequest(uint256 _requestId) 
        external 
        onlyVerifier 
        nonReentrant 
    {
        TransferRequest storage request = transferRequests[_requestId];
        require(!request.isApproved, "Request already approved");
        require(!request.isCompleted, "Request already completed");
        
        request.isApproved = true;
        
        emit TransferRequestApproved(_requestId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Complete the transfer (execute after approval)
     */
    function completeTransfer(uint256 _requestId) external nonReentrant {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.isApproved, "Transfer not approved");
        require(!request.isCompleted, "Transfer already completed");
        require(
            msg.sender == request.fromOwner || msg.sender == request.toOwner || verifiers[msg.sender],
            "Not authorized to complete transfer"
        );
        
        uint256 propertyId = request.propertyId;
        Property storage property = properties[propertyId];
        
        // Remove from old owner's properties
        _removePropertyFromOwner(request.fromOwner, propertyId);
        
        // Update property ownership
        property.currentOwner = request.toOwner;
        property.lastTransferDate = block.timestamp;
        
        // Add to new owner's properties
        ownerProperties[request.toOwner].push(propertyId);
        
        // Add to transfer history
        propertyTransferHistory[propertyId].push(_requestId);
        
        // Mark request as completed
        request.isCompleted = true;
        
        emit PropertyTransferred(propertyId, request.fromOwner, request.toOwner, block.timestamp);
    }
    
    /**
     * @dev Add a verifier (only contract owner)
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(!verifiers[_verifier], "Already a verifier");
        verifiers[_verifier] = true;
        
        emit VerifierAdded(_verifier, block.timestamp);
    }
    
    /**
     * @dev Remove a verifier (only contract owner)
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Not a verifier");
        require(_verifier != owner(), "Cannot remove contract owner");
        verifiers[_verifier] = false;
        
        emit VerifierRemoved(_verifier, block.timestamp);
    }
    
    /**
     * @dev Update property document hash
     */
    function updatePropertyDocument(uint256 _propertyId, string memory _newDocumentHash)
        external
        onlyPropertyOwner(_propertyId)
        propertyExists(_propertyId)
    {
        properties[_propertyId].documentHash = _newDocumentHash;
    }
    
    /**
     * @dev Get all properties owned by an address
     */
    function getOwnerProperties(address _owner) external view returns (uint256[] memory) {
        return ownerProperties[_owner];
    }
    
    /**
     * @dev Get property transfer history
     */
    function getPropertyTransferHistory(uint256 _propertyId) 
        external 
        view 
        propertyExists(_propertyId) 
        returns (uint256[] memory) 
    {
        return propertyTransferHistory[_propertyId];
    }
    
    /**
     * @dev Get property details
     */
    function getPropertyDetails(uint256 _propertyId) 
        external 
        view 
        propertyExists(_propertyId) 
        returns (Property memory) 
    {
        return properties[_propertyId];
    }
    
    /**
     * @dev Get owner details
     */
    function getOwnerDetails(address _ownerAddress) external view returns (Owner memory) {
        return owners[_ownerAddress];
    }
    
    /**
     * @dev Get transfer request details
     */
    function getTransferRequestDetails(uint256 _requestId) external view returns (TransferRequest memory) {
        return transferRequests[_requestId];
    }
    
    /**
     * @dev Get total number of registered properties
     */
    function getTotalProperties() external view returns (uint256) {
        return propertyCounter;
    }
    
    /**
     * @dev Get total number of transfer requests
     */
    function getTotalTransferRequests() external view returns (uint256) {
        return transferRequestCounter;
    }
    
    /**
     * @dev Internal function to remove property from owner's list
     */
    function _removePropertyFromOwner(address _owner, uint256 _propertyId) private {
        uint256[] storage properties = ownerProperties[_owner];
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i] == _propertyId) {
                properties[i] = properties[properties.length - 1];
                properties.pop();
                break;
            }
        }
    }
}
