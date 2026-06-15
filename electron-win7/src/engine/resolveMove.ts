import { CASTLE_BLACK, CASTLE_WHITE, PieceColor, PieceType, cloneBoard } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { validateMove } from './validator';
import type { CaptureKind } from './validator';
import { knechtPromotesTo, princeCastlePromotion, vkPromotion } from './promotion';
import type { PrinceToConnetDone } from './promotion';

/** Once-per-game Prince→Konnet flag per colour (carried across moves by the caller). */
export type PromotionState = PrinceToConnetDone;

/**
 * Promotion that happened (or must happen) on this move:
 * - 'knecht-vk' / 'prince-connet' are AUTOMATIC and already applied to nextBoard.
 * - 'vk-dialog' is NOT applied — it signals the UI to show the picker; nextBoard
 *   still carries the Ver Knecht on the destination square.
 */
export type Promotion =
  | { kind: 'knecht-vk' }
  | { kind: 'prince-connet' }
  | { kind: 'vk-dialog'; set: 'four' | 'castle'; princeFrozen: boolean; connetFrozen: boolean };

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
  /** Prince→Konnet state after the move; equals the input unless that fired. */
  nextPromotionState: PromotionState;
  /** Promotion triggered by this move, or undefined when there is none. */
  promotion?: Promotion;
}

const other = (c: PieceColor): PieceColor =>
  c === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

/** Castle cells of the OPPONENT of `color` (where Prince/VK promotions happen). */
const enemyCastleIncludes = (color: PieceColor, to: Square): boolean =>
  (color === PieceColor.WHITE ? CASTLE_BLACK : CASTLE_WHITE).includes(to);

/**
 * Pure move resolution (no React/DOM): validate a play move, then build the
 * resulting board, next side to move, and any promotion (Stage 2, module 1).
 *
 * - allowed: nextBoard reflects the capture kind — 'normal'/'none' move the
 *   piece (overwriting `to` removes a captured enemy), 'scout-exchange' removes
 *   BOTH the attacking Scout and the captured piece (§5). nextTurn alternates
 *   off the moving side (party and analysis-play both alternate today).
 * - rejected: nextBoard is the original board (unchanged) and nextTurn is the
 *   current side; `reason` carries the validator message for §8.
 *
 * Promotions, after the legal move is applied to nextBoard:
 * - a Knecht reaching its promo rank auto-becomes a Ver Knecht (knecht-vk);
 * - a Prince landing on the enemy castle promotes to Konnet once per game while
 *   fewer than three Konnets exist (prince-connet), updating nextPromotionState;
 * - a Ver Knecht reaching a promo square yields a vk-dialog signal (the UI picks).
 *
 * New legality (Stage 2): a Ver Knecht onto the enemy castle is illegal when both
 * the Prince and Konnet options are frozen (≥3 of each) — the 2-piece choice set
 * is empty, so there is nothing to promote into. reason='vk-castle-blocked' (no toast).
 *
 * `turn` enforces strict order when provided (party); omit it for free analysis.
 */
export function resolveMove(
  board: BoardState,
  from: Square,
  to: Square,
  turn?: PieceColor,
  promotionState: PromotionState = { white: false, black: false },
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
      nextPromotionState: promotionState,
    };
  }

  const color = mover ? mover.color : currentSide;

  // Stage 2 legality: a Ver Knecht may not enter the enemy castle when both
  // promotion options are frozen (the choice set would be empty).
  if (mover && mover.type === PieceType.VER_KNEKHT) {
    const vp = vkPromotion(board, color, to);
    if (vp && vp.kind === 'castle' && vp.moveBlocked) {
      return {
        allowed: false,
        reason: 'vk-castle-blocked',
        captureKind: 'none',
        nextBoard: board,
        nextTurn: currentSide,
        nextPromotionState: promotionState,
      };
    }
  }

  const nextBoard = cloneBoard(board);
  if (verdict.capture === 'scout-exchange') {
    nextBoard.delete(from);
    nextBoard.delete(to);
  } else {
    nextBoard.delete(from);
    if (mover) nextBoard.set(to, mover);
  }

  let promotion: Promotion | undefined;
  let nextPromotionState: PromotionState = promotionState;

  if (mover) {
    if (mover.type === PieceType.KNEKHT && knechtPromotesTo(to, color) === 'VK') {
      // Auto: Knecht → Ver Knecht, applied to nextBoard.
      nextBoard.set(to, { type: PieceType.VER_KNEKHT, color });
      promotion = { kind: 'knecht-vk' };
    } else if (mover.type === PieceType.PRINCE && enemyCastleIncludes(color, to)) {
      // Auto: first eligible Prince → Konnet on the enemy castle, once per game.
      const pc = princeCastlePromotion(nextBoard, color, promotionState);
      if (pc.promote) {
        nextBoard.set(to, { type: PieceType.KONNET, color });
        promotion = { kind: 'prince-connet' };
        nextPromotionState =
          color === PieceColor.WHITE
            ? { ...promotionState, white: pc.newDone }
            : { ...promotionState, black: pc.newDone };
      }
    } else if (mover.type === PieceType.VER_KNEKHT) {
      // Signal only: the UI shows the picker and applies the chosen piece later.
      const vp = vkPromotion(board, color, to);
      if (vp) {
        promotion = {
          kind: 'vk-dialog',
          set: vp.kind,
          princeFrozen: vp.princeFrozen,
          connetFrozen: vp.connetFrozen,
        };
      }
    }
  }

  return {
    allowed: true,
    reason: '',
    captureKind: verdict.capture,
    nextBoard,
    nextTurn: other(currentSide),
    nextPromotionState,
    promotion,
  };
}
