import { useRef, useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { getMagnitude } from '../utils'
import { BlobData } from '../types'
import Blob from './Blob'
import ConnectButton from './ConnectButton'
import Player from './Player'
import { usePeer } from '../PeerProvider'
import { useWeb3 } from '../Web3Provider'
import { fullScreen, transition } from '../constants'

const Arena = ({ width, height, initialSizeMainBlob, account, mainBlob, setMainBlob, blobsPositions, setBlobsPositions }: { width: number, height: number, initialSizeMainBlob: number, account: any, mainBlob: BlobData, setMainBlob: any, blobsPositions: BlobData[], setBlobsPositions: any }) => {
  const svg = useRef<SVGSVGElement>(null)
  const { broadcastPosition, players } = usePeer()
  const { mapWidth } = useWeb3();
  console.log(mapWidth)

  useEffect(() => {
      const intervalId = setInterval(() => {
        broadcastPosition(mainBlob);
      }, 50);
  
      return () => clearInterval(intervalId);
    }, [mainBlob, broadcastPosition]);

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
      setMainBlob((prevMainBlob: any) => ({
        ...prevMainBlob,
        r: getMagnitude(prevMainBlob.r, other.r)
      }))
      return true
    } else {
      return false
    }
  }

  return (
    <Box>
      <ConnectButton />
      <svg style={fullScreen} ref={svg} width={width} height={height}>
        <g style={transition} transform={`translate(${width / 2}, ${height / 2}), scale(${initialSizeMainBlob / mainBlob.r})`}>
          <g transform={`translate(${-mainBlob.position.x}, ${-mainBlob.position.y})`}>
            <Player address="123" position={{ x: mainBlob.position.x, y: mainBlob.position.y }} r={mainBlob.r} />
            {blobsPositions.map((blob: BlobData, index: number) => (
              <Blob position={{ x: blob.position.x, y: blob.position.y }} r={blob.r} color={blob.color} key={index} />
            ))}
            {players.length > 0 && players.map((player: BlobData, index: number) => (
              <Player address="123" position={{ x: player.position.x, y: player.position.y }} r={player.r} key={index + 1000} />
            ))}
          </g>
        </g>
      </svg>
    </Box>
  )
}

export default Arena
