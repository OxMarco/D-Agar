// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRollupInbox} from "./interfaces/IRollupInbox.sol";
import {IRollup} from "./interfaces/IRollup.sol";
import {Utils} from "./libraries/Utils.sol";
import {Dagar} from "./Dagar.sol";

contract DagarFactoryDemo {
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
    uint256 public constant createFee = 0.207 ether;
    uint256 public constant joinFee = 0.107 ether;
    uint256 public constant gas = 0.01 ether;

    event NewGameCreated(uint256 indexed gameId);
    event NewPlayerJoined(address indexed player, uint256 indexed gameId);
    event GameCompleted(address indexed winner, uint256 indexed gameId);
    event NewRollupCreated(address indexed chainAddress, uint256 indexed chainId);

    error GameStillOngoing();
    error NoActiveGame();
    error InvalidFee();
    error NotAPlayer();
    error NoBalanceToClaim();

    constructor() {
        id = 0;
    }
    
    function createGame(uint256 chainId, address chainAddress, uint256 bet) external payable {
        if (msg.value != createFee) revert InvalidFee();
        if (currentGame.id != 0 && currentGame.deadline >= block.timestamp) revert GameStillOngoing();

        address[] memory players = new address[](0);
        currentGame = Game({
            players: players,
            seed: 0,
            pot: msg.value,
            winner: address(0),
            chainAddress: chainAddress,
            chainId: chainId,
            id: ++id,
            bet: bet,
            deadline: 0
        });

        IRollup rollup = IRollup(currentGame.chainAddress);
        address inbox = rollup.inbox();
        address outbox = rollup.outbox();

        address to = currentGame.chainAddress;
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = 0.2 ether;
        address submissionRefundAddress = msg.sender;
        address valueRefundAddress = msg.sender;
        uint256 maxGas = 7000000;
        uint256 gasPriceBid = 1 gwei;
        bytes memory constructorData = abi.encode(currentGame.seed, address(this), outbox);
        bytes memory data = abi.encodePacked(type(Dagar).creationCode, constructorData);

        IRollupInbox(inbox).createRetryableTicket{value: createFee}(
            to, l2CallValue, maxSubmissionCost, submissionRefundAddress, valueRefundAddress, maxGas, gasPriceBid, data
        );

        emit NewGameCreated(id);
    }

    function activateGame(uint256 bet) external {
        currentGame.bet = bet;
        currentGame.seed = 0; // TODO get it from Pyth
    }

    function totalJoinGameGasCost() external view returns (uint256) {
        return currentGame.bet + joinFee + gas;
    }

    function joinGame(address gameContract) external payable {
        if (currentGame.winner != address(0)) revert NoActiveGame();
        if (currentGame.id == 0) revert NoActiveGame();
        if (msg.value != currentGame.bet + joinFee + gas) revert InvalidFee();

        currentGame.players.push(msg.sender);
        currentGame.pot += currentGame.bet;

        address inbox = IRollup(currentGame.chainAddress).inbox();
        IRollupInbox box = IRollupInbox(inbox);
        box.depositEth{value: gas}();

        address to = gameContract;
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = 0.1 ether;
        address submissionRefundAddress = msg.sender;
        address valueRefundAddress = msg.sender;
        uint256 maxGas = 7000000;
        uint256 gasPriceBid = 1 gwei;
        bytes memory data = abi.encodeWithSignature("joinGame(address)", msg.sender);

        box.createRetryableTicket{value: joinFee}(
            to, l2CallValue, maxSubmissionCost, submissionRefundAddress, valueRefundAddress, maxGas, gasPriceBid, data
        );

        emit NewPlayerJoined(msg.sender, currentGame.id);
    }

    // TODO to be invoked by the game on the Orbit chain
    function completeGame(address winner) external {
        if (currentGame.winner != address(0)) revert NoActiveGame();

        currentGame.winner = winner;
        winners[winner] = currentGame.pot;

        emit GameCompleted(winner, currentGame.id);
    }

    function redeemPot() external {
        if (winners[msg.sender] == 0) revert NoBalanceToClaim();

        uint256 amount = winners[msg.sender];
        winners[msg.sender] = 0;
        (bool success,) = msg.sender.call{value: amount}("");
        assert(success);
    }
}
