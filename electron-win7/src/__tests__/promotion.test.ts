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

  describe('VK edge promotion must NOT include King', () => {
    it('white VK on h8 options are Konnet/Prince/Ritter/Scout, NOT King', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        'h8'
      );
      expect(result?.options).toHaveLength(4);
      const types = result!.options!.map(o => o.type);
      expect(types).not.toContain(PieceType.KING);
      expect(types).toContain(PieceType.KONNET);
    });

    it('black VK on a1 options are Konnet/Prince/Ritter/Scout, NOT King', () => {
      const result = checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK },
        'a1'
      );
      expect(result?.options).toHaveLength(4);
      const types = result!.options!.map(o => o.type);
      expect(types).not.toContain(PieceType.KING);
      expect(types).toContain(PieceType.KONNET);
    });
  });

  describe('Knekht cannot reach promotion rows directly', () => {
    it('white Knekht on rank 7 does NOT trigger promotion (blocked by move logic)', () => {
      // Knekht should never reach rank 7 due to Board.tsx blocking
      // But if somehow it did, promotion.ts returns null (no rule for Knekht on 7)
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.WHITE },
        'a7'
      );
      expect(result).toBeNull();
    });

    it('white Knekht on rank 8 does NOT trigger promotion', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.WHITE },
        'a8'
      );
      expect(result).toBeNull();
    });

    it('black Knekht on rank 2 does NOT trigger promotion', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.BLACK },
        'h2'
      );
      expect(result).toBeNull();
    });

    it('black Knekht on rank 1 does NOT trigger promotion', () => {
      const result = checkPromotion(
        { type: PieceType.KNEKHT, color: PieceColor.BLACK },
        'h1'
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

    it('Konnet never promotes on any square', () => {
      for (const sq of ['a1', 'h8', 'c8', 'd1', 'e4']) {
        expect(checkPromotion({ type: PieceType.KONNET, color: PieceColor.WHITE }, sq)).toBeNull();
        expect(checkPromotion({ type: PieceType.KONNET, color: PieceColor.BLACK }, sq)).toBeNull();
      }
    });

    it('white King on every rank 8 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.KING, color: PieceColor.WHITE }, `${f}8`)).toBeNull();
      }
    });

    it('black King on every rank 1 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.KING, color: PieceColor.BLACK }, `${f}1`)).toBeNull();
      }
    });

    it('white Ritter on every rank 8 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.WHITE }, `${f}8`)).toBeNull();
      }
    });

    it('black Ritter on every rank 1 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.BLACK }, `${f}1`)).toBeNull();
      }
    });

    it('white Scout on every rank 8 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.SCOUT, color: PieceColor.WHITE }, `${f}8`)).toBeNull();
      }
    });

    it('black Scout on every rank 1 square returns null', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.SCOUT, color: PieceColor.BLACK }, `${f}1`)).toBeNull();
      }
    });

    it('white Ritter on edge squares (a1, h1) returns null', () => {
      expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.WHITE }, 'a1')).toBeNull();
      expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.WHITE }, 'h1')).toBeNull();
    });

    it('black Ritter on edge squares (a8, h8) returns null', () => {
      expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.BLACK }, 'a8')).toBeNull();
      expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.BLACK }, 'h8')).toBeNull();
    });
  });

  describe('white VK edge promotion - each square individually', () => {
    it('white VK on a8 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
      expect(result?.options).toHaveLength(4);
    });
    it('white VK on b8 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'b8');
      expect(result?.options).toHaveLength(4);
    });
    it('white VK on g8 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'g8');
      expect(result?.options).toHaveLength(4);
    });
    it('white VK on h8 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'h8');
      expect(result?.options).toHaveLength(4);
    });
  });

  describe('black VK edge promotion - each square individually', () => {
    it('black VK on a1 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'a1');
      expect(result?.options).toHaveLength(4);
    });
    it('black VK on b1 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'b1');
      expect(result?.options).toHaveLength(4);
    });
    it('black VK on g1 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'g1');
      expect(result?.options).toHaveLength(4);
    });
    it('black VK on h1 returns 4 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'h1');
      expect(result?.options).toHaveLength(4);
    });
  });

  describe('white VK castle promotion - each square individually', () => {
    it('white VK on c8 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'c8');
      expect(result?.options).toHaveLength(2);
    });
    it('white VK on d8 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'd8');
      expect(result?.options).toHaveLength(2);
    });
    it('white VK on e8 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'e8');
      expect(result?.options).toHaveLength(2);
    });
    it('white VK on f8 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'f8');
      expect(result?.options).toHaveLength(2);
    });
  });

  describe('black VK castle promotion - each square individually', () => {
    it('black VK on c1 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'c1');
      expect(result?.options).toHaveLength(2);
    });
    it('black VK on d1 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'd1');
      expect(result?.options).toHaveLength(2);
    });
    it('black VK on e1 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'e1');
      expect(result?.options).toHaveLength(2);
    });
    it('black VK on f1 returns 2 options', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'f1');
      expect(result?.options).toHaveLength(2);
    });
  });

  describe('KING is never in promotion options', () => {
    it('white VK edge options never include KING', () => {
      for (const sq of ['a8', 'b8', 'g8', 'h8']) {
        const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });

    it('black VK edge options never include KING', () => {
      for (const sq of ['a1', 'b1', 'g1', 'h1']) {
        const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });

    it('white VK castle options never include KING', () => {
      for (const sq of ['c8', 'd8', 'e8', 'f8']) {
        const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });

    it('black VK castle options never include KING', () => {
      for (const sq of ['c1', 'd1', 'e1', 'f1']) {
        const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });

    it('white Prince castle options never include KING', () => {
      for (const sq of ['c8', 'd8', 'e8', 'f8']) {
        const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });

    it('black Prince castle options never include KING', () => {
      for (const sq of ['c1', 'd1', 'e1', 'f1']) {
        const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, sq);
        const types = result!.options!.map(o => o.type);
        expect(types).not.toContain(PieceType.KING);
      }
    });
  });

  describe('promotion options have correct color', () => {
    it('white VK edge options are all white', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.WHITE);
      }
    });

    it('black VK edge options are all black', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'a1');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.BLACK);
      }
    });

    it('white VK castle options are all white', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'c8');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.WHITE);
      }
    });

    it('black VK castle options are all black', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'c1');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.BLACK);
      }
    });

    it('white Prince castle options are all white', () => {
      const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'd8');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.WHITE);
      }
    });

    it('black Prince castle options are all black', () => {
      const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'd1');
      for (const opt of result!.options!) {
        expect(opt.color).toBe(PieceColor.BLACK);
      }
    });
  });

  describe('Knekht on every rank', () => {
    it('white Knekht on rank 1 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a1')).toBeNull();
    });
    it('white Knekht on rank 2 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a2')).toBeNull();
    });
    it('white Knekht on rank 3 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a3')).toBeNull();
    });
    it('white Knekht on rank 4 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a4')).toBeNull();
    });
    it('white Knekht on rank 5 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a5')).toBeNull();
    });
    it('white Knekht on rank 6 auto-promotes', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a6')).toEqual({ auto: true });
    });
    it('white Knekht on rank 7 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a7')).toBeNull();
    });
    it('white Knekht on rank 8 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a8')).toBeNull();
    });
    it('black Knekht on rank 1 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a1')).toBeNull();
    });
    it('black Knekht on rank 2 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a2')).toBeNull();
    });
    it('black Knekht on rank 3 auto-promotes', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a3')).toEqual({ auto: true });
    });
    it('black Knekht on rank 4 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a4')).toBeNull();
    });
    it('black Knekht on rank 5 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a5')).toBeNull();
    });
    it('black Knekht on rank 6 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a6')).toBeNull();
    });
    it('black Knekht on rank 7 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a7')).toBeNull();
    });
    it('black Knekht on rank 8 returns null', () => {
      expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a8')).toBeNull();
    });
  });

  describe('VK on non-promotion squares', () => {
    it('white VK on rank 1-7 non-edge/non-castle squares returns null', () => {
      for (const sq of ['a1', 'b1', 'g1', 'h1', 'a2', 'e4', 'h7', 'd5']) {
        expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, sq)).toBeNull();
      }
    });

    it('black VK on rank 2-8 non-edge/non-castle squares returns null', () => {
      for (const sq of ['a8', 'b8', 'g8', 'h8', 'a7', 'e5', 'h2', 'd4']) {
        expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, sq)).toBeNull();
      }
    });

    it('white VK on c1 (white castle, own side) returns null', () => {
      expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'c1')).toBeNull();
    });

    it('black VK on c8 (black castle, own side) returns null', () => {
      expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'c8')).toBeNull();
    });

    it('white VK on every rank 2-7 center file returns null', () => {
      for (let r = 2; r <= 7; r++) {
        expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, `d${r}`)).toBeNull();
      }
    });

    it('black VK on every rank 2-7 center file returns null', () => {
      for (let r = 2; r <= 7; r++) {
        expect(checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, `d${r}`)).toBeNull();
      }
    });
  });

  describe('Prince on non-castle squares returns null', () => {
    it('white Prince on edge rank 8 returns null', () => {
      for (const sq of ['a8', 'b8', 'g8', 'h8']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, sq)).toBeNull();
      }
    });

    it('black Prince on edge rank 1 returns null', () => {
      for (const sq of ['a1', 'b1', 'g1', 'h1']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, sq)).toBeNull();
      }
    });

    it('white Prince on mid-board returns null', () => {
      for (const sq of ['a4', 'e5', 'h3', 'd2']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, sq)).toBeNull();
      }
    });

    it('black Prince on mid-board returns null', () => {
      for (const sq of ['a5', 'e4', 'h6', 'd7']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, sq)).toBeNull();
      }
    });

    it('white Prince on own castle (c1-f1) returns null', () => {
      for (const sq of ['c1', 'd1', 'e1', 'f1']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, sq)).toBeNull();
      }
    });

    it('black Prince on own castle (c8-f8) returns null', () => {
      for (const sq of ['c8', 'd8', 'e8', 'f8']) {
        expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, sq)).toBeNull();
      }
    });
  });

  describe('Prince promotions on each castle square', () => {
    it('white Prince on c8 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'c8');
      expect(r?.options).toHaveLength(2);
    });
    it('white Prince on d8 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'd8');
      expect(r?.options).toHaveLength(2);
    });
    it('white Prince on e8 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'e8');
      expect(r?.options).toHaveLength(2);
    });
    it('white Prince on f8 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'f8');
      expect(r?.options).toHaveLength(2);
    });
    it('black Prince on c1 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'c1');
      expect(r?.options).toHaveLength(2);
    });
    it('black Prince on d1 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'd1');
      expect(r?.options).toHaveLength(2);
    });
    it('black Prince on e1 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'e1');
      expect(r?.options).toHaveLength(2);
    });
    it('black Prince on f1 promotes', () => {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'f1');
      expect(r?.options).toHaveLength(2);
    });
  });

  describe('exact option types for VK edge', () => {
    it('white VK edge has exactly KONNET, PRINCE, RITTER, SCOUT', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'g8');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.SCOUT].sort());
    });

    it('black VK edge has exactly KONNET, PRINCE, RITTER, SCOUT', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'h1');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.SCOUT].sort());
    });
  });

  describe('exact option types for castle promotions', () => {
    it('white VK castle has exactly KONNET and PRINCE', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'e8');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE].sort());
    });

    it('black VK castle has exactly KONNET and PRINCE', () => {
      const result = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.BLACK }, 'e1');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE].sort());
    });

    it('white Prince castle has exactly KONNET and PRINCE', () => {
      const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'c8');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE].sort());
    });

    it('black Prince castle has exactly KONNET and PRINCE', () => {
      const result = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, 'f1');
      const types = result!.options!.map(o => o.type).sort();
      expect(types).toEqual([PieceType.KONNET, PieceType.PRINCE].sort());
    });
  });

  describe('Knekht auto-promotion on every file', () => {
    it('white Knekht auto-promotes on every file at rank 6', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, `${f}6`)).toEqual({ auto: true });
      }
    });

    it('black Knekht auto-promotes on every file at rank 3', () => {
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, `${f}3`)).toEqual({ auto: true });
      }
    });
  });
});
