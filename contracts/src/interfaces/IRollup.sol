// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRollup {
    function inbox() external view returns (address);
    function outbox() external view returns (address);
    function chainId() external view returns (uint256);
    function paused() external view returns (bool);
    function pause() external;
}
