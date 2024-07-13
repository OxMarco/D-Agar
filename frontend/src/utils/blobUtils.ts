import { BlobData, Position } from "../types";

export function getRandomColor(): string {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

export function getRandomDots(width: number, height: number): BlobData[] {
  return Array.from({ length: 200 }, (_, i) => ({
    position: {
      x: Math.random() * width * 4 - width * 2,
      y: Math.random() * height * 4 - height * 2
    },
    r: 10,
    color: getRandomColor(),
    id: i + 1
  }));
}

export function getMagnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function normalize(x: number, y: number): Position {
  const magnitude = getMagnitude(x, y);
  return magnitude > 0
    ? { x: x / (magnitude / 5), y: y / (magnitude / 5) }
    : { x, y };
}

export function eats(blob1: BlobData, blob2: BlobData): boolean {
  const dx = blob1.position.x - blob2.position.x;
  const dy = blob1.position.y - blob2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < blob1.r + blob2.r;
}