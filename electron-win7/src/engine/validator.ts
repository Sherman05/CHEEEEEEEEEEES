import { CASTLE_BLACK, CASTLE_WHITE, PieceColor, PieceType, isCastle } from '../logic/pieces';
import type { BoardState, Piece, Square } from '../logic/pieces';
import { findTarget } from './movement';
import { computeForceField, forceAt } from './forceField';
import type { ForceField } from './forceField';
import { isRoyal } from './pieceInfo';

export type CaptureKind = 'none' | 'normal' | 'scout-exchange';

export interface MoveResult {
  allowed: boolean;
  /** '' when allowed; otherwise a reason. */
  reason: string;
  /** Outcome of an allowed move: 'none' (simple), 'normal' (capture), or
   *  'scout-exchange' (Scout on a castle cell — both pieces are removed, §5). */
  capture: CaptureKind;
}

// §8 — user-facing messages for denied moves the UI surfaces. Moves rejected
// purely on geometry (not by the schema of the piece) or onto a friendly piece
// stay silent; these reasons drive the transient toast.
export const MSG_NO_MAJORITY =
  'Ход со взятием невозможен — нет перевеса в силе на поле взятия';
// One message for a non-royal piece reaching a castle cell, whether the move is
// a simple step or a capture (incl. a would-be majority capture).
export const MSG_CASTLE_NON_ROYAL =
  'Ход (простой или со взятием) некоролевской фигурой на поле замка невозможен';

export interface ValidateOptions {
  /** Precomputed force field; computed from the board when omitted. */
  field?: ForceField;
  /** Side to move (§9). When set, moving the other colour is rejected. */
  turn?: PieceColor;
}

function deny(reason: string): MoveResult {
  return { allowed: false, reason, capture: 'none' };
}
function allow(capture: CaptureKind): MoveResult {
  return { allowed: true, reason: '', capture };
}

/**
 * §6 — a royal piece that is the ONLY royal of its colour in its own castle may
 * not move outside that castle while at least one enemy royal stands in the same
 * castle. Moving within the castle is always allowed.
 */
function royalCastleAllowsExit(
  board: BoardState,
  mover: Piece,
  from: Square,
  to: Square,
): boolean {
  if (!isRoyal(mover.type)) return true;
  const ownCastle = mover.color === PieceColor.WHITE ? CASTLE_WHITE : CASTLE_BLACK;
  if (!ownCastle.includes(from)) return true; // mover is not in its own castle
  if (ownCastle.includes(to)) return true; // staying inside the castle
  let ownRoyals = 0;
  let enemyRoyals = 0;
  for (const sq of ownCastle) {
    const p = board.get(sq);
    if (!p || !isRoyal(p.type)) continue;
    if (p.color === mover.color) ownRoyals++;
    else enemyRoyals++;
  }
  return !(ownRoyals === 1 && enemyRoyals >= 1);
}

/**
 * Validate a move (§4–6): movability → castle/§6 restrictions → capture rules
 * (strict force majority, Scout specials, royal-only captures on castle cells).
 */
export function validateMove(
  board: BoardState,
  from: Square,
  to: Square,
  opts: ValidateOptions = {},
): MoveResult {
  const mover = board.get(from);
  if (!mover) return deny('Нет фигуры на исходной клетке');
  if (opts.turn && opts.turn !== mover.color) return deny('Сейчас ход другой стороны');

  const target = findTarget(board, from, to);
  if (!target) return deny('Фигура так не ходит');

  if (!royalCastleAllowsExit(board, mover, from, to)) {
    return deny(
      'Королевская фигура одна в своём замке при королевской противника — ход за пределы замка запрещён',
    );
  }

  const onCastle = isCastle(to);

  // §1/§4 — only a royal piece may LAND on a castle cell, by a simple move OR a
  // capture. Two documented exceptions: a Ver Knecht promoting onto an EMPTY
  // castle cell, and the Scout's §5 castle exchange (a capture). Everything else
  // — Knecht, Ritter, a VK onto an OCCUPIED castle, a Scout stepping onto an
  // empty castle — is rejected (§8 message), whether the move is simple or a
  // capture.
  if (onCastle) {
    const vkPromotion = mover.type === PieceType.VER_KNEKHT && !target.capture;
    const scoutExchange = mover.type === PieceType.SCOUT && target.capture;
    if (!isRoyal(mover.type) && !vkPromotion && !scoutExchange) {
      return deny(MSG_CASTLE_NON_ROYAL);
    }
  }

  // Simple (non-capturing) move: movability + the restrictions above are enough (§4).
  if (!target.capture) return allow('none');

  // Scout specials (§5): unlimited capture on a normal cell; exchange on a castle.
  if (mover.type === PieceType.SCOUT) {
    return onCastle ? allow('scout-exchange') : allow('normal');
  }

  // Strict majority of attacking over defending force on the capture cell (§4).
  const field = opts.field ?? computeForceField(board);
  const f = forceAt(field, to);
  const attack = mover.color === PieceColor.WHITE ? f.white : f.black;
  const defend = mover.color === PieceColor.WHITE ? f.black : f.white;
  if (attack > defend) return allow('normal');
  return deny(MSG_NO_MAJORITY);
}
