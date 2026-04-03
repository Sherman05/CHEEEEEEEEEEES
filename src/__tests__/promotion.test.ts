import { describe, it, expect } from 'vitest';
import { checkPromotion } from '../logic/promotion';
import { PieceType, PieceColor } from '../logic/pieces';

describe('promotion.ts', () => {
  describe('Knekht → Ver Knekht (auto)', () => {
    it('white knekht on rank 6 auto-promotes', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.WHITE },
        'c6'
      );
      expect(result).toEqual({ auto: true });
    });

    it('black knekht on rank 3 auto-promotes', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.BLACK },
        'e3'
      );
      expect(result).toEqual({ auto: true });
    });

    it('white knekht on rank 5 does NOT promote', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.WHITE },
        'a5'
      );
      expect(result).toBeNull();
    });

    it('black knekht on rank 4 does NOT promote', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.BLACK },
        'a4'
      );
      expect(result).toBeNull();
    });
  });

  describe('Ver Knekht on edge squares (4 options)', () => {
    it('white VK on a8 gets 4 options', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        'a8'
      );
      expect(result?.auto).toBe(false);
      expect(result?.options).toHaveLength(4);
      const types = result!.options!.map(o => o.type);
      expect(types).toContain(PieceType.KONNET);
      expect(types).toContain(PieceType.PRINCE);
      expect(types).toContain(PieceType.RITTER);
      expect(types).toContain(PieceType.SCOUT);
    });

    it('black VK on g1 gets 4 options', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK },
        'g1'
      );
      expect(result?.auto).toBe(false);
      expect(result?.options).toHaveLength(4);
    });

    it('white VK on b8 gets 4 options', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        'b8'
      );
      expect(result?.options).toHaveLength(4);
    });
  });

  describe('Ver Knekht on castle squares (2 options)', () => {
    it('white VK on c8 (castle) gets 2 options', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        'c8'
      );
      expect(result?.auto).toBe(false);
      expect(result?.options).toHaveLength(2);
      const types = result!.options!.map(o => o.type);
      expect(types).toContain(PieceType.KONNET);
      expect(types).toContain(PieceType.PRINCE);
    });

    it('black VK on d1 (castle) gets 2 options', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK },
        'd1'
      );
      expect(result?.options).toHaveLength(2);
    });
  });

  describe('Prince promotions', () => {
    it('white Prince on d8 (castle) gets 2 options', () => {
      const result = checkPromotion(
        { type: PieceType.PRINCE, color: PieceColor.WHITE },
        'd8'
      );
      expect(result?.auto).toBe(false);
      expect(result?.options).toHaveLength(2);
    });

    it('black Prince on e1 (castle) gets 2 options', () => {
      const result = checkPromotion(
        { type: PieceType.PRINCE, color: PieceColor.BLACK },
        'e1'
      );
      expect(result?.options).toHaveLength(2);
    });

    it('white Prince on a5 does NOT promote', () => {
      const result = checkPromotion(
        { type: PieceType.PRINCE, color: PieceColor.WHITE },
        'a5'
      );
      expect(result).toBeNull();
    });
  });

  describe('non-promoting pieces', () => {
    it('King never promotes', () => {
      expect(checkPromotion({ type: PieceType.KING, color: PieceColor.WHITE }, 'e8')).toBeNull();
    });

    it('Ritter never promotes', () => {
      expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.WHITE }, 'a8')).toBeNull();
    });

    it('Scout never promotes', () => {
      expect(checkPromotion({ type: PieceType.SCOUT, color: PieceColor.BLACK }, 'b1')).toBeNull();
    });
  });
});
