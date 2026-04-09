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

  describe('individual castle squares - white scout captures black', () => {
    it('white scout captures on c1', () => {
      const board: BoardState = new Map();
      board.set('c1', { type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'b2', 'c1', board)).toBe(true);
    });

    it('white scout captures on d1', () => {
      const board: BoardState = new Map();
      board.set('d1', { type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'c2', 'd1', board)).toBe(true);
    });

    it('white scout captures on e1', () => {
      const board: BoardState = new Map();
      board.set('e1', { type: PieceType.KING, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'd2', 'e1', board)).toBe(true);
    });

    it('white scout captures on f1', () => {
      const board: BoardState = new Map();
      board.set('f1', { type: PieceType.KONNET, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'e2', 'f1', board)).toBe(true);
    });

    it('white scout captures on c8', () => {
      const board: BoardState = new Map();
      board.set('c8', { type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'c7', 'c8', board)).toBe(true);
    });

    it('white scout captures on d8', () => {
      const board: BoardState = new Map();
      board.set('d8', { type: PieceType.KONNET, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'd7', 'd8', board)).toBe(true);
    });

    it('white scout captures on e8', () => {
      const board: BoardState = new Map();
      board.set('e8', { type: PieceType.KING, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'e7', 'e8', board)).toBe(true);
    });

    it('white scout captures on f8', () => {
      const board: BoardState = new Map();
      board.set('f8', { type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'f7', 'f8', board)).toBe(true);
    });
  });

  describe('individual castle squares - black scout captures white', () => {
    it('black scout captures on c1', () => {
      const board: BoardState = new Map();
      board.set('c1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'c2', 'c1', board)).toBe(true);
    });

    it('black scout captures on d1', () => {
      const board: BoardState = new Map();
      board.set('d1', { type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'd2', 'd1', board)).toBe(true);
    });

    it('black scout captures on e1', () => {
      const board: BoardState = new Map();
      board.set('e1', { type: PieceType.KING, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'e2', 'e1', board)).toBe(true);
    });

    it('black scout captures on f1', () => {
      const board: BoardState = new Map();
      board.set('f1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'f2', 'f1', board)).toBe(true);
    });

    it('black scout captures on c8', () => {
      const board: BoardState = new Map();
      board.set('c8', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'c7', 'c8', board)).toBe(true);
    });

    it('black scout captures on d8', () => {
      const board: BoardState = new Map();
      board.set('d8', { type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'd7', 'd8', board)).toBe(true);
    });

    it('black scout captures on e8', () => {
      const board: BoardState = new Map();
      board.set('e8', { type: PieceType.KING, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'e7', 'e8', board)).toBe(true);
    });

    it('black scout captures on f8', () => {
      const board: BoardState = new Map();
      board.set('f8', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'f7', 'f8', board)).toBe(true);
    });
  });

  describe('scout vs every piece type on castle', () => {
    const pieceTypes = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT, PieceType.SCOUT];

    for (const pt of pieceTypes) {
      it(`white scout captures black ${pt} on castle`, () => {
        const board: BoardState = new Map();
        board.set('d8', { type: pt, color: PieceColor.BLACK });
        expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'd7', 'd8', board)).toBe(true);
      });
    }

    for (const pt of pieceTypes) {
      it(`black scout captures white ${pt} on castle`, () => {
        const board: BoardState = new Map();
        board.set('e1', { type: pt, color: PieceColor.WHITE });
        expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'e2', 'e1', board)).toBe(true);
      });
    }
  });

  describe('non-castle captures always fail', () => {
    it('scout cannot special-capture on a1', () => {
      const board: BoardState = new Map();
      board.set('a1', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'a2', 'a1', board)).toBe(false);
    });

    it('scout cannot special-capture on h8', () => {
      const board: BoardState = new Map();
      board.set('h8', { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'h7', 'h8', board)).toBe(false);
    });

    it('scout cannot special-capture on b1', () => {
      const board: BoardState = new Map();
      board.set('b1', { type: PieceType.SCOUT, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'b2', 'b1', board)).toBe(false);
    });

    it('scout cannot special-capture on g8', () => {
      const board: BoardState = new Map();
      board.set('g8', { type: PieceType.SCOUT, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'g7', 'g8', board)).toBe(false);
    });

    it('scout cannot special-capture on e4 (mid-board)', () => {
      const board: BoardState = new Map();
      board.set('e4', { type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'e3', 'e4', board)).toBe(false);
    });
  });

  describe('same color attempts always fail', () => {
    it('white scout cannot capture white piece on white castle', () => {
      const board: BoardState = new Map();
      board.set('c1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'b2', 'c1', board)).toBe(false);
    });

    it('white scout cannot capture white piece on black castle', () => {
      const board: BoardState = new Map();
      board.set('c8', { type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'c7', 'c8', board)).toBe(false);
    });

    it('black scout cannot capture black piece on white castle', () => {
      const board: BoardState = new Map();
      board.set('d1', { type: PieceType.KONNET, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'd2', 'd1', board)).toBe(false);
    });

    it('black scout cannot capture black piece on black castle', () => {
      const board: BoardState = new Map();
      board.set('e8', { type: PieceType.KING, color: PieceColor.BLACK });
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'e7', 'e8', board)).toBe(false);
    });
  });

  describe('non-scout pieces never trigger special capture', () => {
    const nonScoutTypes = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT];

    for (const pt of nonScoutTypes) {
      it(`${pt} does not trigger special capture on castle`, () => {
        const board: BoardState = new Map();
        board.set('d8', { type: PieceType.RITTER, color: PieceColor.BLACK });
        expect(checkScoutCapture({ type: pt, color: PieceColor.WHITE }, 'd7', 'd8', board)).toBe(false);
      });
    }
  });

  describe('empty castle square always fails', () => {
    it('empty c1', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'c2', 'c1', new Map())).toBe(false);
    });
    it('empty d1', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'd2', 'd1', new Map())).toBe(false);
    });
    it('empty e1', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'e2', 'e1', new Map())).toBe(false);
    });
    it('empty f1', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'f2', 'f1', new Map())).toBe(false);
    });
    it('empty c8', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'c7', 'c8', new Map())).toBe(false);
    });
    it('empty d8', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'd7', 'd8', new Map())).toBe(false);
    });
    it('empty e8', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'e7', 'e8', new Map())).toBe(false);
    });
    it('empty f8', () => {
      expect(checkScoutCapture({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'f7', 'f8', new Map())).toBe(false);
    });
  });
});
