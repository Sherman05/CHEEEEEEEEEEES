import { Piece, PieceType, Square, BoardState, ALL_CASTLES } from './pieces';

export function checkScoutCapture(
  piece: Piece,
  _from: Square,
  to: Square,
  board: BoardState
): boolean {
  if (piece.type !== PieceType.SCOUT) return false;
  if (!ALL_CASTLES.includes(to)) return false;

  const targetPiece = board.get(to);
  if (!targetPiece) return false;
  if (targetPiece.color === piece.color) return false;

  // Scout captures on castle square: both pieces disappear
  return true;
}
