// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRollupInbox {
    function depositEth() external payable;
    function createRetryableTicket(
        address to,
        uint256 l2CallValue,
        uint256 maxSubmissionCost,
        address submissionRefundAddress,
        address valueRefundAddress,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) external payable returns (uint256);
}
