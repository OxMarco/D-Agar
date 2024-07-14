# D-Agar

A decentralized version of the popular multiplayer browser game [agar.io](https://agar.io), where players try to get as big as possible and eat each other.

## Rationale

Browser games are becoming increasingly popular, with the leader Agar.io boasting over 6 million active users. This project aims to showcase how to leverage browser gaming to introduce more people to web3.

In order to do so, the user experience must be:
- Fast and easy, without complicated popups or endlessly-loading frontends.
- Cheap, as nobody likes to spend excessive gas just to play.
- Secure, thanks to smart contract logic preventing cheating.

## How it works

### Backend

1. A user calls the *DagarFactory* contract to deploy a new rollup. The rollup is picked up by the backend, and a node is set up for it.
2. The user deploys the game smart contract from Arbitrum Sepolia to the new L3 using the relay bridge.
3. Other users join the game and bridge a little ETH to the L3.
4. Each relevant game interaction (map generation, food eating, and player kills) is registered and validated on-chain, leveraging the L3 for its speed and low gas fees.
5. When only one player remains, they can kill the L3 and relay a message to the L2 to claim the pot.

Map generation is based on a seed unique to each game, which is then fed into a random number generator to create 200 food dots. Whenever a player eats a food dot, its position is validated on-chain to ensure they cannot cheat. The same model applies to player-to-player interactions, verifying that both players are alive and that the larger player kills the smaller one (incrementing its size).

### Frontend

A combination of React and canvas to create smooth transitions.

## How it was made

- **React**
- **Chakra UI**
- **Arbitrum**: Through the factory contract, we spawn a new Orbit L3 chain, deploy the game contract there, and bridge the ETH necessary for users to play. Once the game is completed, the winner is relayed back to Arbitrum One and the bets are awarded to them.
- **NounsDAO**: Provides custom skins for the players based on the NFTs they hold in their wallets.
- **Dynamic Wallet**: A seamless signup/signin experience with headless interactions (not implemented) to provide a web2-like user experience.
- **PeerJS**: Enables peer-to-peer communication, allowing players to connect and exchange real-time game data without relying on a centralized server.
- **Smart Contracts**: The "backend" of the game, responsible for generating the playing field, validating kills, and collecting the bets to be awarded to the winner.
