// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRollupOutbox} from "./interfaces/IRollupOutbox.sol";

contract Dagar {
    struct Player {
        uint256 id;
        uint16 size;
        uint16 kills;
        bool alive;
    }

    uint256 public constant mapWidth = 1000;
    uint256 public constant mapHeight = 1000;
    uint256 public constant numFoodParticles = 100;

    uint256 public immutable seed;
    address public immutable source;
    address public immutable outbox;

    uint256 public playerId;
    mapping(address user => Player player) public players;
    uint256 public activePlayers;

    event NewPlayerJoined(address indexed player, uint256 indexed playerId);

    error NotAPlayer();
    error AlreadyPlaying();
    error InvalidAction();

    modifier isActivePlayer() {
        if (!players[msg.sender].alive) revert NotAPlayer();
        _;
    }

    constructor(uint256 _seed, address _source, address _outbox) {
        seed = _seed;
        source = _source;
        outbox = _outbox;
        playerId = 0;
    }

    ////////////// Cross-chain functions //////////////

    function joinGame(address player) external {
        if (players[msg.sender].size != 0) revert AlreadyPlaying();

        players[msg.sender] = Player({id: ++playerId, alive: true, size: 1, kills: 0});
        activePlayers += 1;

        emit NewPlayerJoined(player, playerId);
    }

    function _terminateGame(address winner) internal {
        // TODO send cross-chain transaction to Arbitrum One
        bytes memory data = abi.encodeWithSignature("completeGame(address)", winner);
        IRollupOutbox(outbox).sendL2Message(abi.encode(source, data));
    }

    ////////////// Local functions //////////////

    function eatPlayer(address player) external isActivePlayer {
        if (!players[player].alive) revert InvalidAction();

        players[msg.sender].kills += 1;
        players[player].alive = false;
        activePlayers -= 1;

        if (activePlayers == 1) _terminateGame(msg.sender);
    }

    function eatFood(uint256 x, uint256 y) external isActivePlayer {
        if (!_isFoodAtPosition(x, y, block.timestamp)) revert InvalidAction();

        players[msg.sender].size += 1;
    }

    function _isFoodAtPosition(uint256 x, uint256 y, uint256 timestamp) internal view returns (bool) {
        for (uint256 i = 0; i < numFoodParticles; i++) {
            (uint256 foodX, uint256 foodY) = generateFoodPosition(i, timestamp);
            if (foodX == x && foodY == y) {
                return true;
            }
        }
        return false;
    }

    function generateFoodPosition(uint256 index, uint256 timestamp) public view returns (uint256, uint256) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(seed, timestamp, index)));
        uint256 x = randomHash % mapWidth;
        uint256 y = (randomHash / mapWidth) % mapHeight;
        return (x, y);
    }
}
