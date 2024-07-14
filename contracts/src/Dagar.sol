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
    uint256 public constant numBlobParticles = 100;

    uint256 public immutable seed;
    address public immutable source;
    address public immutable outbox;

    uint256 public playerId;
    mapping(address user => Player player) public playerData;
    address[] public players;
    uint256 public activePlayers;

    event Alive(address indexed gameContract);
    event NewPlayerJoined(address indexed player, uint256 indexed playerId);

    error NotAPlayer();
    error AlreadyPlaying();
    error InvalidAction();

    modifier isActivePlayer() {
        if (!playerData[msg.sender].alive) revert NotAPlayer();
        _;
    }

    constructor(uint256 _seed, address _source, address _outbox) {
        seed = _seed;
        source = _source;
        outbox = _outbox;
        playerId = 0;

        emit Alive(address(this));
    }

    ////////////// Cross-chain functions //////////////

    function joinGame(address player) external {
        if (playerData[msg.sender].size != 0) revert AlreadyPlaying();

        players.push(player);
        playerData[msg.sender] = Player({id: ++playerId, alive: true, size: 1, kills: 0});
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
        if (!playerData[player].alive) revert InvalidAction();

        playerData[msg.sender].kills += 1;
        playerData[msg.sender].size += playerData[player].size;
        playerData[player].alive = false;
        activePlayers -= 1;

        if (activePlayers == 1) _terminateGame(msg.sender);
    }

    function eatBlob(uint16 x, uint16 y) external isActivePlayer {
        if (!_isBlobAtPosition(x, y, block.timestamp)) revert InvalidAction();

        playerData[msg.sender].size += 1;
    }

    function _isBlobAtPosition(uint16 x, uint16 y, uint256 timestamp) internal view returns (bool) {
        for (uint256 i = 0; i < numBlobParticles; i++) {
            (uint16 blobX, uint16 blobY) = generateBlobPosition(i, timestamp);
            if (blobX == x && blobY == y) {
                return true;
            }
        }
        return false;
    }

    function generateBlobPosition(uint256 index, uint256 timestamp) public view returns (uint16, uint16) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(seed, timestamp, index)));
        uint256 x = randomHash % mapWidth;
        uint256 y = (randomHash / mapWidth) % mapHeight;
        return (uint16(x), uint16(y));
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }
}
