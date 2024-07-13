// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRollupCreator {
    struct MaxTimeVariation {
        uint256 delayBlocks;
        uint256 futureBlocks;
        uint256 delaySeconds;
        uint256 futureSeconds;
    }

    struct Config {
        uint64 confirmPeriodBlocks;
        uint64 extraChallengeTimeBlocks;
        address stakeToken;
        uint256 baseStake;
        bytes32 wasmModuleRoot;
        address owner;
        address loserStakeEscrow;
        uint256 chainId;
        string chainConfig;
        uint64 genesisBlockNum;
        MaxTimeVariation sequencerInboxMaxTimeVariation;
    }

    struct RollupDeploymentParams {
        Config config;
        address batchPoster;
        address[] validators;
        uint256 maxDataSize;
        address nativeToken;
        bool deployFactoriesToL2;
        uint256 maxFeePerGasForRetryables;
    }

    function createRollup(RollupDeploymentParams memory deployParams) external payable returns (address);
}
