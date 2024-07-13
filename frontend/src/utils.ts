import { BlobData, Position } from "./types";

export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function getRandomDots(width: number, height: number): BlobData[] {
  let blobs = [];
  for (let i = 1; i < 200; ++i) {
      blobs.push({
          position: {x: getRandomNumber(-2* width, 2* width), 
          y: getRandomNumber(-2*height, 2*height)}, 
          r: 20,
          color: getRandomColor(),
          id: i
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
