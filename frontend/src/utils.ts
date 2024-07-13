import { BlobData, Position } from "./types";

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

export function getRandomDots(width: number, height: number): BlobData[] {
  let blobs = [];
  for (let i = 1; i < 100; ++i) {
      blobs.push({
          position: {
            x: getRandomNumber(- width, width), 
            y: getRandomNumber(-height, height)
          }, 
          r: 20,
          color: getRandomColor()
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
