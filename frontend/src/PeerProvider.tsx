import { createContext, ReactNode, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import Peer, { DataConnection } from 'peerjs'
import { useToast } from '@chakra-ui/react'
import { BlobData } from './types'
import { useWeb3 } from './Web3Provider'

const PeerContext = createContext<any>({})

export const usePeer = () => {
  const context = useContext(PeerContext)
  if (context === undefined) {
    throw new Error('usePeer must be used within a PeerProvider')
  }
  return context
}

const PeerProvider = ({ children }: { children: ReactNode }) => {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [opponent, setOpponent] = useState<BlobData>()
  const [connection, setConnection] = useState<DataConnection>()
  const [connections, setConnections] = useState<DataConnection[]>([])
  const toast = useToast()
  const { account } = useWeb3()
  const host = "0x651E644a071017Ea5eFD88ece7d58531f1E1eE29"

  const isHost = (id: string) => {
    return id === 'peer_' + host
  }

  useEffect(() => {
    if (!account?.address) return

    const userId = `peer_${account.address}`
    const newPeer = new Peer(userId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      pingInterval: 500,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    })

    newPeer.on('open', (id: string) => {
      setPeer(newPeer)

      if (!isHost(id)) {
        const conn = newPeer.connect('peer_' + host)

        conn.on('open', () => {
          setConnection(conn)
        })

        conn.on('error', (err: any) => {
          toast({
            status: 'error',
            title: 'Connection error, reload the page',
            description: err,
            isClosable: true,
          })
        })
      }
    })

    newPeer.on('connection', (connection) => {
      setConnections([...connections, connection])
    })

    newPeer.on('error', (err) => {
      console.error('Peer connection error:', err)
    })

    return () => {
      newPeer.destroy()
    }
  }, [])

  useEffect(() => {
    if (!peer || !connection) return

    connection.on('data', function (msg: any) {
      setOpponent(msg.data);
      console.log(msg.data)
    });    

    return () => {
      if (connection) {
        //connection.off()
        connection.close()
      }
    }
  }, [connection])

  const broadcastPosition = useCallback((mainBlob: BlobData) => {
    if (connections.length === 0 || !peer) return

    connections.map((conn) => conn.send({ type: 'position', data: mainBlob }))
  }, [connections, peer])

  const contextValue = useMemo(() => {
    return { broadcastPosition, peer, opponent }
  }, [broadcastPosition, peer, opponent])

  return (
    <PeerContext.Provider value={contextValue}>
      {children}
    </PeerContext.Provider>
  )
}

export default PeerProvider
