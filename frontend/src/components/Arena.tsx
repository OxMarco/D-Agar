import { useRef, useEffect, useState } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import { generateBlobPosition, getMagnitude, getRandomPosition } from '../utils'
import { BlobData, FoodBlob } from '../types'
import Blob from './Blob'
import ConnectButton from './ConnectButton'
import Player from './Player'
import { usePeer } from '../PeerProvider'
import { useWeb3 } from '../Web3Provider'
import { fullScreen, transition } from '../constants'
import { getDeterministicColor, getRandomColor } from '../utils/blobUtils'

const Arena = ({ width, height, initialSizeMainBlob }: { width: number, height: number, initialSizeMainBlob: number }) => {
  const svg = useRef<SVGSVGElement>(null)
  const toast = useToast()
  const { account, seed, activePlayers, players, joinGame, eatPlayer } = useWeb3()
  const { opponent, broadcastPosition } = usePeer()
  const [arenaPlayers, setPlayers] = useState<BlobData[]>([])
  const [blobPositions, setBlobPositions] = useState<FoodBlob[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mainBlob, setMainBlob] = useState({
    position: getRandomPosition(width, height),
    r: initialSizeMainBlob,
    color: "#ffffff",
    address: account?.address
  })
  const [win, setWin] = useState<boolean>(false)

  useEffect(() => {
    const checkPlayerAndJoin = async () => {
      if (!players.isLoading && account?.address) {
        const playerExists = players.data.some((player: string) => player === account.address);
        if (!playerExists) {
          try {
            await joinGame(account);
          } catch (error: any) {
            toast({
              title: 'Error joining game.',
              description: error?.message ? error.message : error,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
        setLoading(false);
      }
    };

    checkPlayerAndJoin();
  }, [account, players, joinGame]);

  useEffect(() => {
    if (!activePlayers.isLoading && activePlayers.data > 1) {
      toast({
        status: 'info',
        title: 'There are ' + activePlayers.data + ' active players in the room'
      })
    }
  }, [])

  useEffect(() => {
    if (!seed.isLoading) {
      let temp: FoodBlob[] = []
      for (let i = 0; i < 200; i++) {
        temp.push(
          generateBlobPosition(
            i,
            Date.now(),
            seed,
            2000,
            2000
          )
        )
      }
      setBlobPositions(temp)
    }
  }, [])

  useEffect(() => {
    if (blobPositions.length == 200)
      setLoading(false)
  })

  useEffect(() => {
      const intervalId = setInterval(() => {
        broadcastPosition(mainBlob)
      }, 50)
  
      return () => clearInterval(intervalId)
    }, [mainBlob, broadcastPosition])

  ///////// Player eating logic /////////
  useEffect(() => {
    const playerCollisionCheck = async () => {
    const res = eatsPlayer(opponent)
      if (res.contact) {
        if (res.isBigger) {
          setWin(true)
          toast({
            status: 'success',
            title: 'You won!'
          })
          await eatPlayer(opponent.address)
        } else {
          toast({
            status: 'error',
            title: 'You lost!'
          })
        }
      }
    }

    if(opponent && !win) playerCollisionCheck()
  }, [mainBlob, opponent, win])

  const eatsPlayer = (other: BlobData) => {
    const distance = getMagnitude(mainBlob.position.x - other.position.x, mainBlob.position.y - other.position.y)
    if (distance < mainBlob.r + other.r) {
      return { contact: true, isBigger: mainBlob.r > other.r }
    } else {
      return { contact: false, isBigger: null }
    }
  }

  ///////// Food eating logic /////////
  useEffect(() => {
    blobPositions.forEach((pos, index) => {
      if (eatsFood(pos)) {
        const newBlobsPositions = blobPositions.filter((_, i) => i !== index)
        setBlobPositions(newBlobsPositions)
      }
    })
  }, [mainBlob, blobPositions])

  const eatsFood = (other: FoodBlob) => {
    const distance = getMagnitude(mainBlob.position.x - other.x, mainBlob.position.y - other.y)
    if (distance < mainBlob.r + 10) {
      setMainBlob((prevMainBlob: any) => ({
        ...prevMainBlob,
        r: getMagnitude(prevMainBlob.r, 10)
      }))
      return true
    } else {
      return false
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const moveDistance = 10
      setMainBlob((prevMainBlob: BlobData) => {
        let newX = prevMainBlob.position.x
        let newY = prevMainBlob.position.y

        switch (event.key) {
          case 'ArrowUp':
            newY -= moveDistance
            break
          case 'ArrowDown':
            newY += moveDistance
            break
          case 'ArrowLeft':
            newX -= moveDistance
            break
          case 'ArrowRight':
            newX += moveDistance
            break
        }

        return {
          ...prevMainBlob,
          position: { x: newX, y: newY }
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setMainBlob])


  return (
    <Box>
      <ConnectButton />
      <svg style={fullScreen} ref={svg} width={width} height={height}>
          <g style={transition} transform={`translate(${width / 2}, ${height / 2}), scale(${initialSizeMainBlob / mainBlob.r})`}>
            <g transform={`translate(${-mainBlob.position.x}, ${-mainBlob.position.y})`}>
              {account?.address && <Player address={account.address} position={{ x: mainBlob.position.x, y: mainBlob.position.y }} r={mainBlob.r} />}
              {blobPositions.length > 0 && blobPositions.map((blob: FoodBlob, index: number) => (
                <Blob position={{ x: blob.x, y: blob.y }} r={10} color={getDeterministicColor(blob.x, blob.y)} key={index} />
              ))}
              {opponent && 
                <Player address={opponent.address || '0xAAA'} position={{ x: opponent.position.x, y: opponent.position.y }} r={opponent.r} />
              }
            </g>
          </g>
      </svg>
    </Box>
  )
}

export default Arena
