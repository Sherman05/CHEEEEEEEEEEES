import { PieceType } from '../logic/pieces';

/**
 * Strength of each piece in Knecht units (§2). Attack and defence strength are
 * equal for every piece except the Scout (§5).
 *
 * The Scout contributes 0 to the force field (it never appears in the W:/B: sums
 * and gives no support), while its *direct* capture strength on a normal cell is
 * unbounded — that "∞" special case lives in the validator (§5), not in this table.
 */
export const STRENGTH: Record<PieceType, number> = {
  [PieceType.KNEKHT]: 1,
  [PieceType.VER_KNEKHT]: 1.5,
  [PieceType.RITTER]: 2,
  [PieceType.PRINCE]: 1.5,
  [PieceType.KONNET]: 3,
  [PieceType.KING]: 1.5,
  [PieceType.SCOUT]: 0,
};

/** Royal pieces (§1): King, Konnet, Prince. The rest are non-royal. */
const ROYAL_TYPES: ReadonlySet<PieceType> = new Set([
  PieceType.KING,
  PieceType.KONNET,
  PieceType.PRINCE,
]);

export function isRoyal(type: PieceType): boolean {
  return ROYAL_TYPES.has(type);
}
