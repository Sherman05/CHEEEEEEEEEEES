import { describe, it, expect } from 'vitest';
import {
  PieceType, PieceColor, FILES,
  createInitialPosition, cloneBoard, toSquare, parseSquare,
  isCastle, isWhiteCastle, isBlackCastle,
  boardToSerializable, boardFromSerializable,
  CASTLE_WHITE, CASTLE_BLACK,
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
  });

  describe('cloneBoard', () => {
    it('creates an independent copy', () => {
      const board = createInitialPosition();
      const clone = cloneBoard(board);
      clone.delete('a1');
      expect(board.get('a1')).toBeDefined();
      expect(clone.get('a1')).toBeUndefined();
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
  });
});
