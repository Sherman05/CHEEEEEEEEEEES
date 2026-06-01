import { PieceColor, PieceType, isCastle, parseSquare } from '../logic/pieces';
import type { Square } from '../logic/pieces';
import { isRoyal } from './pieceInfo';

export interface PlacementResult {
  allowed: boolean;
  /** '' when allowed; otherwise a human-readable reason. */
  reason: string;
}

const OK: PlacementResult = { allowed: true, reason: '' };

/**
 * §7 placement rules (for the "Analysis — set position" mode):
 * - A Knecht may not be placed on its promotion ranks (white 6–8, black 1–3).
 * - Non-royal pieces (Knecht, Ver Knecht, Ritter, Scout) may not be placed on
 *   castle cells; royal pieces (King, Prince, Konnet) may.
 */
export function canPlace(type: PieceType, color: PieceColor, sq: Square): PlacementResult {
  if (type === PieceType.KNEKHT) {
    const { rank } = parseSquare(sq);
    if (color === PieceColor.WHITE && rank >= 6) {
      return { allowed: false, reason: 'Кнехта нельзя ставить на ряды промоции (6–8)' };
    }
    if (color === PieceColor.BLACK && rank <= 3) {
      return { allowed: false, reason: 'Кнехта нельзя ставить на ряды промоции (1–3)' };
    }
  }
  if (!isRoyal(type) && isCastle(sq)) {
    return { allowed: false, reason: 'Некоролевскую фигуру нельзя ставить на клетку замка' };
  }
  return OK;
}
