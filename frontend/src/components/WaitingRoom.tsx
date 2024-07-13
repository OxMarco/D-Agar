import { useRef } from "react"
import { Box } from "@chakra-ui/react"
import OverlayModal from "./OverlayModal"
import ConnectButton from "./ConnectButton"
import Blob from "./Blob"
import { BlobData } from "../types"
import { fullScreen, transition } from "../constants"

const WaitingRoom = ({ width, height, account, blobs }: { width: number, height: number, account: any, blobs: BlobData[] }) => {
  const svg = useRef<SVGSVGElement>(null)

  return (
    <Box>
      <ConnectButton />
      <OverlayModal title="Welcome to D-Agar!" action="Start a new game" isConnected={account?.address} />
      <svg style={fullScreen} ref={svg} width={width} height={height}>
        <g style={transition}
          transform={`translate(${width / 2}, ${height / 2}), scale(1)`}>
          <g>
            {blobs.map((blob: BlobData, index: number) => (
              <Blob position={{ x: blob.position.x, y: blob.position.y }} r={blob.r} color={blob.color} key={index} />
            ))}
          </g>
        </g>
      </svg>
    </Box>
  )
}

export default WaitingRoom
