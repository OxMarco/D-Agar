export interface Position {
  x: number,
  y: number
}

export interface BlobData {
  position: Position,
  r: number,
  color: string,
  address?: string
}

export interface FoodBlob extends Position {}
