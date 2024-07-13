import { createContext, ReactNode, useContext } from 'react';
import { useReadContract } from 'wagmi';
import { DAGAR_ABI, DAGAR_ADDRESS } from "./contracts/Dagar";

interface Web3ContextType {
  activePlayers: any;
  players: any;
  foodBlobs: any;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const Web3Provider = ({ account, children }: { account: any, children: ReactNode }) => {
  const activePlayers = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'activePlayers',
  });
  const players = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'getPlayers',
  });
  const foodBlobs = useReadContract({
    abi: DAGAR_ABI,
    address: DAGAR_ADDRESS,
    functionName: 'getBlobs',

  });

  return (
    <Web3Context.Provider value={{ activePlayers, players, foodBlobs }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
