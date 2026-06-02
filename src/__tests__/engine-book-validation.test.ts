import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { computeForceField, forceAt } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

/** Build a board from a compact map of square → [type, color]. */
function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}

/** Force at a cell as the plain {white, black} pair the book quotes. */
function force(board: BoardState, target: Square): { white: number; black: number } {
  const f = forceAt(computeForceField(board), target);
  return { white: f.white, black: f.black };
}

// Independent validation against worked-out positions FROM THE BOOKS.
// The book numbers are ground truth: expected values are the book's, never
// tuned to whatever the engine happens to output.
describe('book-validated force field', () => {
  it('A — d3: Ritter d3 (W) vs Ver Knecht e3 (B) → (2, 1.5)', () => {
    const board = mk({
      d3: [PieceType.RITTER, W],
      e3: [PieceType.VER_KNEKHT, B],
    });
    expect(force(board, 'd3')).toEqual({ white: 2, black: 1.5 });
  });

  it('B — g3: VerKnecht g3 + Knecht g4 (B) vs King f2 + Knecht g2 + Knecht h3 (W) → (3.5, 2.5)', () => {
    const board = mk({
      g3: [PieceType.VER_KNEKHT, B],
      g4: [PieceType.KNEKHT, B],
      f2: [PieceType.KING, W],
      g2: [PieceType.KNEKHT, W],
      h3: [PieceType.KNEKHT, W],
    });
    expect(force(board, 'g3')).toEqual({ white: 3.5, black: 2.5 });
  });

  it('C — b6: Konnet b6 + Knecht b5 (W) vs Ritter d6 + Prince d4 (B) → (4, 3.5) [Ritter jump, Prince diagonal]', () => {
    const board = mk({
      b6: [PieceType.KONNET, W],
      b5: [PieceType.KNEKHT, W],
      d6: [PieceType.RITTER, B],
      d4: [PieceType.PRINCE, B],
    });
    expect(force(board, 'b6')).toEqual({ white: 4, black: 3.5 });
  });

  it('D — d3: Knecht d3 + Ritter c3 + Knecht e3 (W) vs Prince d4 (B) → (4, 1.5)', () => {
    const board = mk({
      d3: [PieceType.KNEKHT, W],
      c3: [PieceType.RITTER, W],
      e3: [PieceType.KNEKHT, W],
      d4: [PieceType.PRINCE, B],
    });
    expect(force(board, 'd3')).toEqual({ white: 4, black: 1.5 });
  });

  it('E — c8 (castle): Ritter b8 + Prince c7 (W) vs King c8 (B) → (3.5, 1.5) [non-royal Ritter still projects onto castle]', () => {
    const board = mk({
      b8: [PieceType.RITTER, W],
      c7: [PieceType.PRINCE, W],
      c8: [PieceType.KING, B],
    });
    expect(force(board, 'c8')).toEqual({ white: 3.5, black: 1.5 });
  });
});
