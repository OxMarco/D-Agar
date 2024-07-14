import { useAccount } from 'wagmi'
import Arena from './components/Arena'
import { useEffect, useState } from 'react'
import { getRandomDots, getRandomPosition } from './utils'
import WaitingRoom from './components/WaitingRoom'
import PeerProvider from './PeerProvider'
import Web3Provider, { useWeb3 } from './Web3Provider'
import { useToast } from '@chakra-ui/react'

const App = () => {
  const account = useAccount()

  const width = window.innerWidth
  const height = window.innerHeight
  const initialSizeMainBlob = 50

  return (
    <>
      {(account?.address) ?
        <Web3Provider>
          <PeerProvider>
            <Arena
              width={width}
              height={height}
              initialSizeMainBlob={initialSizeMainBlob}
            />
          </PeerProvider>
        </Web3Provider>
        :
        <WaitingRoom
          width={width}
          height={height}
          account={account}
        />
      }
    </>
  )
}

export default App
