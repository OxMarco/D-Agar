import { useRef, useState } from "react"
import { Box } from "@chakra-ui/react"
import OverlayModal from "./OverlayModal"
import ConnectButton from "./ConnectButton"
import Blob from "./Blob"
import { BlobData, FoodBlob } from "../types"
import { fullScreen, transition } from "../constants"
import { getRandomColor, getRandomDots } from "../utils/blobUtils"

const WaitingRoom = ({ width, height, account }: { width: number, height: number, account: any }) => {
  const svg = useRef<SVGSVGElement>(null)
  const [blobs] = useState<FoodBlob[]>(getRandomDots(width, height))

  return (
    <Box>
      <ConnectButton />
      <OverlayModal title="Welcome to D-Agar!" action="Start a new game" isConnected={account?.address} />
      <svg style={fullScreen} ref={svg} width={width} height={height}>
        <g style={transition}
          transform={`translate(${width / 2}, ${height / 2}), scale(1)`}>
          <g>
            {blobs.length > 0 &&  blobs.map((blob: FoodBlob, index: number) => (
              <Blob position={{ x: blob.x, y: blob.y }} r={10} color={getRandomColor()} key={index} />
            ))}
          </g>
        </g>
      </svg>
    </Box>
  )
}

export default WaitingRoom
