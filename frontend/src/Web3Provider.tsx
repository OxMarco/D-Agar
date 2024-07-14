import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { DAGAR_ABI, DAGAR_ADDRESS } from "./contracts/Dagar";
import { arbitrumSepolia } from 'viem/chains';
import { createPublicClient, createWalletClient, custom, http } from 'viem';

interface Web3ContextType {
  account: any;
  activePlayers: any;
  players: any;
  seed: any;
  joinGame: any;
  eatPlayer: any;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
 
const Web3Provider = ({ children }: { children: ReactNode }) => {
  const account = useAccount()

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
  })
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(window.ethereum!)
  })

  const activePlayers = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'activePlayers',
  });
  const seed = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'seed',
  });
  const players = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'getPlayers',
  });
  
  const eatPlayer = async (player: string) => {
    const [account] = await walletClient.getAddresses()
    const { request } = await publicClient.simulateContract({
      account,
      address: DAGAR_ADDRESS,
      abi: DAGAR_ABI,
      functionName: 'eatPlayer',
      args: [player]
    })
    await walletClient.writeContract(request)
  }

  const joinGame = async (address: string) => {
    const [activeAccount] = await walletClient.getAddresses()
    const { request } = await publicClient.simulateContract({
      account: activeAccount,
      address: DAGAR_ADDRESS,
      abi: DAGAR_ABI,
      functionName: 'joinGame',
      args: [address]
    })
    await walletClient.writeContract(request)
  }

  const contextValue = useMemo(() => {
    return { account, activePlayers, players, seed, joinGame, eatPlayer }
  }, [account, activePlayers, players, seed, joinGame, eatPlayer])

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
