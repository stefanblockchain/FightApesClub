//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IFightApesClub {
    function getAcrobatics(uint256 tokenId) external view returns (string memory);
    function getAlchemy(uint256 tokenId) external view returns (string memory);
    function getArmor(uint256 tokenId) external view returns (string memory);
    function getAttack(uint256 tokenId) external view returns (string memory);
    function getBlock(uint256 tokenId) external view returns (string memory);
    function getGen(uint256 tokenId) external view returns (string memory);
    function getAgility(uint256 tokenId) external view returns (string memory);
    function getAthletics(uint256 tokenId) external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function mintAdmin(uint256 amount, address user) external;

    function totalSupply() external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract BreedControllerV1 {
    IFightApesClub public immutable iFightApesClub;
    uint256 public constant MAX_INDEX = 18000;
    uint256 public constant GEN_0 = 12000;
    uint256 [] public usedApes;
    
    constructor(address _iFightApesClub) {
        iFightApesClub = IFightApesClub(_iFightApesClub);
    }

    event ApeBreeded(address indexed user, uint256 time);
    
    function breed(uint256 tokenIdA, uint256 tokenIdB) public {
        require(iFightApesClub.totalSupply() < MAX_INDEX, "Can't breed anymore");
        require(tokenIdA < GEN_0, "tokenIdA not a GEN 0");
        require(tokenIdB < GEN_0, "tokenIdB not a GEN 0");
        require(iFightApesClub.ownerOf(tokenIdA) == msg.sender, "Not owner of tokenIdA");
        require(iFightApesClub.ownerOf(tokenIdB) == msg.sender, "Not owner of tokenIdB");
        require(!_isApeAdded(tokenIdA), "tokenIdA already used");
        require(!_isApeAdded(tokenIdB), "tokenIdB already used");

        _addApe(tokenIdA);
        _addApe(tokenIdB);

        iFightApesClub.mintAdmin(1, msg.sender);

        emit ApeBreeded(msg.sender, block.number); 
    }

    function _addApe(uint256 ape) internal {
        usedApes.push(ape);
    }

    function _isApeAdded(uint256 ape) internal view returns (bool) {
        for (uint256 i = 0; i < usedApes.length; i++) {
            if(usedApes[i] == ape)
                return true;
        }
        return false;
    }

    function tokenIdBreedAllowed (uint256 tokenId) public view returns (bool) {
        return tokenId > 0 && tokenId < GEN_0 && _isApeAdded(tokenId);
    }
}
