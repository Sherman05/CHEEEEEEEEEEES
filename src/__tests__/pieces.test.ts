import { describe, it, expect } from 'vitest';
import {
  PieceType, PieceColor, FILES, RANKS,
  createInitialPosition, cloneBoard, toSquare, parseSquare,
  isCastle, isWhiteCastle, isBlackCastle,
  boardToSerializable, boardFromSerializable,
  CASTLE_WHITE, CASTLE_BLACK, ALL_CASTLES,
} from '../logic/pieces';

describe('pieces.ts', () => {
  describe('createInitialPosition', () => {
    it('returns a board with 32 pieces', () => {
      const board = createInitialPosition();
      expect(board.size).toBe(32);
    });

    it('has correct white back rank', () => {
      const board = createInitialPosition();
      expect(board.get('a1')).toEqual({ type: PieceType.RITTER, color: PieceColor.WHITE });
      expect(board.get('b1')).toEqual({ type: PieceType.SCOUT, color: PieceColor.WHITE });
      expect(board.get('c1')).toEqual({ type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(board.get('d1')).toEqual({ type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(board.get('e1')).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
      expect(board.get('f1')).toEqual({ type: PieceType.PRINCE, color: PieceColor.WHITE });
      expect(board.get('g1')).toEqual({ type: PieceType.SCOUT, color: PieceColor.WHITE });
      expect(board.get('h1')).toEqual({ type: PieceType.RITTER, color: PieceColor.WHITE });
    });

    it('has correct black back rank', () => {
      const board = createInitialPosition();
      expect(board.get('a8')).toEqual({ type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(board.get('d8')).toEqual({ type: PieceType.KONNET, color: PieceColor.BLACK });
      expect(board.get('e8')).toEqual({ type: PieceType.KING, color: PieceColor.BLACK });
    });

    it('has 8 white knechts on rank 2', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        const piece = board.get(toSquare(file, 2));
        expect(piece).toEqual({ type: PieceType.KNEKHT, color: PieceColor.WHITE });
      }
    });

    it('has 8 black knechts on rank 7', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        const piece = board.get(toSquare(file, 7));
        expect(piece).toEqual({ type: PieceType.KNEKHT, color: PieceColor.BLACK });
      }
    });

    it('has empty squares on ranks 3-6', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        for (const rank of [3, 4, 5, 6]) {
          expect(board.get(toSquare(file, rank))).toBeUndefined();
        }
      }
    });

    it('has 16 white pieces', () => {
      const board = createInitialPosition();
      let whiteCount = 0;
      board.forEach((piece) => {
        if (piece.color === PieceColor.WHITE) whiteCount++;
      });
      expect(whiteCount).toBe(16);
    });

    it('has 16 black pieces', () => {
      const board = createInitialPosition();
      let blackCount = 0;
      board.forEach((piece) => {
        if (piece.color === PieceColor.BLACK) blackCount++;
      });
      expect(blackCount).toBe(16);
    });

    it('has exactly 1 white king', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KING && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(1);
    });

    it('has exactly 1 black king', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KING && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(1);
    });

    it('has exactly 1 white konnet', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KONNET && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(1);
    });

    it('has exactly 1 black konnet', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KONNET && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(1);
    });

    it('has exactly 2 white princes', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.PRINCE && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 2 black princes', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.PRINCE && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 2 white ritters', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.RITTER && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 2 black ritters', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.RITTER && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 2 white scouts', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.SCOUT && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 2 black scouts', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.SCOUT && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(2);
    });

    it('has exactly 8 white knechts', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KNEKHT && piece.color === PieceColor.WHITE) count++;
      });
      expect(count).toBe(8);
    });

    it('has exactly 8 black knechts', () => {
      const board = createInitialPosition();
      let count = 0;
      board.forEach((piece) => {
        if (piece.type === PieceType.KNEKHT && piece.color === PieceColor.BLACK) count++;
      });
      expect(count).toBe(8);
    });

    it('has symmetric piece types between white and black back ranks', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        const whitePiece = board.get(toSquare(file, 1));
        const blackPiece = board.get(toSquare(file, 8));
        expect(whitePiece!.type).toBe(blackPiece!.type);
      }
    });

    it('white back rank colors are all white', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        expect(board.get(toSquare(file, 1))!.color).toBe(PieceColor.WHITE);
      }
    });

    it('black back rank colors are all black', () => {
      const board = createInitialPosition();
      for (const file of FILES) {
        expect(board.get(toSquare(file, 8))!.color).toBe(PieceColor.BLACK);
      }
    });

    it('has no VER_KNEKHT in initial position', () => {
      const board = createInitialPosition();
      board.forEach((piece) => {
        expect(piece.type).not.toBe(PieceType.VER_KNEKHT);
      });
    });

    it('full black back rank is correct', () => {
      const board = createInitialPosition();
      expect(board.get('b8')).toEqual({ type: PieceType.SCOUT, color: PieceColor.BLACK });
      expect(board.get('c8')).toEqual({ type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(board.get('f8')).toEqual({ type: PieceType.PRINCE, color: PieceColor.BLACK });
      expect(board.get('g8')).toEqual({ type: PieceType.SCOUT, color: PieceColor.BLACK });
      expect(board.get('h8')).toEqual({ type: PieceType.RITTER, color: PieceColor.BLACK });
    });
  });

  describe('cloneBoard', () => {
    it('creates an independent copy', () => {
      const board = createInitialPosition();
      const clone = cloneBoard(board);
      clone.delete('a1');
      expect(board.get('a1')).toBeDefined();
      expect(clone.get('a1')).toBeUndefined();
    });

    it('has the same size as original', () => {
      const board = createInitialPosition();
      const clone = cloneBoard(board);
      expect(clone.size).toBe(board.size);
    });

    it('clones an empty board', () => {
      const board = new Map();
      const clone = cloneBoard(board);
      expect(clone.size).toBe(0);
    });

    it('preserves all piece data', () => {
      const board = createInitialPosition();
      const clone = cloneBoard(board);
      board.forEach((piece, sq) => {
        expect(clone.get(sq)).toEqual(piece);
      });
    });
  });

  describe('toSquare / parseSquare', () => {
    it('converts file and rank to square notation', () => {
      expect(toSquare('a', 1)).toBe('a1');
      expect(toSquare('h', 8)).toBe('h8');
    });

    it('parses square notation', () => {
      expect(parseSquare('a1')).toEqual({ file: 'a', rank: 1 });
      expect(parseSquare('h8')).toEqual({ file: 'h', rank: 8 });
    });

    it('toSquare for every file on rank 1', () => {
      expect(toSquare('a', 1)).toBe('a1');
      expect(toSquare('b', 1)).toBe('b1');
      expect(toSquare('c', 1)).toBe('c1');
      expect(toSquare('d', 1)).toBe('d1');
      expect(toSquare('e', 1)).toBe('e1');
      expect(toSquare('f', 1)).toBe('f1');
      expect(toSquare('g', 1)).toBe('g1');
      expect(toSquare('h', 1)).toBe('h1');
    });

    it('parseSquare for every file on rank 8', () => {
      for (const file of FILES) {
        const sq = `${file}8`;
        expect(parseSquare(sq)).toEqual({ file, rank: 8 });
      }
    });

    it('roundtrips toSquare and parseSquare for all 64 squares', () => {
      for (const file of FILES) {
        for (const rank of RANKS) {
          const sq = toSquare(file, rank);
          const parsed = parseSquare(sq);
          expect(parsed.file).toBe(file);
          expect(parsed.rank).toBe(rank);
        }
      }
    });

    it('parseSquare returns correct rank as number, not string', () => {
      const result = parseSquare('e5');
      expect(typeof result.rank).toBe('number');
      expect(result.rank).toBe(5);
    });
  });

  describe('castle helpers', () => {
    it('identifies white castle squares', () => {
      expect(isWhiteCastle('c1')).toBe(true);
      expect(isWhiteCastle('d1')).toBe(true);
      expect(isWhiteCastle('e1')).toBe(true);
      expect(isWhiteCastle('f1')).toBe(true);
      expect(isWhiteCastle('a1')).toBe(false);
      expect(isWhiteCastle('c8')).toBe(false);
    });

    it('identifies black castle squares', () => {
      expect(isBlackCastle('c8')).toBe(true);
      expect(isBlackCastle('f8')).toBe(true);
      expect(isBlackCastle('a8')).toBe(false);
    });

    it('isCastle returns true for all castle squares', () => {
      for (const sq of [...CASTLE_WHITE, ...CASTLE_BLACK]) {
        expect(isCastle(sq)).toBe(true);
      }
      expect(isCastle('a1')).toBe(false);
    });

    it('isWhiteCastle returns false for every black castle square', () => {
      for (const sq of CASTLE_BLACK) {
        expect(isWhiteCastle(sq)).toBe(false);
      }
    });

    it('isBlackCastle returns false for every white castle square', () => {
      for (const sq of CASTLE_WHITE) {
        expect(isBlackCastle(sq)).toBe(false);
      }
    });

    it('isCastle returns false for b1', () => {
      expect(isCastle('b1')).toBe(false);
    });

    it('isCastle returns false for g1', () => {
      expect(isCastle('g1')).toBe(false);
    });

    it('isCastle returns false for a8', () => {
      expect(isCastle('a8')).toBe(false);
    });

    it('isCastle returns false for b8', () => {
      expect(isCastle('b8')).toBe(false);
    });

    it('isCastle returns false for g8', () => {
      expect(isCastle('g8')).toBe(false);
    });

    it('isCastle returns false for h8', () => {
      expect(isCastle('h8')).toBe(false);
    });

    it('isCastle returns false for h1', () => {
      expect(isCastle('h1')).toBe(false);
    });

    it('isCastle returns false for every middle-board square', () => {
      for (const file of FILES) {
        for (const rank of [3, 4, 5, 6]) {
          expect(isCastle(toSquare(file, rank))).toBe(false);
        }
      }
    });

    it('CASTLE_WHITE has exactly 4 squares', () => {
      expect(CASTLE_WHITE).toHaveLength(4);
    });

    it('CASTLE_BLACK has exactly 4 squares', () => {
      expect(CASTLE_BLACK).toHaveLength(4);
    });

    it('ALL_CASTLES has exactly 8 squares', () => {
      expect(ALL_CASTLES).toHaveLength(8);
    });

    it('ALL_CASTLES contains all white and black castle squares', () => {
      for (const sq of CASTLE_WHITE) {
        expect(ALL_CASTLES).toContain(sq);
      }
      for (const sq of CASTLE_BLACK) {
        expect(ALL_CASTLES).toContain(sq);
      }
    });

    it('isBlackCastle returns true for d8 and e8', () => {
      expect(isBlackCastle('d8')).toBe(true);
      expect(isBlackCastle('e8')).toBe(true);
    });

    it('isBlackCastle returns false for h8', () => {
      expect(isBlackCastle('h8')).toBe(false);
    });

    it('isWhiteCastle returns false for b1 and g1', () => {
      expect(isWhiteCastle('b1')).toBe(false);
      expect(isWhiteCastle('g1')).toBe(false);
    });

    it('isWhiteCastle returns false for h1', () => {
      expect(isWhiteCastle('h1')).toBe(false);
    });

    it('isWhiteCastle returns false for a1', () => {
      expect(isWhiteCastle('a1')).toBe(false);
    });
  });

  describe('FILES and RANKS constants', () => {
    it('FILES has 8 entries', () => {
      expect(FILES).toHaveLength(8);
    });

    it('FILES are a through h', () => {
      expect([...FILES]).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    });

    it('RANKS has 8 entries', () => {
      expect(RANKS).toHaveLength(8);
    });

    it('RANKS are 1 through 8', () => {
      expect([...RANKS]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('serialization', () => {
    it('round-trips board through serializable format', () => {
      const board = createInitialPosition();
      const serialized = boardToSerializable(board);
      const restored = boardFromSerializable(serialized);
      expect(restored.size).toBe(board.size);
      board.forEach((piece, sq) => {
        expect(restored.get(sq)).toEqual(piece);
      });
    });

    it('serializes empty board to empty object', () => {
      const board = new Map();
      const serialized = boardToSerializable(board);
      expect(Object.keys(serialized)).toHaveLength(0);
    });

    it('deserializes empty object to empty board', () => {
      const board = boardFromSerializable({});
      expect(board.size).toBe(0);
    });

    it('serialized object has correct keys', () => {
      const board = createInitialPosition();
      const serialized = boardToSerializable(board);
      expect(Object.keys(serialized)).toHaveLength(32);
      expect(serialized['a1']).toEqual({ type: PieceType.RITTER, color: PieceColor.WHITE });
    });

    it('round-trips a single piece board', () => {
      const board = new Map();
      board.set('e4', { type: PieceType.KING, color: PieceColor.WHITE });
      const serialized = boardToSerializable(board);
      const restored = boardFromSerializable(serialized);
      expect(restored.size).toBe(1);
      expect(restored.get('e4')).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
    });

    it('preserves piece type and color through serialization', () => {
      const board = new Map();
      board.set('a1', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });
      const restored = boardFromSerializable(boardToSerializable(board));
      expect(restored.get('a1')!.type).toBe(PieceType.VER_KNEKHT);
      expect(restored.get('a1')!.color).toBe(PieceColor.BLACK);
    });

    it('round-trips board with every piece type', () => {
      const board: Map<string, { type: PieceType; color: PieceColor }> = new Map();
      const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT, PieceType.SCOUT];
      types.forEach((t, i) => {
        board.set(toSquare(FILES[i], 4), { type: t, color: PieceColor.WHITE });
      });
      const restored = boardFromSerializable(boardToSerializable(board));
      expect(restored.size).toBe(7);
      types.forEach((t, i) => {
        expect(restored.get(toSquare(FILES[i], 4))!.type).toBe(t);
      });
    });

    it('serialized keys match board squares exactly', () => {
      const board: Map<string, { type: PieceType; color: PieceColor }> = new Map();
      board.set('a1', { type: PieceType.KING, color: PieceColor.WHITE });
      board.set('h8', { type: PieceType.KING, color: PieceColor.BLACK });
      const ser = boardToSerializable(board);
      expect(Object.keys(ser).sort()).toEqual(['a1', 'h8']);
    });
  });

  describe('parseSquare edge cases', () => {
    it('parses a1 correctly', () => {
      expect(parseSquare('a1')).toEqual({ file: 'a', rank: 1 });
    });

    it('parses h8 correctly', () => {
      expect(parseSquare('h8')).toEqual({ file: 'h', rank: 8 });
    });

    it('parses every square on rank 1', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}1`)).toEqual({ file: f, rank: 1 });
      }
    });

    it('parses every square on rank 2', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}2`)).toEqual({ file: f, rank: 2 });
      }
    });

    it('parses every square on rank 3', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}3`)).toEqual({ file: f, rank: 3 });
      }
    });

    it('parses every square on rank 4', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}4`)).toEqual({ file: f, rank: 4 });
      }
    });

    it('parses every square on rank 5', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}5`)).toEqual({ file: f, rank: 5 });
      }
    });

    it('parses every square on rank 6', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}6`)).toEqual({ file: f, rank: 6 });
      }
    });

    it('parses every square on rank 7', () => {
      for (const f of FILES) {
        expect(parseSquare(`${f}7`)).toEqual({ file: f, rank: 7 });
      }
    });
  });

  describe('isCastle for every square on rank 1', () => {
    it('a1 is not castle', () => expect(isCastle('a1')).toBe(false));
    it('b1 is not castle', () => expect(isCastle('b1')).toBe(false));
    it('c1 is castle', () => expect(isCastle('c1')).toBe(true));
    it('d1 is castle', () => expect(isCastle('d1')).toBe(true));
    it('e1 is castle', () => expect(isCastle('e1')).toBe(true));
    it('f1 is castle', () => expect(isCastle('f1')).toBe(true));
    it('g1 is not castle', () => expect(isCastle('g1')).toBe(false));
    it('h1 is not castle', () => expect(isCastle('h1')).toBe(false));
  });

  describe('isCastle for every square on rank 8', () => {
    it('a8 is not castle', () => expect(isCastle('a8')).toBe(false));
    it('b8 is not castle', () => expect(isCastle('b8')).toBe(false));
    it('c8 is castle', () => expect(isCastle('c8')).toBe(true));
    it('d8 is castle', () => expect(isCastle('d8')).toBe(true));
    it('e8 is castle', () => expect(isCastle('e8')).toBe(true));
    it('f8 is castle', () => expect(isCastle('f8')).toBe(true));
    it('g8 is not castle', () => expect(isCastle('g8')).toBe(false));
    it('h8 is not castle', () => expect(isCastle('h8')).toBe(false));
  });

  describe('isCastle returns false for all rank 2-7 squares', () => {
    for (const rank of [2, 7]) {
      it(`all file squares on rank ${rank} are not castles`, () => {
        for (const file of FILES) {
          expect(isCastle(toSquare(file, rank))).toBe(false);
        }
      });
    }
  });

  describe('isWhiteCastle for every square on rank 1', () => {
    it('a1 false', () => expect(isWhiteCastle('a1')).toBe(false));
    it('b1 false', () => expect(isWhiteCastle('b1')).toBe(false));
    it('c1 true', () => expect(isWhiteCastle('c1')).toBe(true));
    it('d1 true', () => expect(isWhiteCastle('d1')).toBe(true));
    it('e1 true', () => expect(isWhiteCastle('e1')).toBe(true));
    it('f1 true', () => expect(isWhiteCastle('f1')).toBe(true));
    it('g1 false', () => expect(isWhiteCastle('g1')).toBe(false));
    it('h1 false', () => expect(isWhiteCastle('h1')).toBe(false));
  });

  describe('isBlackCastle for every square on rank 8', () => {
    it('a8 false', () => expect(isBlackCastle('a8')).toBe(false));
    it('b8 false', () => expect(isBlackCastle('b8')).toBe(false));
    it('c8 true', () => expect(isBlackCastle('c8')).toBe(true));
    it('d8 true', () => expect(isBlackCastle('d8')).toBe(true));
    it('e8 true', () => expect(isBlackCastle('e8')).toBe(true));
    it('f8 true', () => expect(isBlackCastle('f8')).toBe(true));
    it('g8 false', () => expect(isBlackCastle('g8')).toBe(false));
    it('h8 false', () => expect(isBlackCastle('h8')).toBe(false));
  });
});
