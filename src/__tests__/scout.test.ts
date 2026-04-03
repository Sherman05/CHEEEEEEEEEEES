import { describe, it, expect } from 'vitest';
import { checkScoutCapture } from '../logic/scout';
import { PieceType, PieceColor, BoardState } from '../logic/pieces';

describe('scout.ts — special capture', () => {
  it('scout captures enemy on castle square', () => {
    const board: BoardState = new Map();
    board.set('c1', { type: PieceType.KONNET, color: PieceColor.BLACK });
    const scout = { type: PieceType.SCOUT, color: PieceColor.WHITE };
    expect(checkScoutCapture(scout, 'b2', 'c1', board)).toBe(true);
  });

  it('scout does NOT capture on non-castle square', () => {
    const board: BoardState = new Map();
    board.set('a1', { type: PieceType.KONNET, color: PieceColor.BLACK });
    const scout = { type: PieceType.SCOUT, color: PieceColor.WHITE };
    expect(checkScoutCapture(scout, 'a2', 'a1', board)).toBe(false);
  });

  it('scout does NOT capture own piece on castle', () => {
    const board: BoardState = new Map();
    board.set('d1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    const scout = { type: PieceType.SCOUT, color: PieceColor.WHITE };
    expect(checkScoutCapture(scout, 'c2', 'd1', board)).toBe(false);
  });

  it('scout does NOT capture on empty castle square', () => {
    const board: BoardState = new Map();
    const scout = { type: PieceType.SCOUT, color: PieceColor.WHITE };
    expect(checkScoutCapture(scout, 'c2', 'c8', board)).toBe(false);
  });

  it('non-scout piece does NOT trigger special capture', () => {
    const board: BoardState = new Map();
    board.set('c8', { type: PieceType.KING, color: PieceColor.BLACK });
    const ritter = { type: PieceType.RITTER, color: PieceColor.WHITE };
    expect(checkScoutCapture(ritter, 'c7', 'c8', board)).toBe(false);
  });

  it('works for black scout on white castle', () => {
    const board: BoardState = new Map();
    board.set('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    const scout = { type: PieceType.SCOUT, color: PieceColor.BLACK };
    expect(checkScoutCapture(scout, 'e2', 'e1', board)).toBe(true);
  });

  it('works for all castle squares', () => {
    const castles = ['c1', 'd1', 'e1', 'f1', 'c8', 'd8', 'e8', 'f8'];
    for (const sq of castles) {
      const board: BoardState = new Map();
      board.set(sq, { type: PieceType.RITTER, color: PieceColor.BLACK });
      const scout = { type: PieceType.SCOUT, color: PieceColor.WHITE };
      expect(checkScoutCapture(scout, 'a1', sq, board)).toBe(true);
    }
  });
});
