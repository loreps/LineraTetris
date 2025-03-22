export type CellType = null | 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'B'; // Added 'B' for black block
export type GameState = CellType[][];

export interface Tetromino {
  type: Exclude<CellType, null>;
  position: { x: number; y: number };
  rotation: number;
}