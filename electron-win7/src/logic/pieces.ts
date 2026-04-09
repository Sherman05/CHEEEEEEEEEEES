export enum PieceType {
  KING = 'king',
  KONNET = 'konnet',
  PRINCE = 'prince',
  RITTER = 'ritter',
  KNEKHT = 'knekht',
  VER_KNEKHT = 'ver_knekht',
  SCOUT = 'scout',
}

export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black',
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export const CASTLE_WHITE = ['c1', 'd1', 'e1', 'f1'];
export const CASTLE_BLACK = ['c8', 'd8', 'e8', 'f8'];
export const ALL_CASTLES = [...CASTLE_WHITE, ...CASTLE_BLACK];

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type Square = string; // e.g. "a1", "h8"

export function toSquare(file: string, rank: number): Square {
  return `${file}${rank}`;
}

export function parseSquare(sq: Square): { file: string; rank: number } {
  return { file: sq[0], rank: parseInt(sq[1]) };
}

export function isCastle(sq: Square): boolean {
  return ALL_CASTLES.includes(sq);
}

export function isWhiteCastle(sq: Square): boolean {
  return CASTLE_WHITE.includes(sq);
}

export function isBlackCastle(sq: Square): boolean {
  return CASTLE_BLACK.includes(sq);
}

export type BoardState = Map<Square, Piece>;

export function createInitialPosition(): BoardState {
  const board: BoardState = new Map();

  // Row 1 - White back rank
  board.set('a1', { type: PieceType.RITTER, color: PieceColor.WHITE });
  board.set('b1', { type: PieceType.SCOUT, color: PieceColor.WHITE });
  board.set('c1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
  board.set('d1', { type: PieceType.KONNET, color: PieceColor.WHITE });
  board.set('e1', { type: PieceType.KING, color: PieceColor.WHITE });
  board.set('f1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
  board.set('g1', { type: PieceType.SCOUT, color: PieceColor.WHITE });
  board.set('h1', { type: PieceType.RITTER, color: PieceColor.WHITE });

  // Row 2 - White knechts
  for (const file of FILES) {
    board.set(toSquare(file, 2), { type: PieceType.KNEKHT, color: PieceColor.WHITE });
  }

  // Row 7 - Black knechts
  for (const file of FILES) {
    board.set(toSquare(file, 7), { type: PieceType.KNEKHT, color: PieceColor.BLACK });
  }

  // Row 8 - Black back rank
  board.set('a8', { type: PieceType.RITTER, color: PieceColor.BLACK });
  board.set('b8', { type: PieceType.SCOUT, color: PieceColor.BLACK });
  board.set('c8', { type: PieceType.PRINCE, color: PieceColor.BLACK });
  board.set('d8', { type: PieceType.KONNET, color: PieceColor.BLACK });
  board.set('e8', { type: PieceType.KING, color: PieceColor.BLACK });
  board.set('f8', { type: PieceType.PRINCE, color: PieceColor.BLACK });
  board.set('g8', { type: PieceType.SCOUT, color: PieceColor.BLACK });
  board.set('h8', { type: PieceType.RITTER, color: PieceColor.BLACK });

  return board;
}

export function cloneBoard(board: BoardState): BoardState {
  return new Map(board);
}

export function boardToSerializable(board: BoardState): Record<string, Piece> {
  const obj: Record<string, Piece> = {};
  board.forEach((piece, sq) => { obj[sq] = piece; });
  return obj;
}

export function boardFromSerializable(obj: Record<string, Piece>): BoardState {
  const board: BoardState = new Map();
  for (const [sq, piece] of Object.entries(obj)) {
    board.set(sq, piece);
  }
  return board;
}
