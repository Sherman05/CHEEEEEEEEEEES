import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import {
  countPieces,
  knechtPromotesTo,
  vkPromotion,
  princeCastlePromotion,
} from './promotion';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}
const snap = (b: BoardState) => boardToSerializable(b);

/** Build a board with `n` pieces of the given type/colour on arbitrary squares. */
function withN(type: PieceType, color: PieceColor, n: number): BoardState {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const b: BoardState = new Map();
  for (let i = 0; i < n; i++) b.set(`${files[i]}4`, { type, color });
  return b;
}

describe('countPieces', () => {
  it('counts only matching colour AND type', () => {
    const b = mk({
      a4: [PieceType.PRINCE, W],
      b4: [PieceType.PRINCE, W],
      c4: [PieceType.PRINCE, B],
      d4: [PieceType.KONNET, W],
    });
    expect(countPieces(b, W, PieceType.PRINCE)).toBe(2);
    expect(countPieces(b, B, PieceType.PRINCE)).toBe(1);
    expect(countPieces(b, W, PieceType.KONNET)).toBe(1);
    expect(countPieces(b, B, PieceType.KONNET)).toBe(0);
  });
});

describe('knechtPromotesTo', () => {
  it('white Knecht on rank 6 → VK', () => {
    expect(knechtPromotesTo('d6', W)).toBe('VK');
  });
  it('black Knecht on rank 3 → VK', () => {
    expect(knechtPromotesTo('d3', B)).toBe('VK');
  });
  it('not on the promotion rank → null', () => {
    expect(knechtPromotesTo('d5', W)).toBeNull();
    expect(knechtPromotesTo('d4', B)).toBeNull();
    expect(knechtPromotesTo('d3', W)).toBeNull(); // white promotes on 6, not 3
    expect(knechtPromotesTo('d6', B)).toBeNull(); // black promotes on 3, not 6
  });
});

describe("vkPromotion — 'four' (back-rank corners)", () => {
  it('a8 white, 0 Princes / 0 Konnets → no freezes', () => {
    const r = vkPromotion(new Map(), W, 'a8');
    expect(r).toEqual({ kind: 'four', princeFrozen: false, connetFrozen: false });
  });

  it('3 white Princes → princeFrozen', () => {
    const r = vkPromotion(withN(PieceType.PRINCE, W, 3), W, 'a8');
    expect(r).toMatchObject({ kind: 'four', princeFrozen: true, connetFrozen: false });
  });

  it('3 white Konnets → connetFrozen', () => {
    const r = vkPromotion(withN(PieceType.KONNET, W, 3), W, 'a8');
    expect(r).toMatchObject({ kind: 'four', princeFrozen: false, connetFrozen: true });
  });

  it('black corner a1 is recognised', () => {
    const r = vkPromotion(new Map(), B, 'a1');
    expect(r).toMatchObject({ kind: 'four' });
  });
});

describe("vkPromotion — 'castle' (enemy castle cell)", () => {
  it('d8 white, fewer than 3 of each → moveBlocked=false', () => {
    const r = vkPromotion(new Map(), W, 'd8');
    expect(r).toEqual({
      kind: 'castle',
      princeFrozen: false,
      connetFrozen: false,
      moveBlocked: false,
    });
  });

  it('d8 white, 3 Princes + 3 Konnets → moveBlocked=true', () => {
    const b: BoardState = new Map();
    const files = ['a', 'b', 'c'];
    for (const f of files) {
      b.set(`${f}4`, { type: PieceType.PRINCE, color: W });
      b.set(`${f}5`, { type: PieceType.KONNET, color: W });
    }
    const r = vkPromotion(b, W, 'd8');
    expect(r).toEqual({
      kind: 'castle',
      princeFrozen: true,
      connetFrozen: true,
      moveBlocked: true,
    });
  });

  it('black VK onto white castle d1 is a castle promotion', () => {
    const r = vkPromotion(new Map(), B, 'd1');
    expect(r).toMatchObject({ kind: 'castle' });
  });

  it('non-promotion square → null', () => {
    expect(vkPromotion(new Map(), W, 'e4')).toBeNull();
  });
});

describe('princeCastlePromotion', () => {
  it('done=false, 0 Konnets → promote=true, newDone=true', () => {
    const r = princeCastlePromotion(new Map(), W, { white: false, black: false });
    expect(r).toEqual({ promote: true, newDone: true });
  });

  it('done=true → promote=false (already used this game)', () => {
    const r = princeCastlePromotion(new Map(), W, { white: true, black: false });
    expect(r).toEqual({ promote: false, newDone: true });
  });

  it('done=false, 3 Konnets → promote=false, newDone=false (blocked, may retry later)', () => {
    const r = princeCastlePromotion(withN(PieceType.KONNET, W, 3), W, { white: false, black: false });
    expect(r).toEqual({ promote: false, newDone: false });
  });

  it('done=false, 2 Konnets → promote=true, newDone=true', () => {
    const r = princeCastlePromotion(withN(PieceType.KONNET, W, 2), W, { white: false, black: false });
    expect(r).toEqual({ promote: true, newDone: true });
  });

  it('uses the per-colour flag independently', () => {
    // White already done, black not — a black Prince still promotes.
    const r = princeCastlePromotion(new Map(), B, { white: true, black: false });
    expect(r).toEqual({ promote: true, newDone: true });
  });
});

describe('inputs are not mutated', () => {
  it('board and done-record are left unchanged', () => {
    const b = mk({
      a4: [PieceType.PRINCE, W],
      b4: [PieceType.KONNET, W],
      c8: [PieceType.VER_KNEKHT, W],
    });
    const before = snap(b);
    const done = { white: false, black: false };
    const doneCopy = { ...done };

    countPieces(b, W, PieceType.PRINCE);
    knechtPromotesTo('d6', W);
    vkPromotion(b, W, 'd8');
    princeCastlePromotion(b, W, done);

    expect(snap(b)).toEqual(before); // board untouched
    expect(done).toEqual(doneCopy); // done-record untouched
  });
});
