import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Piece, Square } from '../logic/pieces';
import { fromCoord, inBounds, toCoord } from './coords';
import type { Coord } from './coords';

/**
 * A directional movement ray: repeated step `(df, dr)`, up to `max` cells.
 * `jump = true` means the ray passes through occupied cells (the piece can
 * "leap" over obstacles); `jump = false` means it is blocked by the first
 * occupied cell.
 */
export interface Ray {
  df: number;
  dr: number;
  max: number;
  jump: boolean;
}

const ORTHO: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DIAG: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const ALL8: ReadonlyArray<readonly [number, number]> = [...ORTHO, ...DIAG];
const KNIGHT: ReadonlyArray<readonly [number, number]> = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

/**
 * Movement rays for any ray-based piece (§2). The Scout is offset-based and
 * returns no rays here — see {@link knightTargets}.
 */
export function movementRays(piece: Piece, from: Coord): Ray[] {
  switch (piece.type) {
    case PieceType.RITTER:
      // 1–2 cells orthogonally, leaps over pieces.
      return ORTHO.map(([df, dr]) => ({ df, dr, max: 2, jump: true }));
    case PieceType.KING:
      // 1 cell in all 8 directions.
      return ALL8.map(([df, dr]) => ({ df, dr, max: 1, jump: false }));
    case PieceType.PRINCE:
      // 1 cell orthogonally + up to 3 diagonally (no jump).
      return [
        ...ORTHO.map(([df, dr]) => ({ df, dr, max: 1, jump: false })),
        ...DIAG.map(([df, dr]) => ({ df, dr, max: 3, jump: false })),
      ];
    case PieceType.KONNET:
      // Ritter orthogonally (1–2, jump) + Prince diagonally (up to 3, no jump).
      return [
        ...ORTHO.map(([df, dr]) => ({ df, dr, max: 2, jump: true })),
        ...DIAG.map(([df, dr]) => ({ df, dr, max: 3, jump: false })),
      ];
    case PieceType.KNEKHT:
    case PieceType.VER_KNEKHT:
      return knechtRays(piece.color, from);
    case PieceType.SCOUT:
      return [];
  }
}

/**
 * Knecht / Ver Knecht: 1 cell in each of the 4 orthogonal directions, with the
 * forward direction extended to 2 cells while the double-step stays within the
 * piece's own half (white ranks 1–4, black ranks 5–8). No jumping.
 */
function knechtRays(color: PieceColor, from: Coord): Ray[] {
  const fwd = color === PieceColor.WHITE ? 1 : -1;
  const doubleDestR = from.r + 2 * fwd;
  const doubleInOwnHalf =
    color === PieceColor.WHITE ? doubleDestR <= 3 : doubleDestR >= 4;
  const forwardMax = doubleInOwnHalf ? 2 : 1;
  return [
    { df: 1, dr: 0, max: 1, jump: false }, // right
    { df: -1, dr: 0, max: 1, jump: false }, // left
    { df: 0, dr: -fwd, max: 1, jump: false }, // backward
    { df: 0, dr: fwd, max: forwardMax, jump: false }, // forward (1, or 2 within own half)
  ];
}

export interface MoveTarget {
  sq: Square;
  /** true when the destination holds an enemy piece (a capturing move). */
  capture: boolean;
}

function walkMoveRay(
  board: BoardState,
  from: Coord,
  mover: Piece,
  ray: Ray,
  out: MoveTarget[],
): void {
  for (let d = 1; d <= ray.max; d++) {
    const f = from.f + ray.df * d;
    const r = from.r + ray.dr * d;
    if (!inBounds(f, r)) break;
    const sq = fromCoord({ f, r });
    const occ = board.get(sq);
    if (occ) {
      if (occ.color !== mover.color) out.push({ sq, capture: true });
      if (!ray.jump) break; // non-jumpers stop at the first occupied cell
      // jumpers leap over the piece (friend or enemy) and keep going
    } else {
      out.push({ sq, capture: false });
    }
  }
}

function knightTargets(board: BoardState, from: Coord, mover: Piece, out: MoveTarget[]): void {
  for (const [df, dr] of KNIGHT) {
    const f = from.f + df;
    const r = from.r + dr;
    if (!inBounds(f, r)) continue;
    const sq = fromCoord({ f, r });
    const occ = board.get(sq);
    if (!occ) out.push({ sq, capture: false });
    else if (occ.color !== mover.color) out.push({ sq, capture: true });
  }
}

/**
 * All squares the piece on `from` can legally move to by pure movement rules
 * (geometry + blocking/jumping). A destination occupied by a friendly piece is
 * never a target. Capture *legality* (force majority, castle rules, Scout
 * specials) is decided by the validator, not here.
 */
export function legalTargets(board: BoardState, from: Square): MoveTarget[] {
  const mover = board.get(from);
  if (!mover) return [];
  const c = toCoord(from);
  const out: MoveTarget[] = [];
  if (mover.type === PieceType.SCOUT) {
    knightTargets(board, c, mover, out);
    return out;
  }
  for (const ray of movementRays(mover, c)) walkMoveRay(board, c, mover, ray, out);
  return out;
}

/** The move target for `to` if the piece on `from` can reach it, else null. */
export function findTarget(board: BoardState, from: Square, to: Square): MoveTarget | null {
  return legalTargets(board, from).find((t) => t.sq === to) ?? null;
}
