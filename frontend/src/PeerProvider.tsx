import { createContext, ReactNode, useContext } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useToast } from '@chakra-ui/react';
import { BlobData } from './types';

interface PeerContextType {
  broadcastPosition: (mainBlob: BlobData) => void;
  peer: Peer | null;
  playersData: BlobData[];
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (context === undefined) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
};

const PeerProvider = ({ address, children }: { address: string, children: ReactNode }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [playersData, setPlayersData] = useState<BlobData[]>([]);
  const [remotePeers, setRemotePeers] = useState<string[]>([]);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const toast = useToast();

  useEffect(() => {
    const userId = `peer_${address}`;
    const newPeer = new Peer(userId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      pingInterval: 5000,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    newPeer.on('open', (id: string) => {
      setPeer(newPeer);
      /*toast({
        status: 'info',
        title: `Connected with ID: ${id}`,
        isClosable: true,
      });*/
    });

    newPeer.on('connection', (connection) => {
      connection.on('open', () => {
        setConnections((prevConnections) => [...prevConnections, connection]);
        setRemotePeers((prevRemotePeers) => [...prevRemotePeers, connection.peer]);
        toast({
          status: 'info',
          title: `User ${connection.peer} joined`,
          isClosable: true,
        });

        connection.on('data', (msg: any) => {
          setPlayersData((prevPlayers) => {
            const updatedPlayers = [...prevPlayers];
            const playerIndex = updatedPlayers.findIndex((player) => player.address === msg.address);
            if (playerIndex > -1) {
              updatedPlayers[playerIndex] = msg;
            } else {
              updatedPlayers.push(msg);
            }
            return updatedPlayers;
          });
        });

        connection.on('close', () => {
          setConnections((prevConnections) => prevConnections.filter((conn) => conn.peer !== connection.peer));
          setRemotePeers((prevRemotePeers) => prevRemotePeers.filter((peer) => peer !== connection.peer));
          toast({
            status: 'info',
            title: `User ${connection.peer} disconnected`,
            isClosable: true,
          });
        });

        connection.on('error', (err: any) => {
          toast({
            status: 'error',
            title: `Connection error with ${connection.peer}`,
            description: err.toString(),
            isClosable: true,
          });
        });
      });
    });

    newPeer.on('error', (err) => {
      toast({
        status: 'error',
        title: 'Peer connection error',
        description: err.toString(),
        isClosable: true,
      });
      console.error('Peer connection error:', err);
    });

    return () => {
      newPeer.destroy();
    };
  }, [address, toast]);

  const broadcastPosition = useCallback((mainBlob: BlobData) => {
    connections.forEach((conn) => {
      conn.send({ type: 'position', data: mainBlob });
    });
  }, [connections]);

  return (
    <PeerContext.Provider value={{ broadcastPosition, peer, playersData }}>
      {children}
    </PeerContext.Provider>
  );
};

export default PeerProvider;
