// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IndiaLandRegistry
 * @dev Blockchain-based Land and Property Record Management System for India
 * @notice This contract manages tamper-proof land ownership records and transfers across Indian states and districts
 */
contract LandRegistry is Ownable, ReentrancyGuard {
    
    // Property structure with India-specific fields
    struct Property {
        uint256 propertyId;
        string propertyAddress;
        string district;
        string state; // Indian state
        uint256 area; // in square meters
        string propertyType; // Residential, Commercial, Agricultural, Industrial
        string surveyNumber; // Survey number as per revenue records
        string subDivision; // Sub-division if any
        address currentOwner;
        string documentHash; // IPFS hash or document hash
        bool isRegistered;
        bool isVerified;
        bool isTransferable; // Only verified properties can be transferred
        uint256 registrationDate;
        uint256 lastTransferDate;
        uint256 verificationFee; // Fee paid for verification
    }
    
    // Owner structure
    struct Owner {
        address ownerAddress;
        string name;
        string idDocument; // Aadhaar, PAN, or passport number
        string contactInfo;
        bool isVerified;
        string homeState;
        string homeDistrict;
    }
    
    // Government officer structure
    struct GovernmentOfficer {
        string employeeId;
        string name;
        string department;
        string state;
        string district;
        bool isActive;
        uint256 registrationDate;
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
        uint256 transferFee;
    }
    
    // Verification request structure
    struct VerificationRequest {
        uint256 verificationId;
        uint256 propertyId;
        address propertyOwner;
        uint256 requestDate;
        uint256 feePaid;
        bool isPending;
        bool isApproved;
        string officerEmployeeId;
        string verificationNotes;
    }
    
    // State variables
    uint256 private propertyCounter;
    uint256 private transferRequestCounter;
    uint256 private verificationRequestCounter;
    
    // Verification fee (in wei)
    uint256 public constant VERIFICATION_FEE = 0.001 ether;
    uint256 public constant TRANSFER_FEE = 0.002 ether;
    
    // Mappings
    mapping(uint256 => Property) public properties;
    mapping(address => Owner) public owners;
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => uint256[]) public ownerProperties;
    mapping(uint256 => uint256[]) public propertyTransferHistory;
    mapping(string => uint256[]) public stateProperties; // Properties by state
    mapping(string => mapping(string => uint256[])) public districtProperties; // Properties by district
    
    // Government officers - mapped by employee ID instead of wallet address
    mapping(string => GovernmentOfficer) public governmentOfficers;
    mapping(string => bool) public activeOfficers;
    
    // Search mappings for efficient querying
    mapping(string => uint256[]) public ownersByIdDocument; // Properties by owner ID document
    
    // Events
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string propertyAddress,
        string state,
        string district,
        uint256 registrationDate
    );
    
    event VerificationRequested(
        uint256 indexed verificationId,
        uint256 indexed propertyId,
        address indexed owner,
        uint256 feePaid,
        uint256 requestDate
    );
    
    event PropertyVerified(
        uint256 indexed propertyId,
        uint256 indexed verificationId,
        string officerEmployeeId,
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
        string officerEmployeeId,
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
        string state,
        string district,
        uint256 registrationDate
    );
    
    event GovernmentOfficerRegistered(
        string indexed employeeId,
        string name,
        string department,
        string state,
        string district,
        uint256 registrationDate
    );
    
    event GovernmentOfficerStatusChanged(
        string indexed employeeId,
        bool isActive,
        uint256 changeDate
    );
    
    // Modifiers
    modifier onlyActiveOfficer(string memory _employeeId) {
        require(activeOfficers[_employeeId], "Not an active government officer");
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
        verificationRequestCounter = 0;
    }
    
    /**
     * @dev Register a new owner
     */
    function registerOwner(
        string memory _name,
        string memory _idDocument,
        string memory _contactInfo,
        string memory _homeState,
        string memory _homeDistrict
    ) external {
        require(bytes(owners[msg.sender].name).length == 0, "Owner already registered");
        
        owners[msg.sender] = Owner({
            ownerAddress: msg.sender,
            name: _name,
            idDocument: _idDocument,
            contactInfo: _contactInfo,
            isVerified: false,
            homeState: _homeState,
            homeDistrict: _homeDistrict
        });
        
        // Add to ID document mapping for search functionality
        ownersByIdDocument[_idDocument].push(uint256(uint160(msg.sender)));
        
        emit OwnerRegistered(msg.sender, _name, _homeState, _homeDistrict, block.timestamp);
    }
    
    /**
     * @dev Register a government officer (only by contract owner)
     */
    function registerGovernmentOfficer(
        string memory _employeeId,
        string memory _name,
        string memory _department,
        string memory _state,
        string memory _district
    ) external onlyOwner {
        require(bytes(governmentOfficers[_employeeId].employeeId).length == 0, "Officer already registered");
        
        governmentOfficers[_employeeId] = GovernmentOfficer({
            employeeId: _employeeId,
            name: _name,
            department: _department,
            state: _state,
            district: _district,
            isActive: true,
            registrationDate: block.timestamp
        });
        
        activeOfficers[_employeeId] = true;
        
        emit GovernmentOfficerRegistered(_employeeId, _name, _department, _state, _district, block.timestamp);
    }
    
    /**
     * @dev Activate/Deactivate government officer (only by contract owner)
     */
    function setOfficerStatus(string memory _employeeId, bool _isActive) external onlyOwner {
        require(bytes(governmentOfficers[_employeeId].employeeId).length > 0, "Officer not registered");
        
        governmentOfficers[_employeeId].isActive = _isActive;
        activeOfficers[_employeeId] = _isActive;
        
        emit GovernmentOfficerStatusChanged(_employeeId, _isActive, block.timestamp);
    }
    
    /**
     * @dev Register a new property
     */
    function registerProperty(
        string memory _propertyAddress,
        string memory _district,
        string memory _state,
        uint256 _area,
        string memory _propertyType,
        string memory _surveyNumber,
        string memory _subDivision,
        string memory _documentHash
    ) external returns (uint256) {
        require(bytes(owners[msg.sender].name).length > 0, "Owner must be registered first");
        
        propertyCounter++;
        uint256 newPropertyId = propertyCounter;
        
        properties[newPropertyId] = Property({
            propertyId: newPropertyId,
            propertyAddress: _propertyAddress,
            district: _district,
            state: _state,
            area: _area,
            propertyType: _propertyType,
            surveyNumber: _surveyNumber,
            subDivision: _subDivision,
            currentOwner: msg.sender,
            documentHash: _documentHash,
            isRegistered: true,
            isVerified: false,
            isTransferable: false,
            registrationDate: block.timestamp,
            lastTransferDate: block.timestamp,
            verificationFee: 0
        });
        
        ownerProperties[msg.sender].push(newPropertyId);
        stateProperties[_state].push(newPropertyId);
        districtProperties[_state][_district].push(newPropertyId);
        
        emit PropertyRegistered(newPropertyId, msg.sender, _propertyAddress, _state, _district, block.timestamp);
        
        return newPropertyId;
    }
    
    /**
     * @dev Request property verification (owner pays the fee)
     */
    function requestPropertyVerification(uint256 _propertyId) 
        external 
        payable
        onlyPropertyOwner(_propertyId) 
        propertyExists(_propertyId) 
        returns (uint256)
    {
        require(!properties[_propertyId].isVerified, "Property already verified");
        require(msg.value >= VERIFICATION_FEE, "Insufficient verification fee");
        
        verificationRequestCounter++;
        uint256 newVerificationId = verificationRequestCounter;
        
        verificationRequests[newVerificationId] = VerificationRequest({
            verificationId: newVerificationId,
            propertyId: _propertyId,
            propertyOwner: msg.sender,
            requestDate: block.timestamp,
            feePaid: msg.value,
            isPending: true,
            isApproved: false,
            officerEmployeeId: "",
            verificationNotes: ""
        });
        
        properties[_propertyId].verificationFee = msg.value;
        
        emit VerificationRequested(newVerificationId, _propertyId, msg.sender, msg.value, block.timestamp);
        
        return newVerificationId;
    }
    
    /**
     * @dev Verify a property (only by government officers)
     */
    function verifyProperty(
        uint256 _verificationId,
        string memory _employeeId,
        bool _approve,
        string memory _notes
    ) external onlyActiveOfficer(_employeeId) {
        VerificationRequest storage request = verificationRequests[_verificationId];
        require(request.isPending, "Verification request not pending");
        
        uint256 propertyId = request.propertyId;
        Property storage property = properties[propertyId];
        
        request.isPending = false;
        request.isApproved = _approve;
        request.officerEmployeeId = _employeeId;
        request.verificationNotes = _notes;
        
        if (_approve) {
            property.isVerified = true;
            property.isTransferable = true;
        }
        
        emit PropertyVerified(propertyId, _verificationId, _employeeId, block.timestamp);
    }
    
    /**
     * @dev Create a transfer request (only for verified and transferable properties)
     */
    function createTransferRequest(
        uint256 _propertyId,
        address _toOwner,
        string memory _transferDocumentHash
    ) external payable onlyPropertyOwner(_propertyId) propertyExists(_propertyId) returns (uint256) {
        require(properties[_propertyId].isVerified, "Property must be verified first");
        require(properties[_propertyId].isTransferable, "Property is not transferable");
        require(bytes(owners[_toOwner].name).length > 0, "Recipient must be registered");
        require(_toOwner != msg.sender, "Cannot transfer to yourself");
        require(msg.value >= TRANSFER_FEE, "Insufficient transfer fee");
        
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
            transferDocumentHash: _transferDocumentHash,
            transferFee: msg.value
        });
        
        emit TransferRequestCreated(newRequestId, _propertyId, msg.sender, _toOwner, block.timestamp);
        
        return newRequestId;
    }
    
    /**
     * @dev Approve a transfer request (only by government officers)
     */
    function approveTransferRequest(uint256 _requestId, string memory _employeeId) 
        external 
        onlyActiveOfficer(_employeeId)
        nonReentrant 
    {
        TransferRequest storage request = transferRequests[_requestId];
        require(!request.isApproved, "Request already approved");
        require(!request.isCompleted, "Request already completed");
        
        request.isApproved = true;
        
        emit TransferRequestApproved(_requestId, _employeeId, block.timestamp);
    }
    
    /**
     * @dev Complete the transfer (execute after approval)
     */
    function completeTransfer(uint256 _requestId) external nonReentrant {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.isApproved, "Transfer not approved");
        require(!request.isCompleted, "Transfer already completed");
        require(
            msg.sender == request.fromOwner || msg.sender == request.toOwner,
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
     * @dev Search properties by state and district
     */
    function searchPropertiesByLocation(
        string memory _state,
        string memory _district
    ) external view returns (uint256[] memory) {
        if (bytes(_district).length > 0) {
            return districtProperties[_state][_district];
        } else {
            return stateProperties[_state];
        }
    }
    
    /**
     * @dev Search properties by owner ID document
     */
    function searchPropertiesByOwnerIdDocument(string memory _idDocument) 
        external 
        view 
        returns (uint256[] memory ownerAddresses, uint256[][] memory properties) 
    {
        uint256[] memory addresses = ownersByIdDocument[_idDocument];
        properties = new uint256[][](addresses.length);
        
        for (uint256 i = 0; i < addresses.length; i++) {
            address ownerAddr = address(uint160(addresses[i]));
            properties[i] = ownerProperties[ownerAddr];
        }
        
        return (addresses, properties);
    }
    
    /**
     * @dev Get all verification requests (for government portal)
     */
    function getPendingVerificationRequests() 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory pending = new uint256[](verificationRequestCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= verificationRequestCounter; i++) {
            if (verificationRequests[i].isPending) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get all pending transfer requests (for government portal)
     */
    function getPendingTransferRequests() 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory pending = new uint256[](transferRequestCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= transferRequestCounter; i++) {
            if (!transferRequests[i].isApproved && !transferRequests[i].isCompleted) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
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
     * @dev Get verification request details
     */
    function getVerificationRequestDetails(uint256 _verificationId) external view returns (VerificationRequest memory) {
        return verificationRequests[_verificationId];
    }
    
    /**
     * @dev Get government officer details
     */
    function getGovernmentOfficerDetails(string memory _employeeId) external view returns (GovernmentOfficer memory) {
        return governmentOfficers[_employeeId];
    }
    
    /**
     * @dev Check if property is transferable
     */
    function isPropertyTransferable(uint256 _propertyId) external view returns (bool) {
        return properties[_propertyId].isVerified && properties[_propertyId].isTransferable;
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
     * @dev Get total number of verification requests
     */
    function getTotalVerificationRequests() external view returns (uint256) {
        return verificationRequestCounter;
    }
    
    /**
     * @dev Withdraw accumulated fees (only contract owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
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
