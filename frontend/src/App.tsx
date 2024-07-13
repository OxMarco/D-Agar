
import { useAccount } from 'wagmi'
import Arena from './components/Arena'
import { useEffect, useState } from 'react'
import { getRandomDots, getRandomPosition } from './utils'
import WaitingRoom from './components/WaitingRoom'
import PeerProvider from './PeerProvider'
import Web3Provider from './Web3Provider'

const App = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  const initialSizeMainBlob = 50
  const [mainBlob, setMainBlob] = useState({
    position: getRandomPosition(width, height),
    r: initialSizeMainBlob,
    color: "#ffffff",
    address: ''
  })
  const [blobsPositions, setBlobsPositions] = useState(getRandomDots(width, height))
  const account = useAccount()

  return (
    <>
      {(account?.address) ?
        <PeerProvider address={account.address}>
          <Web3Provider account={account}>
            <Arena
              width={width}
              height={height}
              initialSizeMainBlob={initialSizeMainBlob}
              account={account}
              mainBlob={mainBlob}
              setMainBlob={setMainBlob}
              blobsPositions={blobsPositions}
              setBlobsPositions={setBlobsPositions}
            />
          </Web3Provider>
        </PeerProvider>
        :
        <WaitingRoom
          width={width}
          height={height}
          account={account}
          blobs={blobsPositions}
        />
      }
    </>
  )
}

export default App
