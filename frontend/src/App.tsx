import { useRef, useState, useEffect } from 'react'
import Peer, { DataConnection } from 'peerjs'
import { useToast } from '@chakra-ui/react'
import { getMagnitude, getRandomDots, normalize } from './utils'
import Blob from './components/Blob'
import { BlobData } from './types'

const width = window.innerWidth
const height = window.innerHeight
const initialSizeMainBlob = 50

const App = () => {
  ///////////// Playing Field /////////////
  const svg = useRef<SVGSVGElement>(null)
  const [mainBlob, setMainBlob] = useState({
    position: { x: 0, y: 0 },
    r: initialSizeMainBlob,
    id: 0,
    color: "#ffffff"
  })
  const [blobsPositions, setBlobsPositions] = useState(getRandomDots(width, height))
  const [players, setPlayers] = useState<BlobData[]>([])

  useEffect(() => {
    const updatePosition = (pt: DOMPoint) => {
      if (svg.current) {
        const screenCTM = svg.current.getScreenCTM()
        if (screenCTM) {
          const loc = pt.matrixTransform(screenCTM.inverse())
          const normalized = normalize(loc.x - width / 2, loc.y - height / 2)
          setMainBlob((prevMainBlob: BlobData) => {
            // Calculate the difference between mouse and blob position
            const dx = loc.x - width / 2 - prevMainBlob.position.x
            const dy = loc.y - height / 2 - prevMainBlob.position.y

            return {
              ...prevMainBlob,
              position: {
                x: prevMainBlob.position.x + Math.sign(dx) * normalized.x,
                y: prevMainBlob.position.y + Math.sign(dy) * normalized.y
              }
            }
          })
        }
      }
    }

    const setPositionUpdater = () => {
      if (svg.current) {
        let point = svg.current.createSVGPoint()
        document.onmousemove = (e) => {
          point.x = e.clientX
          point.y = e.clientY
        }
        document.ontouchmove = (e) => {
          point.x = e.touches[0].clientX
          point.y = e.touches[0].clientY
        }
        const intervalId = setInterval(() => updatePosition(point), 20)
        return () => clearInterval(intervalId)
      }
    }

    setPositionUpdater()
  }, [])

  useEffect(() => {
    blobsPositions.forEach((pos, index) => {
      if (eats(pos)) {
        const newBlobsPositions = blobsPositions.filter((_, i) => i !== index)
        setBlobsPositions(newBlobsPositions)
      }
    })
  }, [mainBlob, blobsPositions])

  const eats = (other: BlobData) => {
    const distance = getMagnitude(mainBlob.position.x - other.position.x, mainBlob.position.y - other.position.y)
    if (distance < mainBlob.r + other.r) {
      setMainBlob((prevMainBlob: BlobData) => ({
        ...prevMainBlob,
        r: getMagnitude(prevMainBlob.r, other.r)
      }))
      return true
    } else {
      return false
    }
  }

  const fullScreen = {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black'
  }

  const transition = {
    transition: "all 0.5s ease-in-out",
    WebkitTransition: "all 0.5s ease-in-out",
    MozTransition: "all 0.5s ease-in-out",
    OTransition: "all 0.5s ease-in-out"
  }

    ///////////// PeerJS /////////////
    const [peer, setPeer] = useState<Peer>()
    const [remotePeers, setRemotePeers] = useState<string[]>([])
    const [connection, setConnection] = useState<DataConnection>()
    const [connections, setConnections] = useState<DataConnection[]>([])
    const toast = useToast()
    const address = "aaa" // TODO get from wallet
  
    useEffect(() => {
      if (!address) return
  
      const userId = `peer_${address}`
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
  
        const conn = newPeer.connect('peer_' + host)
  
        conn.on('open', () => {
          setConnection(conn)
          toast({
            status: 'info',
            title: 'User '+conn.peer+' joined',
            isClosable: true
          })
        })

        conn.on('error', (err: any) => {
          toast({
            status: 'error',
            title: 'Connection error, reload the page',
            description: err,
            isClosable: true,
          })
        })
      })
  
      newPeer.on('connection', (connection) => {
        setConnections([...connections, connection])
        setRemotePeers([...remotePeers, connection.peer])
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
        if (msg.type == 'display') {
          setLines(msg.data)
        }
      })
  
      return () => {
        if (connection) connection.close()
      }
    }, [connection])
  
    useEffect(() => {
      connections.map((conn) => conn.send({ type: 'lines', data: {player: address, blob: mainBlob.position }}))
    }, [mainBlob])

  return (
    <svg style={fullScreen} ref={svg} width={width} height={height}>
      <g style={transition}
        transform={`translate(${width / 2}, ${height / 2}), scale(${initialSizeMainBlob / mainBlob.r})`}>
        <g transform={`translate(${-mainBlob.position.x}, ${-mainBlob.position.y})`}>
          <Blob position={{ x: mainBlob.position.x, y: mainBlob.position.y }} r={mainBlob.r} color={mainBlob.color} />
          {blobsPositions.map((blob: BlobData, index: number) => (
            <Blob position={{ x: blob.position.x, y: blob.position.y }} r={blob.r} color={blob.color} key={index} />
          ))}
          {players.map((player: BlobData, index: number) => (
            <Blob position={{ x: player.position.x, y: player.position.y }} r={player.r} color={player.color} key={index + 1000} />
          ))}
        </g>
      </g>
    </svg>
  )
}

export default App
