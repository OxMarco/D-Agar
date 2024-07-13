import { Box } from "@chakra-ui/react"
import { DynamicWidget } from "@dynamic-labs/sdk-react-core"

const ConnectButton = () => (
  <Box
    position="fixed"
    bottom="4"
    right="4"
    zIndex="docked"
  >
    <DynamicWidget />
  </Box>
)

export default ConnectButton

