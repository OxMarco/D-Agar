import { keccak256, encodeAbiParameters, toHex } from 'viem'
import { BlobData, FoodBlob, Position } from "./types"

export function generateBlobPosition(index: number, timestamp: number, seed: string, mapWidth: number, mapHeight: number): FoodBlob {
    const randomHash = keccak256(
      encodeAbiParameters(
        [
          {name: 'seed', type: 'string'}, 
          {name: 'timestamp', type: 'uint256'},
          {name: 'index' , type: 'uint256'},
        ],
        [seed, BigInt(timestamp), BigInt(index)]
      )
    )

    const randomHashNumber = Number(randomHash)

    const x = randomHashNumber % (mapWidth);
    const y = randomHashNumber / (mapWidth) % (mapHeight);
    return {x, y};
}

export function addressToNumber(address: any): number {
  // Hash the address using keccak256
  const hash = keccak256(address);
  
  // Convert the hash to a hexadecimal string
  const hexString = toHex(hash);
  
  // Convert the hexadecimal string to a BigInt
  const bigInt = BigInt(hexString);
  
  // Use modulo operation to get a value between 1 and 1000
  const number = Number(bigInt % 1000n);
  
  // Ensure the number is within the desired range (1 to 1000)
  return number === 0 ? 1000 : number;
}

export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function getRandomPosition(width: number, height: number) {
  return {
    x: Math.random() * width,
    y: Math.random() * height
  };
};

export function getRandomDots(width: number, height: number): FoodBlob[] {
  let blobs = [];
  for (let i = 1; i < 200; ++i) {
      blobs.push({
            x: getRandomNumber(- width, width), 
            y: getRandomNumber(-height, height)
        });
  }
  return blobs;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getMagnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function normalize(x: number, y: number): Position {
  let magnitude = getMagnitude(x, y);
  if (magnitude > 0) {
      magnitude = magnitude / 5;
      return {x: x / magnitude, y: y / magnitude};
  } else {
      return {x: x, y: y}
  }
}

export const shuffleArray = (array: any[]): any[] => {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
  }

  return array;
}
