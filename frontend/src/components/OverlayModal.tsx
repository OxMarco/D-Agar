import { Box, Button, Card, CardBody, Center, Divider, Heading, Icon, Stack, Text, VStack } from "@chakra-ui/react";
import Logo from "./Logo";

const OverlayModal = ({ title, action, isConnected }: { title: string, action: string, isConnected: boolean }) => (
  <Box
    position="fixed"
    top="50%"
    left="50%"
    transform="translate(-50%, -50%)"
    zIndex="docked"
    width={{ base: "90%", md: "auto" }}
    maxWidth="400px"
  >
    <Card padding={12} boxShadow="lg" borderRadius="md">
      <CardBody>
        <Center>
          <Stack spacing={5} textAlign="center">
            <VStack>
              <Logo />
            </VStack>
            <Divider />
            <Box>
              {isConnected ? (
                <Button colorScheme="blue">{action}</Button>
              ) : (
                <Text color="red.500">You need to connect your wallet first</Text>
              )}
            </Box>
          </Stack>
        </Center>
      </CardBody>
    </Card>
  </Box>
);

export default OverlayModal;
