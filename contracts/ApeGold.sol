//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/IApeGold.sol";
import "./libraries/Integers.sol";

interface IFightApesClub {
    function getAcrobatics(uint256 tokenId)
        external
        view
        returns (string memory);

    function getAlchemy(uint256 tokenId) external view returns (string memory);

    function getArmor(uint256 tokenId) external view returns (string memory);

    function getAttack(uint256 tokenId) external view returns (string memory);

    function getBlock(uint256 tokenId) external view returns (string memory);

    function getAgility(uint256 tokenId) external view returns (string memory);

    function getAthletics(uint256 tokenId)
        external
        view
        returns (string memory);

    function tokenURI(uint256 tokenId) external view returns (string memory);

    function mintAdmin(uint256 amount, address user) external;

    function totalSupply() external view returns (uint256);

    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract ApeGold is Ownable, Pausable, ERC20, IApeGold {
    IERC721Enumerable public immutable fightApeToken;
    mapping(address => uint256) public rewards;
    uint256 internal lastRewardsUpdateTime;
    uint256 internal totalPoints = 0;
    uint256 public rewardsPerBlock = 10 ^ 19;
    mapping(uint256 => uint256) internal tokenTimeStaked;
    mapping(address => bool) internal userStaked;

    struct StakeDaetails {
        address owner;
        uint256[] tokens;
    }
    StakeDaetails[] internal stakeDetails;

    IFightApesClub public immutable iFightApesClub;

    constructor(address _fightApeToken) ERC20("ApeGold", "APGLD") Pausable() {
        fightApeToken = IERC721Enumerable(_fightApeToken);
        iFightApesClub = IFightApesClub(_fightApeToken);
        lastRewardsUpdateTime = block.timestamp;
    }

    function stake() external {
        _updateRewards();

        uint256[] memory tokensByOwner = getTokensIdByOwner(msg.sender);
        uint256 _points = 0;
        for (uint256 i = 0; i < tokensByOwner.length; i++) {
            fightApeToken.safeTransferFrom(
                msg.sender,
                address(this),
                tokensByOwner[i]
            );
            _points += getRating(tokensByOwner[i]);
            tokenTimeStaked[tokensByOwner[i]] = block.timestamp;
            _insertUserData(msg.sender, tokensByOwner);
            userStaked[msg.sender] = true;
        }
        totalPoints += _points;
    }

    function unstake() external {
        _redeemRewards();

        StakeDaetails memory _stakeDetails = _findUserData(msg.sender);
        for (uint256 i = 0; i < _stakeDetails.tokens.length; i++) {
            totalPoints -= uint256(getRating(_stakeDetails.tokens[i]));
            fightApeToken.safeTransferFrom(
                address(this),
                msg.sender,
                _stakeDetails.tokens[i]
            );
        }
        _removeUserData(msg.sender);
        userStaked[msg.sender] = false;
    }

    function redeemRewards() external {
        require(rewards[msg.sender] > 0, "No rewards for given user");
        _redeemRewards();
    }

    function _updateRewards() internal {
        if (paused()) return;
        uint256 _prevRewardTimestamp = lastRewardsUpdateTime;
        lastRewardsUpdateTime = block.timestamp;

        for (uint256 i = 0; i < stakeDetails.length; i++) {
            StakeDaetails memory _stakeDetail = stakeDetails[i];
            rewards[msg.sender] += _calculateUserRewards(
                _stakeDetail,
                _prevRewardTimestamp
            );
        }
    }

    function pause() public onlyOwner whenNotPaused {
        _updateRewards();
        _pause();
    }

    function unpause() public onlyOwner whenPaused {
        _updateRewards();
        _unpause();
    }

    function getTokensIdByOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory _tokensOfOwner = new uint256[](
            fightApeToken.balanceOf(owner)
        );
        uint256 i;

        for (i = 0; i < fightApeToken.balanceOf(owner); i++) {
            _tokensOfOwner[i] = fightApeToken.tokenOfOwnerByIndex(owner, i);
        }
        return (_tokensOfOwner);
    }

    function _redeemRewards() internal returns (uint256) {
        _updateRewards();
        uint256 _balance = rewards[msg.sender];
        rewards[msg.sender] = 0;
        _mint(msg.sender, _balance);
        return _balance;
    }

    function getReward(address user) public view returns (uint256) {
        return rewards[user];
    }

    function setRewardsPerBlock(uint256 reward) public onlyOwner {
        rewardsPerBlock = reward;
    }

    function _calculateUserRewards(
        StakeDaetails memory stakeDetail,
        uint256 timeBlock
    ) internal returns (uint256) {
        uint256 _rewardAmount = 0;
        for (uint256 i = 0; i < stakeDetail.tokens.length; i++) {
            uint256 _token = stakeDetail.tokens[i];
            _rewardAmount +=
                ((timeBlock - tokenTimeStaked[_token]) *
                    rewardsPerBlock *
                    getRating(_token)) /
                totalPoints;
            tokenTimeStaked[_token] = timeBlock;
        }
        return _rewardAmount;
    }

    function getRating(uint256 tokenId) public view returns (uint256) {
        uint256 _rating = uint256(
            Integers.parseInt(iFightApesClub.getAlchemy(tokenId))
        ) +
            uint256(Integers.parseInt(iFightApesClub.getArmor(tokenId))) +
            uint256(Integers.parseInt(iFightApesClub.getAttack(tokenId))) +
            uint256(Integers.parseInt(iFightApesClub.getBlock(tokenId))) +
            uint256(Integers.parseInt(iFightApesClub.getAgility(tokenId))) +
            uint256(Integers.parseInt(iFightApesClub.getAthletics(tokenId)));

        return _rating;
    }

    function _findUserData(address user)
        internal
        view
        returns (StakeDaetails memory)
    {
        require(userStaked[user], "User didn't staked");
        for (uint256 i = 0; i < stakeDetails.length; i++) {
            if (stakeDetails[i].owner == user) return stakeDetails[i];
        }
    }

    function _removeUserData(address user) internal {
        uint256 indexOf = 0;
        for (uint256 i = 0; i < stakeDetails.length; i++) {
            if (stakeDetails[i].owner == user) {
                indexOf = i;
                break;
            }
        }
        stakeDetails[indexOf] = stakeDetails[stakeDetails.length - 1];
        stakeDetails.pop();
    }

    function _insertUserData(address user, uint256[] memory tokens) internal {
        if (!userStaked[user]) {
            StakeDaetails memory _stakeDetail = StakeDaetails(user, tokens);
            stakeDetails.push(_stakeDetail);
            return;
        }
    }
}
