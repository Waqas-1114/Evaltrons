import { expect } from "chai";
import { ethers } from "hardhat";
import { LandRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LandRegistry", function () {
  let landRegistry: LandRegistry;
  let owner: SignerWithAddress;
  let verifier: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, verifier, user1, user2, user3] = await ethers.getSigners();
    
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const LandRegistryFactory = (await ethers.getContractFactory("LandRegistry")) as unknown as { deploy: (...args: any[]) => Promise<LandRegistry> };
    landRegistry = await LandRegistryFactory.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await landRegistry.owner()).to.equal(owner.address);
    });

    it("Should make contract owner a verifier", async function () {
      expect(await landRegistry.verifiers(owner.address)).to.be.true;
    });
  });

  describe("Owner Registration", function () {
    it("Should register a new owner", async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );

      const ownerDetails = await landRegistry.getOwnerDetails(user1.address);
      expect(ownerDetails.name).to.equal("John Doe");
      expect(ownerDetails.ownerAddress).to.equal(user1.address);
      expect(ownerDetails.isVerified).to.be.false;
    });

    it("Should not allow duplicate owner registration", async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );

      await expect(
        landRegistry.connect(user1).registerOwner(
          "John Doe",
          "ID123456",
          "john@example.com"
        )
      ).to.be.revertedWith("Owner already registered");
    });

    it("Should emit OwnerRegistered event", async function () {
      await expect(
        landRegistry.connect(user1).registerOwner(
          "John Doe",
          "ID123456",
          "john@example.com"
        )
      ).to.emit(landRegistry, "OwnerRegistered");
    });
  });

  describe("Owner Verification", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
    });

    it("Should allow verifier to verify owner", async function () {
      await landRegistry.connect(owner).verifyOwner(user1.address);
      const ownerDetails = await landRegistry.getOwnerDetails(user1.address);
      expect(ownerDetails.isVerified).to.be.true;
    });

    it("Should not allow non-verifier to verify owner", async function () {
      await expect(
        landRegistry.connect(user2).verifyOwner(user1.address)
      ).to.be.revertedWith("Not authorized verifier");
    });
  });

  describe("Property Registration", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
    });

    it("Should register a new property", async function () {
      const tx = await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const propertyDetails = await landRegistry.getPropertyDetails(1);
      expect(propertyDetails.propertyAddress).to.equal("123 Main St");
      expect(propertyDetails.currentOwner).to.equal(user1.address);
      expect(propertyDetails.isRegistered).to.be.true;
      expect(propertyDetails.isVerified).to.be.false;
    });

    it("Should not allow unregistered user to register property", async function () {
      await expect(
        landRegistry.connect(user2).registerProperty(
          "456 Oak Ave",
          "Uptown",
          "Boston",
          "MA",
          1500,
          "QmHash456"
        )
      ).to.be.revertedWith("Owner must be registered first");
    });

    it("Should emit PropertyRegistered event", async function () {
      await expect(
        landRegistry.connect(user1).registerProperty(
          "123 Main St",
          "Downtown",
          "New York",
          "NY",
          1000,
          "QmHash123"
        )
      ).to.emit(landRegistry, "PropertyRegistered");
    });

    it("Should add property to owner's property list", async function () {
      await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );

      const ownerProperties = await landRegistry.getOwnerProperties(user1.address);
      expect(ownerProperties.length).to.equal(1);
      expect(ownerProperties[0]).to.equal(1);
    });
  });

  describe("Property Verification", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
      await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );
    });

    it("Should allow verifier to verify property", async function () {
      await landRegistry.connect(owner).verifyProperty(1);
      const propertyDetails = await landRegistry.getPropertyDetails(1);
      expect(propertyDetails.isVerified).to.be.true;
    });

    it("Should not allow non-verifier to verify property", async function () {
      await expect(
        landRegistry.connect(user2).verifyProperty(1)
      ).to.be.revertedWith("Not authorized verifier");
    });

    it("Should emit PropertyVerified event", async function () {
      await expect(
        landRegistry.connect(owner).verifyProperty(1)
      ).to.emit(landRegistry, "PropertyVerified");
    });
  });

  describe("Verifier Management", function () {
    it("Should allow owner to add verifier", async function () {
      await landRegistry.connect(owner).addVerifier(verifier.address);
      expect(await landRegistry.verifiers(verifier.address)).to.be.true;
    });

    it("Should not allow non-owner to add verifier", async function () {
      await expect(
        landRegistry.connect(user1).addVerifier(verifier.address)
      ).to.be.revertedWith("OwnableUnauthorizedAccount");
    });

    it("Should allow owner to remove verifier", async function () {
      await landRegistry.connect(owner).addVerifier(verifier.address);
      await landRegistry.connect(owner).removeVerifier(verifier.address);
      expect(await landRegistry.verifiers(verifier.address)).to.be.false;
    });

    it("Should not allow removing contract owner as verifier", async function () {
      await expect(
        landRegistry.connect(owner).removeVerifier(owner.address)
      ).to.be.revertedWith("Cannot remove contract owner");
    });
  });

  describe("Property Transfer", function () {
    beforeEach(async function () {
      // Register two users
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
      await landRegistry.connect(user2).registerOwner(
        "Jane Smith",
        "ID789012",
        "jane@example.com"
      );

      // Register and verify property
      await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );
      await landRegistry.connect(owner).verifyProperty(1);
    });

    it("Should create transfer request", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );

      const transferRequest = await landRegistry.getTransferRequestDetails(1);
      expect(transferRequest.propertyId).to.equal(1);
      expect(transferRequest.fromOwner).to.equal(user1.address);
      expect(transferRequest.toOwner).to.equal(user2.address);
      expect(transferRequest.isApproved).to.be.false;
      expect(transferRequest.isCompleted).to.be.false;
    });

    it("Should not allow transfer of unverified property", async function () {
      await landRegistry.connect(user1).registerProperty(
        "456 Oak Ave",
        "Uptown",
        "Boston",
        "MA",
        1500,
        "QmHash456"
      );

      await expect(
        landRegistry.connect(user1).createTransferRequest(
          2,
          user2.address,
          "QmTransferDoc456"
        )
      ).to.be.revertedWith("Property must be verified");
    });

    it("Should not allow non-owner to create transfer request", async function () {
      await expect(
        landRegistry.connect(user2).createTransferRequest(
          1,
          user3.address,
          "QmTransferDoc123"
        )
      ).to.be.revertedWith("Not the property owner");
    });

    it("Should approve transfer request", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );

      await landRegistry.connect(owner).approveTransferRequest(1);
      const transferRequest = await landRegistry.getTransferRequestDetails(1);
      expect(transferRequest.isApproved).to.be.true;
    });

    it("Should complete approved transfer", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );
      await landRegistry.connect(owner).approveTransferRequest(1);
      await landRegistry.connect(user1).completeTransfer(1);

      const propertyDetails = await landRegistry.getPropertyDetails(1);
      expect(propertyDetails.currentOwner).to.equal(user2.address);

      const transferRequest = await landRegistry.getTransferRequestDetails(1);
      expect(transferRequest.isCompleted).to.be.true;
    });

    it("Should update property lists after transfer", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );
      await landRegistry.connect(owner).approveTransferRequest(1);
      await landRegistry.connect(user1).completeTransfer(1);

      const user1Properties = await landRegistry.getOwnerProperties(user1.address);
      const user2Properties = await landRegistry.getOwnerProperties(user2.address);

      expect(user1Properties.length).to.equal(0);
      expect(user2Properties.length).to.equal(1);
      expect(user2Properties[0]).to.equal(1);
    });

    it("Should not complete unapproved transfer", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );

      await expect(
        landRegistry.connect(user1).completeTransfer(1)
      ).to.be.revertedWith("Transfer not approved");
    });

    it("Should emit PropertyTransferred event", async function () {
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );
      await landRegistry.connect(owner).approveTransferRequest(1);

      await expect(
        landRegistry.connect(user1).completeTransfer(1)
      ).to.emit(landRegistry, "PropertyTransferred");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
      await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );
    });

    it("Should return total properties", async function () {
      expect(await landRegistry.getTotalProperties()).to.equal(1);
    });

    it("Should return total transfer requests", async function () {
      await landRegistry.connect(user2).registerOwner(
        "Jane Smith",
        "ID789012",
        "jane@example.com"
      );
      await landRegistry.connect(owner).verifyProperty(1);
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );

      expect(await landRegistry.getTotalTransferRequests()).to.equal(1);
    });

    it("Should return property transfer history", async function () {
      await landRegistry.connect(user2).registerOwner(
        "Jane Smith",
        "ID789012",
        "jane@example.com"
      );
      await landRegistry.connect(owner).verifyProperty(1);
      await landRegistry.connect(user1).createTransferRequest(
        1,
        user2.address,
        "QmTransferDoc123"
      );
      await landRegistry.connect(owner).approveTransferRequest(1);
      await landRegistry.connect(user1).completeTransfer(1);

      const history = await landRegistry.getPropertyTransferHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(1);
    });
  });

  describe("Document Update", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).registerOwner(
        "John Doe",
        "ID123456",
        "john@example.com"
      );
      await landRegistry.connect(user1).registerProperty(
        "123 Main St",
        "Downtown",
        "New York",
        "NY",
        1000,
        "QmHash123"
      );
    });

    it("Should allow owner to update property document", async function () {
      await landRegistry.connect(user1).updatePropertyDocument(1, "QmNewHash456");
      const propertyDetails = await landRegistry.getPropertyDetails(1);
      expect(propertyDetails.documentHash).to.equal("QmNewHash456");
    });

    it("Should not allow non-owner to update property document", async function () {
      await expect(
        landRegistry.connect(user2).updatePropertyDocument(1, "QmNewHash456")
      ).to.be.revertedWith("Not the property owner");
    });
  });
});
