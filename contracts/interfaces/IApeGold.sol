//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IApeGold {
    function stake() external;

    function unstake() external;

    function redeemRewards() external;
}
