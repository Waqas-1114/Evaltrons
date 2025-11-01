# Property Transfer Workflow

This document explains the complete property transfer process in the Land Registry system.

## Overview

The transfer workflow enables property owners to transfer their verified properties to new owners with government verification and blockchain-based fee payments.

## Transfer Process Flow

### 1. **Create Transfer Request** (Property Owner)

**Page:** `/request-transfer`

**Requirements:**
- Owner must be registered in the system
- Property must be verified and transferable
- Must have transfer document ready
- Need receiver's wallet address

**Process:**
1. Owner selects property from their verified properties
2. Enters receiver's wallet address (must be a registered owner)
3. Uploads transfer document (sale deed, agreement, etc.)
4. MetaMask prompts for **0.002 ETH transfer fee payment**
5. Transaction creates transfer request on blockchain

**What Happens:**
- Transfer fee (0.002 ETH) is locked in the smart contract
- Transfer document hash is stored on blockchain
- Transfer request is assigned to government officers in the property's district/state
- Request status: **Pending Approval**

**Smart Contract Function:**
```solidity
function createTransferRequest(
    uint256 _propertyId,
    address _toOwner,
    string memory _transferDocumentHash
) external payable
```

---

### 2. **Government Verification** (Government Officer)

**Page:** `/government-portal` → Transfer Requests Tab

**Who Can Approve:**
- Active government officers only
- Must be assigned to the same district/state as the property

**Process:**
1. Government officer logs into government portal
2. Reviews pending transfer requests
3. Views transfer document and property details
4. Clicks "Approve Transfer"
5. MetaMask prompts for transaction signature
6. Upon approval, **0.002 ETH fee is transferred to officer's wallet**

**What Happens:**
- Transfer request marked as approved
- Transfer fee (0.002 ETH) sent from contract to government officer
- Parties (sender and receiver) can now complete the transfer
- Request status: **Approved, Awaiting Completion**

**Smart Contract Function:**
```solidity
function approveTransferRequest(
    uint256 _requestId,
    string memory _employeeId
) external onlyActiveOfficer
```

**Fee Distribution:**
```solidity
if (request.transferFee > 0) {
    (bool success, ) = payable(msg.sender).call{value: request.transferFee}("");
    require(success, "Transfer fee payment failed");
}
```

---

### 3. **Complete Transfer** (Either Party)

**Who Can Complete:**
- Either the current owner (sender) OR the new owner (receiver)

**Process:**
1. Either party calls `completeTransfer` on the smart contract
2. MetaMask prompts for transaction signature
3. Ownership is transferred on blockchain

**What Happens:**
- Property ownership transfers from current owner to new owner
- Property's `currentOwner` field updated
- Property's `lastTransferDate` updated to current timestamp
- Transfer request marked as completed
- Property removed from sender's properties list
- Property added to receiver's properties list
- Request status: **Completed**

**Smart Contract Function:**
```solidity
function completeTransfer(uint256 _requestId) external nonReentrant
```

---

## Fee Structure

| Action | Fee Amount | Recipient |
|--------|-----------|-----------|
| Property Registration | Free | N/A |
| Property Verification | 0.001 ETH | Government Officer (approver) |
| Transfer Request | 0.002 ETH | Government Officer (approver) |
| Transfer Completion | Free | N/A |

## Security Features

### Smart Contract Protection
- **ReentrancyGuard:** Prevents reentrancy attacks on transfer functions
- **Access Control:** Only registered, active government officers can approve
- **Ownership Validation:** Only verified properties can be transferred
- **Address Validation:** Receiver must be registered owner in the system
- **Status Checks:** Prevents double approvals and completions

### Fee Payment Security
- Fees locked in contract until government approval
- Direct transfer to government officer's wallet (no intermediary)
- Transaction fails if fee transfer fails
- All transactions recorded on blockchain (immutable audit trail)

## User Interface

### Navigation to Transfer Page

1. **From Home Page:** Click "Request Transfer" card
2. **From Dashboard:** Click "Request Transfer" button
3. **From My Properties:** Click "Request Transfer" button in header
4. **Direct URL:** `/request-transfer`

### Transfer Request Page Features

- **Property Selection:** Dropdown showing only verified, transferable properties
- **Property Details:** Shows address, location, verification status
- **Receiver Input:** Validates Ethereum address format
- **Document Upload:** Supports PDF, JPG, PNG (max 5MB)
- **Fee Display:** Shows 0.002 ETH transfer fee with explanation
- **MetaMask Integration:** Automatic payment prompt

### Government Portal Features

- **Transfer Requests Tab:** Lists pending transfer requests
- **Request Details:** Shows property info, parties involved, documents
- **Approve Button:** Triggers MetaMask for approval transaction
- **Fee Receipt:** Shows confirmation when 0.002 ETH received

## Example Scenario

### Alice transfers property to Bob

1. **Alice (Current Owner):**
   - Goes to `/request-transfer`
   - Selects "Property #3 - 123 Main St, Mumbai, Maharashtra"
   - Enters Bob's wallet address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Uploads sale deed PDF
   - Clicks "Submit Transfer Request"
   - MetaMask prompts: "Pay 0.002 ETH"
   - Alice approves transaction
   - ✅ Transfer request created

2. **Officer Rajesh (Government):**
   - Logs into government portal with GVT001
   - Sees pending transfer for Property #3
   - Reviews sale deed and property details
   - Clicks "Approve Transfer"
   - MetaMask prompts for signature
   - Rajesh approves transaction
   - ✅ Transfer approved, 0.002 ETH received
   - Message: "Transfer fee of 0.0020 ETH has been transferred to your wallet"

3. **Bob (New Owner):**
   - Can now call `completeTransfer` to finalize
   - MetaMask prompts for signature
   - Bob approves transaction
   - ✅ Property ownership transferred
   - Property now appears in Bob's "My Properties"
   - Property removed from Alice's list

## Technical Implementation

### Smart Contract State Changes

**Transfer Request Creation:**
```
transferRequests[requestId] = {
    requestId: counter,
    propertyId: _propertyId,
    fromOwner: msg.sender,
    toOwner: _toOwner,
    requestDate: block.timestamp,
    isApproved: false,
    isCompleted: false,
    transferDocumentHash: _transferDocumentHash,
    transferFee: TRANSFER_FEE (0.002 ETH)
}
```

**Transfer Approval:**
```
request.isApproved = true
payable(governmentOfficer).transfer(0.002 ETH)
```

**Transfer Completion:**
```
properties[propertyId].currentOwner = request.toOwner
properties[propertyId].lastTransferDate = block.timestamp
request.isCompleted = true
ownerProperties[fromOwner].remove(propertyId)
ownerProperties[toOwner].push(propertyId)
```

### Frontend Integration

**Request Transfer (request-transfer.tsx):**
```typescript
const feeInWei = ethers.parseEther('0.002');
const tx = await contract.createTransferRequest(
  selectedPropertyId,
  receiverAddress,
  documentHash,
  { value: feeInWei }
);
```

**Government Approval (government-portal.tsx):**
```typescript
const tx = await contract.approveTransferRequest(
  selectedRequest.requestId,
  currentOfficer.employeeId
);
// Fee automatically transferred to msg.sender
```

**Complete Transfer:**
```typescript
const tx = await contract.completeTransfer(requestId);
```

## Testing the Workflow

### Prerequisites
1. Ganache running on port 8545
2. MetaMask connected to Ganache Local (Chain ID: 1337)
3. Government officers registered (GVT001-004)
4. At least two registered owners with accounts
5. One owner must have a verified property

### Test Steps

1. **Setup:**
   ```bash
   npm run compile
   npm run deploy
   npm run register-officers
   npm run dev
   ```

2. **Register Owners:**
   - Use Account 1 (Alice) to register as owner
   - Use Account 2 (Bob) to register as owner

3. **Register Property:**
   - Alice registers property in Mumbai, Maharashtra
   - Wait for registration confirmation

4. **Verify Property:**
   - Login to government portal as GVT001 (Officer for Maharashtra)
   - Verify Alice's property (pay 0.001 ETH verification fee)
   - Alice and property both become verified

5. **Create Transfer:**
   - Alice goes to `/request-transfer`
   - Selects verified property
   - Enters Bob's wallet address
   - Uploads transfer document
   - Pays 0.002 ETH transfer fee
   - ✅ Transfer request created

6. **Approve Transfer:**
   - Login to government portal as GVT001
   - Go to "Transfer Requests" tab
   - Review transfer details
   - Click "Approve Transfer"
   - ✅ Receive 0.002 ETH fee

7. **Complete Transfer:**
   - Bob (or Alice) calls completeTransfer
   - ✅ Property now owned by Bob

## Troubleshooting

### Common Issues

**"Cannot transfer to yourself"**
- You entered your own address as receiver
- Solution: Enter a different registered owner's address

**"Please enter a valid receiver address"**
- Invalid Ethereum address format
- Solution: Check address format (should start with 0x)

**"No Transferable Properties"**
- You don't have any verified properties
- Solution: Register and verify a property first

**"Transaction rejected by user"**
- You cancelled the MetaMask transaction
- Solution: Try again and approve in MetaMask

**"Transfer fee payment failed"**
- Not enough ETH in wallet for fee
- Solution: Ensure wallet has at least 0.002 ETH

**"Request already approved"**
- Transfer already approved by government
- Solution: Proceed to complete the transfer

## Future Enhancements

### Potential Features
1. **Transfer History:** View all past transfers for a property
2. **Multi-signature:** Require both parties to approve before completion
3. **Escrow System:** Hold payment until transfer completion
4. **Partial Ownership:** Support fractional property ownership
5. **Transfer Templates:** Pre-filled forms for common transfer types
6. **Notification System:** Email/SMS alerts for transfer status changes
7. **Dispute Resolution:** Mechanism to handle transfer disputes
8. **Cancellation:** Allow cancellation of pending transfers
9. **Time Limits:** Auto-expire transfer requests after certain period
10. **Batch Transfers:** Transfer multiple properties at once

## Security Considerations

1. **Document Storage:** Currently using localStorage (use IPFS in production)
2. **Identity Verification:** Implement KYC for high-value transfers
3. **Fraud Detection:** Monitor suspicious transfer patterns
4. **Rate Limiting:** Prevent spam transfer requests
5. **Insurance:** Optional transfer insurance for parties

## Conclusion

The transfer workflow provides a secure, transparent, and efficient way to transfer property ownership on the blockchain. With government verification and automated fee distribution, the system ensures compliance while maintaining decentralization benefits.
