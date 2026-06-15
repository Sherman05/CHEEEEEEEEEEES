import { CASTLE_BLACK, CASTLE_WHITE, PieceColor, PieceType, parseSquare } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';

// Stage 2, module 1 — promotions (pure logic only; no UI/store wiring).
//
// Back-rank corner squares where a Ver Knecht promotes via the v2.0 four-piece
// dialog. White advances onto Black's back rank; Black onto White's.
const FOUR_WHITE: ReadonlyArray<Square> = ['a8', 'b8', 'g8', 'h8'];
const FOUR_BLACK: ReadonlyArray<Square> = ['a1', 'b1', 'g1', 'h1'];

/** Pure count of pieces of a given colour and type on the board. */
export function countPieces(board: BoardState, color: PieceColor, type: PieceType): number {
  let n = 0;
  board.forEach((p) => {
    if (p.color === color && p.type === type) n++;
  });
  return n;
}

/**
 * Knecht → Ver Knecht auto-promotion: a White Knecht reaching rank 6, or a Black
 * Knecht reaching rank 3, promotes. Returns 'VK' for a promotion, else null.
 */
export function knechtPromotesTo(to: Square, color: PieceColor): 'VK' | null {
  const { rank } = parseSquare(to);
  if (color === PieceColor.WHITE && rank === 6) return 'VK';
  if (color === PieceColor.BLACK && rank === 3) return 'VK';
  return null;
}

/** A Ver Knecht promotion offering four pieces (back-rank corner squares). */
export interface VkFourPromotion {
  kind: 'four';
  /** ≥3 Princes of this colour already on the board — freeze the Prince option. */
  princeFrozen: boolean;
  /** ≥3 Konnets of this colour already on the board — freeze the Konnet option. */
  connetFrozen: boolean;
}

/** A Ver Knecht promotion on an enemy castle cell, offering Prince/Konnet only. */
export interface VkCastlePromotion {
  kind: 'castle';
  princeFrozen: boolean;
  connetFrozen: boolean;
  /** Both options frozen ⇒ the (2-piece) choice set is empty, so the VK cannot
   *  even move onto the castle cell. */
  moveBlocked: boolean;
}

export type VkPromotion = VkFourPromotion | VkCastlePromotion | null;

/**
 * Ver Knecht promotion at `to` for the given colour.
 * - 'four'   — a back-rank corner (a8/b8/g8/h8 white, a1/b1/g1/h1 black): the
 *              v2.0 dialog fixes the four pieces; we only report which of the
 *              Prince/Konnet options must be frozen by the "max three" rule.
 * - 'castle' — an enemy castle cell (c8d8e8f8 white, c1d1e1f1 black): a VK gets
 *              there ONLY by a simple move onto an EMPTY castle cell, choosing
 *              between Prince and Konnet. If both are frozen, moveBlocked is true.
 * - null     — `to` is not a VK promotion square.
 *
 * "Max three" rule: no more than three Princes and no more than three Konnets of
 * one colour may exist, so a fourth would freeze that option.
 */
export function vkPromotion(board: BoardState, color: PieceColor, to: Square): VkPromotion {
  const fourSquares = color === PieceColor.WHITE ? FOUR_WHITE : FOUR_BLACK;
  const enemyCastle = color === PieceColor.WHITE ? CASTLE_BLACK : CASTLE_WHITE;

  const princeFrozen = countPieces(board, color, PieceType.PRINCE) >= 3;
  const connetFrozen = countPieces(board, color, PieceType.KONNET) >= 3;

  if (fourSquares.includes(to)) {
    return { kind: 'four', princeFrozen, connetFrozen };
  }
  if (enemyCastle.includes(to)) {
    return { kind: 'castle', princeFrozen, connetFrozen, moveBlocked: princeFrozen && connetFrozen };
  }
  return null;
}

/** Per-colour record of whether the once-per-game Prince→Konnet promotion fired. */
export interface PrinceToConnetDone {
  white: boolean;
  black: boolean;
}

export interface PrinceCastleResult {
  promote: boolean;
  /** The updated done-flag for this colour (carry back into PrinceToConnetDone). */
  newDone: boolean;
}

/**
 * Prince landing on an enemy castle cell (simple move or capture). The FIRST
 * eligible Prince of a colour promotes to Konnet once per game, and only while
 * fewer than three Konnets of that colour exist (the "max three Konnets" rule).
 * Once it has fired, later Princes do not promote; if it was blocked by three
 * Konnets, a subsequent attempt may still fire (newDone stays false until success).
 */
export function princeCastlePromotion(
  board: BoardState,
  color: PieceColor,
  princeToConnetDone: PrinceToConnetDone,
): PrinceCastleResult {
  const key = color === PieceColor.WHITE ? 'white' : 'black';
  const done = princeToConnetDone[key];
  if (!done && countPieces(board, color, PieceType.KONNET) <= 2) {
    return { promote: true, newDone: true };
  }
  return { promote: false, newDone: done };
}
