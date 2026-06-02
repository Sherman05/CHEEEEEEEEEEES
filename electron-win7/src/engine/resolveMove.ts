import { PieceColor, cloneBoard } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { validateMove } from './validator';
import type { CaptureKind } from './validator';

export interface ResolveResult {
  allowed: boolean;
  /** '' when allowed; otherwise the validator's reason (used for §8 messages). */
  reason: string;
  /** 'none' when the move is rejected. */
  captureKind: CaptureKind;
  /** Board after the move; the unchanged input board when rejected. */
  nextBoard: BoardState;
  /** Side to move after the move; unchanged when rejected. */
  nextTurn: PieceColor;
}

const other = (c: PieceColor): PieceColor =>
  c === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

/**
 * Pure move resolution (no React/DOM): validate a play move, then build the
 * resulting board and next side to move. This is the single source of truth the
 * GUI wiring applies, and it is what the flow tests exercise.
 *
 * - allowed: nextBoard reflects the capture kind — 'normal'/'none' move the
 *   piece (overwriting `to` removes a captured enemy), 'scout-exchange' removes
 *   BOTH the attacking Scout and the captured piece (§5). nextTurn alternates
 *   off the moving side (party and analysis-play both alternate today).
 * - rejected: nextBoard is the original board (unchanged) and nextTurn is the
 *   current side; `reason` carries the validator message for §8.
 *
 * `turn` enforces strict order when provided (party); omit it for free analysis.
 */
export function resolveMove(
  board: BoardState,
  from: Square,
  to: Square,
  turn?: PieceColor,
): ResolveResult {
  const mover = board.get(from);
  const verdict = validateMove(board, from, to, { turn });

  // Current side to move: the explicit turn (party) or, in free analysis, the
  // colour of the piece being moved.
  const currentSide = turn ?? mover?.color ?? PieceColor.WHITE;

  if (!verdict.allowed) {
    return {
      allowed: false,
      reason: verdict.reason,
      captureKind: 'none',
      nextBoard: board,
      nextTurn: currentSide,
    };
  }

  const nextBoard = cloneBoard(board);
  if (verdict.capture === 'scout-exchange') {
    nextBoard.delete(from);
    nextBoard.delete(to);
  } else {
    nextBoard.delete(from);
    if (mover) nextBoard.set(to, mover);
  }

  return {
    allowed: true,
    reason: '',
    captureKind: verdict.capture,
    nextBoard,
    nextTurn: other(currentSide),
  };
}
