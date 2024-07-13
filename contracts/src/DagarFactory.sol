// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRollupCreator} from "./interfaces/IRollupCreator.sol";
import {IRollupInbox} from "./interfaces/IRollupInbox.sol";
import {IRollup} from "./interfaces/IRollup.sol";
import {Utils} from "./libraries/Utils.sol";
import {Dagar} from "./Dagar.sol";

// rollupCreator = 0x06E341073b2749e0Bb9912461351f716DeCDa9b0

contract DagarFactory {
    struct Game {
        address[] players;
        uint256 seed;
        uint256 pot;
        address winner;
        uint256 id;
        address chainAddress;
        uint256 chainId;
        uint256 bet;
        uint256 deadline;
    }

    uint256 public id;
    Game public currentGame;
    mapping(address user => uint256 balance) public winners;

    uint256 public immutable fee = 0.1 ether;
    IRollupCreator public immutable rollupCreator;

    event NewGameCreated(uint256 indexed gameId);
    event NewPlayerJoined(address indexed player, uint256 indexed gameId);
    event GameCompleted(address indexed winner, uint256 indexed gameId);
    event NewRollupCreated(address indexed chainAddress, uint256 indexed chainId);

    error GameStillOngoing();
    error NoActiveGame();
    error InvalidFee();
    error NotAPlayer();
    error NoBalanceToClaim();

    constructor(address _rollupCreator) {
        rollupCreator = IRollupCreator(_rollupCreator);
        id = 0;
    }

    function generateChainConfig(uint256 chain) public view returns (string memory) {
        string memory initialOwner = Utils.toAsciiString(address(this));
        string memory chainId = Utils.uintToString(chain);

        return string(
            abi.encodePacked(
                '{"homesteadBlock":0,"daoForkBlock":null,"daoForkSupport":true,"eip150Block":0,"eip150Hash":"0x0000000000000000000000000000000000000000000000000000000000000000","eip155Block":0,"eip158Block":0,"byzantiumBlock":0,"constantinopleBlock":0,"petersburgBlock":0,"istanbulBlock":0,"muirGlacierBlock":0,"berlinBlock":0,"londonBlock":0,"clique":{"period":0,"epoch":0},"arbitrum":{"EnableArbOS":true,"AllowDebugPrecompiles":false,"DataAvailabilityCommittee":true,"InitialArbOSVersion":20,"GenesisBlockNum":0,"MaxCodeSize":24576,"MaxInitCodeSize":49152,"InitialChainOwner":"',
                initialOwner,
                '"},"chainId":',
                chainId,
                "}"
            )
        );
    }

    function createGame() external payable {
        if (msg.value != fee) revert InvalidFee();
        if (currentGame.id != 0 && currentGame.deadline >= block.timestamp) revert GameStillOngoing();

        address[] memory players = new address[](0);
        currentGame = Game({
            players: players,
            seed: 0,
            pot: msg.value,
            winner: address(0),
            chainAddress: address(0),
            chainId: 0,
            id: ++id,
            bet: 0,
            deadline: block.timestamp + 10 minutes
        });

        // Create a new rollup
        uint256 chainId = block.timestamp;
        address[] memory validators = new address[](1);
        validators[0] = 0xCd83B239CbD3aCdb7bBB575A8B6e3A29CB54C570;
        IRollupCreator.MaxTimeVariation memory t = IRollupCreator.MaxTimeVariation({
            delayBlocks: 5760,
            futureBlocks: 48,
            delaySeconds: 86400,
            futureSeconds: 3600
        });
        IRollupCreator.Config memory configs = IRollupCreator.Config({
            confirmPeriodBlocks: 150,
            extraChallengeTimeBlocks: 0,
            stakeToken: address(0),
            baseStake: 1e18,
            wasmModuleRoot: 0x8b104a2e80ac6165dc58b9048de12f301d70b02a0ab51396c22b4b4b802a16a4,
            owner: address(this),
            loserStakeEscrow: address(0),
            chainId: chainId,
            chainConfig: generateChainConfig(chainId),
            genesisBlockNum: 0,
            sequencerInboxMaxTimeVariation: t
        });

        IRollupCreator.RollupDeploymentParams memory params = IRollupCreator.RollupDeploymentParams({
            config: configs,
            batchPoster: 0x9e4D4401E04f9300c48BdEA07078E7d14Cc602b5,
            validators: validators,
            maxDataSize: 104857,
            nativeToken: address(0),
            deployFactoriesToL2: false, // TODO revert to true
            maxFeePerGasForRetryables: 1e8
        });

        address chainAddress = rollupCreator.createRollup{value: msg.value}(params);
        currentGame.chainAddress = chainAddress;
        currentGame.chainId = chainId;

        emit NewGameCreated(id);
        emit NewRollupCreated(chainAddress, chainId);
    }

    function activateGame(uint256 bet) external {
        currentGame.bet = bet;
        currentGame.seed = 0; // TODO get it from Pyth

        _deployContract();
    }

    function joinGame() external payable {
        if (currentGame.winner != address(0)) revert NoActiveGame();
        if (currentGame.id == 0 || currentGame.deadline < block.timestamp) revert NoActiveGame();
        if (msg.value != currentGame.bet) revert InvalidFee();

        currentGame.players.push(msg.sender);
        currentGame.pot += msg.value;

        address inbox = IRollup(currentGame.chainAddress).inbox();
        IRollupInbox box = IRollupInbox(inbox);
        box.depositEth{value: msg.value}();

        _joinGame(box);

        emit NewPlayerJoined(msg.sender, currentGame.id);
    }

    // TODO to be invoked by the game on the Orbit chain
    function completeGame(address winner) external {
        if (currentGame.winner != address(0)) revert NoActiveGame();

        currentGame.winner = winner;
        winners[winner] = currentGame.pot;
        IRollup(currentGame.chainAddress).pause(); // TODO this triggers a revert

        emit GameCompleted(winner, currentGame.id);
    }

    function redeemPot() external {
        if (winners[msg.sender] == 0) revert NoBalanceToClaim();

        uint256 amount = winners[msg.sender];
        winners[msg.sender] = 0;
        (bool success,) = msg.sender.call{value: amount}("");
        assert(success);
    }

    function _deployContract() internal {
        IRollup rollup = IRollup(currentGame.chainAddress);
        address inbox = rollup.inbox();
        address outbox = rollup.outbox();

        address to = currentGame.chainAddress;
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = 0.5 ether;
        address submissionRefundAddress = msg.sender;
        address valueRefundAddress = msg.sender;
        uint256 maxGas = 7000000;
        uint256 gasPriceBid = 1 gwei;
        bytes memory constructorData = abi.encode(currentGame.seed, address(this), outbox);
        bytes memory data = abi.encodePacked(type(Dagar).creationCode, constructorData);

        IRollupInbox(inbox).createRetryableTicket{value: msg.value}(
            to, l2CallValue, maxSubmissionCost, submissionRefundAddress, valueRefundAddress, maxGas, gasPriceBid, data
        );
    }

    function _joinGame(IRollupInbox inbox) internal {
        address to = currentGame.chainAddress;
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = 0.01 ether;
        address submissionRefundAddress = msg.sender;
        address valueRefundAddress = msg.sender;
        uint256 maxGas = 3000000;
        uint256 gasPriceBid = 1 gwei;
        bytes memory data = abi.encodeWithSignature("joinGame(address)", msg.sender);

        inbox.createRetryableTicket{value: msg.value}(
            to, l2CallValue, maxSubmissionCost, submissionRefundAddress, valueRefundAddress, maxGas, gasPriceBid, data
        );
    }
}
