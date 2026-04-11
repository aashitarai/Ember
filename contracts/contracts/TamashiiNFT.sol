// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Soulbound NFT (non-transferable) for discipline tiers.
contract TamashiiNFT is ERC721, Ownable {
    uint256 public nextId = 1;
    mapping(address => uint256) public tokenOf;

    constructor() ERC721("Tamashii", "TAMA") {}

    function mint(address to) external onlyOwner returns (uint256) {
        require(to != address(0), "bad_to");
        require(tokenOf[to] == 0, "already_has");
        uint256 id = nextId++;
        tokenOf[to] = id;
        _safeMint(to, id);
        return id;
    }

    // Soulbound: disable transfers/approvals
    function approve(address, uint256) public pure override {
        revert("SOULBOUND");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("SOULBOUND");
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("SOULBOUND");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("SOULBOUND");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("SOULBOUND");
    }
}

