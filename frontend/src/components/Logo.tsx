import { Heading, HStack, Stack, Text, VStack } from "@chakra-ui/react"
import { shuffleArray } from "../utils";

function Logo() {
  const text = "D-Agar"
  const colors = shuffleArray(["red", "orange", "black", "green", "aqua", "blue", "indigo", "purple", "violet", "pink", "magenta"]);

  return (
    <Stack>
      <Heading size="lg">Welcome to</Heading>

      <HStack>
        <Heading size="3xl">
          {text.split('').map((char, index) => (
            <Text
              as="span"
              key={index}
              color={colors[index % colors.length]}
              display="inline-block"
              transition="transform 0.3s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              {char}
            </Text>
          ))}
        </Heading>
      </HStack>
    </Stack>
  )
}

export default Logo
