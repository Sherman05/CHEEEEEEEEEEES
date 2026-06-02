import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { fromCoord, inBounds, toCoord } from './coords';
import type { Coord } from './coords';
import { movementRays } from './movement';
import type { Ray } from './movement';
import { STRENGTH } from './pieceInfo';

export interface CellForce {
  white: number;
  black: number;
}

export type ForceField = Map<Square, CellForce>;

const ZERO: CellForce = { white: 0, black: 0 };

/** Force on a cell; {white:0, black:0} for cells nobody projects onto. */
export function forceAt(field: ForceField, sq: Square): CellForce {
  return field.get(sq) ?? ZERO;
}

/**
 * Walk one projection ray (§3). A piece projects its strength onto every cell of
 * the ray. Non-jumping rays (diagonals of Prince/Konnet, orthogonals of Knecht/
 * King) stop at the first occupied cell INCLUSIVELY — they defend/attack the
 * piece standing there but reach no further (§3.2). Jumping rays (Ritter, and
 * Konnet orthogonally) pass straight through obstacles (§3.3).
 */
function walkProjectRay(board: BoardState, from: Coord, ray: Ray, out: Square[]): void {
  for (let d = 1; d <= ray.max; d++) {
    const f = from.f + ray.df * d;
    const r = from.r + ray.dr * d;
    if (!inBounds(f, r)) break;
    const sq = fromCoord({ f, r });
    out.push(sq);
    if (!ray.jump && board.has(sq)) break;
  }
}

/** Cells a piece projects strength onto: its own cell (self-defence) + its rays. */
function projectionCells(board: BoardState, from: Square): Square[] {
  const piece = board.get(from);
  // Scout is excluded from the force field entirely (§5): no projection, and it
  // does not even defend its own cell (its defence strength is 0).
  if (!piece || piece.type === PieceType.SCOUT) return [];
  const c = toCoord(from);
  const cells: Square[] = [from]; // self-defence (§3.1)
  for (const ray of movementRays(piece, c)) walkProjectRay(board, c, ray, cells);
  return cells;
}

/**
 * Compute the §3 force field: for each cell, the separately-summed white and
 * black strength projected onto it (superposition, §3.4). Scouts contribute
 * nothing (§5). Recompute on every position change.
 */
export function computeForceField(board: BoardState): ForceField {
  const field: ForceField = new Map();
  const bump = (sq: Square, color: PieceColor, s: number): void => {
    let v = field.get(sq);
    if (!v) {
      v = { white: 0, black: 0 };
      field.set(sq, v);
    }
    if (color === PieceColor.WHITE) v.white += s;
    else v.black += s;
  };
  board.forEach((piece, sq) => {
    if (piece.type === PieceType.SCOUT) return; // §5
    const s = STRENGTH[piece.type];
    for (const cell of projectionCells(board, sq)) bump(cell, piece.color, s);
  });
  return field;
}
