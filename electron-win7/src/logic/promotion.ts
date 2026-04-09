import { Piece, PieceType, PieceColor, Square, parseSquare, CASTLE_BLACK, CASTLE_WHITE } from './pieces';

export interface PromotionResult {
  auto: boolean;
  options?: Piece[];
}

export function checkPromotion(piece: Piece, toSquare: Square): PromotionResult | null {
  const { rank } = parseSquare(toSquare);

  // Knekht -> Ver Knekht (automatic)
  if (piece.type === PieceType.KNEKHT) {
    if (piece.color === PieceColor.WHITE && rank === 6) {
      return { auto: true };
    }
    if (piece.color === PieceColor.BLACK && rank === 3) {
      return { auto: true };
    }
  }

  // Ver Knekht promotions
  if (piece.type === PieceType.VER_KNEKHT) {
    // White VK on row 8 edge squares
    if (piece.color === PieceColor.WHITE && ['a8', 'b8', 'g8', 'h8'].includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.WHITE },
          { type: PieceType.PRINCE, color: PieceColor.WHITE },
          { type: PieceType.RITTER, color: PieceColor.WHITE },
          { type: PieceType.SCOUT, color: PieceColor.WHITE },
        ],
      };
    }
    // Black VK on row 1 edge squares
    if (piece.color === PieceColor.BLACK && ['a1', 'b1', 'g1', 'h1'].includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.BLACK },
          { type: PieceType.PRINCE, color: PieceColor.BLACK },
          { type: PieceType.RITTER, color: PieceColor.BLACK },
          { type: PieceType.SCOUT, color: PieceColor.BLACK },
        ],
      };
    }
    // White VK on castle black (c8-f8)
    if (piece.color === PieceColor.WHITE && CASTLE_BLACK.includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.WHITE },
          { type: PieceType.PRINCE, color: PieceColor.WHITE },
        ],
      };
    }
    // Black VK on castle white (c1-f1)
    if (piece.color === PieceColor.BLACK && CASTLE_WHITE.includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.BLACK },
          { type: PieceType.PRINCE, color: PieceColor.BLACK },
        ],
      };
    }
  }

  // Prince promotions
  if (piece.type === PieceType.PRINCE) {
    // White Prince on castle black
    if (piece.color === PieceColor.WHITE && CASTLE_BLACK.includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.WHITE },
          { type: PieceType.PRINCE, color: PieceColor.WHITE },
        ],
      };
    }
    // Black Prince on castle white
    if (piece.color === PieceColor.BLACK && CASTLE_WHITE.includes(toSquare)) {
      return {
        auto: false,
        options: [
          { type: PieceType.KONNET, color: PieceColor.BLACK },
          { type: PieceType.PRINCE, color: PieceColor.BLACK },
        ],
      };
    }
  }

  return null;
}
