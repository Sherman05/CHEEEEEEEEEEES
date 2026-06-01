import { FILES } from '../logic/pieces';
import type { Square } from '../logic/pieces';

/**
 * Internal 0-based board coordinate.
 * `f`: file a..h → 0..7, `r`: rank 1..8 → 0..7.
 */
export interface Coord {
  f: number;
  r: number;
}

export function toCoord(sq: Square): Coord {
  return { f: sq.charCodeAt(0) - 97 /* 'a' */, r: parseInt(sq.slice(1), 10) - 1 };
}

export function fromCoord(c: Coord): Square {
  return `${FILES[c.f]}${c.r + 1}`;
}

export function inBounds(f: number, r: number): boolean {
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}
