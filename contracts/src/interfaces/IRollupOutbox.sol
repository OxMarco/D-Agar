// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRollupOutbox {
    function sendL2Message(bytes calldata message) external returns (uint256);
}
