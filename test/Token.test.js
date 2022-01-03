const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");
const Token = artifacts.require("./Token.sol");

contract("Token", (accounts) => {
  // global instance of contract
  let contract;
  // stand-in baseURI
  let baseURI = "ipfs://QmZbWNKJPAjxXuNFSEaksCJVd1M6DaKQViJBYPK2BdpDEP/";
  let [alice, bob] = accounts;

  before(async () => {
    contract = await Token.deployed(baseURI);
  });

  describe("deployment", async () => {
    // Test Case 1 : Contract can be deployed successfully
    it("contract deployed successfully", async () => {
      const address = contract.address;
      // console.log(address);
      assert.notEqual(address, "");
      assert.notEqual(address, 0x0);
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    // Test Case 2 : Should return correct name and symbol NUSToken, NUS
    it("has a name and symbol", async () => {
      const name = await contract.name();
      const symbol = await contract.symbol();
      assert.equal(name, "NUSToken");
      assert.equal(symbol, "NUS");
    });
  });

  describe("minting", async () => {
    // Test Case 3: tokenURI and Transfer event should be correct
    it("creates a new token and transfer event emitted", async () => {
      const result = await contract.mintTokens(1, {
        value: web3.utils.toWei("0.01", "ether"),
      });
      const event = result.logs[0].args; // Transfer event when _safeMint is called
      let uri = await contract.tokenURI(event.tokenId);
      assert.equal(
        uri,
        "ipfs://QmZbWNKJPAjxXuNFSEaksCJVd1M6DaKQViJBYPK2BdpDEP/0"
      );
      assert.equal(
        event.from,
        "0x0000000000000000000000000000000000000000",
        "from is incorrect"
      );
      assert.equal(event.to, alice, "to is incorrect");
      assert.equal(event.tokenId, 0, "tokenId is incorrect");
    });

    // Test Case 4: Failure when quantity exceeds
    it("should reject transaction if quantity minted exceeds max supply", async () => {
      await truffleAssert.reverts(
        contract.mintTokens(216, { value: web3.utils.toWei("2.16", "ether") })
      );
    });

    // Test Case 5: Failure when not enough ether supplied
    it("should reject transaction if not enough ether supplied", async () => {
      await truffleAssert.reverts(
        contract.mintTokens(1, { value: web3.utils.toWei("0.005", "ether") })
      );
    });

    // Test Case 6: Failure when attempt to mint 0 token
    it("should reject transaction if number of tokens minted is zero", async () => {
      await truffleAssert.reverts(
        contract.mintTokens(0, { value: web3.utils.toWei("0.01", "ether") })
      );
    });
  });

  describe("querying tokens", async () => {
    // Test Case 7: Correct display of token for specific owner
    it("query of tokens for specific owner", async () => {
      await contract.mintTokens(3, {
        from: alice,
        value: web3.utils.toWei("0.03", "ether"),
      });
      await contract.mintTokens(3, {
        from: bob,
        value: web3.utils.toWei("0.03", "ether"),
      });
      await contract.mintTokens(1, {
        from: alice,
        value: web3.utils.toWei("0.03", "ether"),
      });
      let result = await contract.tokensOfOwner(accounts[0]);
      let expected = ["0", "1", "2", "3", "7"];
      assert.equal(
        result.join(","),
        expected.join(","),
        "tokens returned incorrect"
      );
      result = await contract.tokensOfOwner(accounts[1]);
      expected = ["4", "5", "6"];
      assert.equal(
        result.join(","),
        expected.join(","),
        "tokens returned incorrect"
      );
    });

    // Test Case 8: Correct display of token for all owners
    it("query of tokens for all", async () => {
      let result = await contract.tokensOfAll();
      let expected = ["0", "1", "2", "3", "4", "5", "6", "7"];
      assert.equal(
        result.join(","),
        expected.join(","),
        "tokens returned incorrect"
      );
    });
  });

  describe("pausable functionalityu", async () => {
    // Test Case 9: Failure to pause contract if called from wrong address
    it("should reject pause if called from non-owner address", async () => {
      await truffleAssert.reverts(contract.pause({ from: bob })); // alice is the owner of contract
    });

    // Test Case 10: Failure to mint Token after contract is paused
    it("should reject transaction after contract has been paused", async () => {
      await contract.pause({ from: alice });
      await truffleAssert.reverts(
        contract.mintTokens(1, { value: web3.utils.toWei("0.01", "ether") })
      );
    });
  });
});