import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { resolveMove, MSG_NO_MAJORITY, MSG_CASTLE_NON_ROYAL } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}
const snap = (b: BoardState) => boardToSerializable(b);

describe('resolveMove — move flow', () => {
  it('equality 1:1 → rejected, board and turn unchanged', () => {
    const b = mk({ e5: [PieceType.KNEKHT, W], e6: [PieceType.KNEKHT, B] });
    const before = snap(b);
    const r = resolveMove(b, 'e5', 'e6', W);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_NO_MAJORITY);
    expect(r.captureKind).toBe('none');
    expect(r.nextTurn).toBe(W); // unchanged
    expect(snap(r.nextBoard)).toEqual(before); // board unchanged
    expect(snap(b)).toEqual(before); // input not mutated
  });

  it('majority → allowed: target removed, attacker on target, party turn flips', () => {
    const b = mk({ e5: [PieceType.VER_KNEKHT, W], e6: [PieceType.KNEKHT, B] });
    const r = resolveMove(b, 'e5', 'e6', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('normal');
    expect(r.nextBoard.has('e5')).toBe(false); // attacker left its square
    expect(r.nextBoard.get('e6')).toEqual({ type: PieceType.VER_KNEKHT, color: W }); // captured replaced
    expect(r.nextTurn).toBe(B); // party flip
  });

  it('scout-exchange on a castle cell → both removed', () => {
    const b = mk({ c3: [PieceType.SCOUT, W], d1: [PieceType.PRINCE, B] });
    const r = resolveMove(b, 'c3', 'd1', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('scout-exchange');
    expect(r.nextBoard.has('c3')).toBe(false);
    expect(r.nextBoard.has('d1')).toBe(false);
    expect(r.nextTurn).toBe(B);
  });

  it('scout on a normal cell → target removed, scout lands on it', () => {
    const b = mk({ b1: [PieceType.SCOUT, W], c3: [PieceType.RITTER, B] });
    const r = resolveMove(b, 'b1', 'c3', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('normal');
    expect(r.nextBoard.has('b1')).toBe(false);
    expect(r.nextBoard.get('c3')).toEqual({ type: PieceType.SCOUT, color: W });
  });

  it('non-royal on a castle cell → rejected, board intact, castle reason', () => {
    const b = mk({ b8: [PieceType.RITTER, W], c7: [PieceType.PRINCE, W], c8: [PieceType.KING, B] });
    const before = snap(b);
    const r = resolveMove(b, 'b8', 'c8', W);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
    expect(snap(r.nextBoard)).toEqual(before);
  });

  describe('turn order', () => {
    it('party: moving the wrong colour is rejected', () => {
      const b = mk({ e4: [PieceType.KING, W] });
      const r = resolveMove(b, 'e4', 'e5', B);
      expect(r.allowed).toBe(false);
      expect(r.nextTurn).toBe(B); // unchanged
    });

    it('party: moving your own colour is allowed and flips the turn', () => {
      const b = mk({ e4: [PieceType.KING, W] });
      const r = resolveMove(b, 'e4', 'e5', W);
      expect(r.allowed).toBe(true);
      expect(r.captureKind).toBe('none');
      expect(r.nextTurn).toBe(B);
    });

    it('analysis (no turn): either colour may move', () => {
      expect(resolveMove(mk({ e4: [PieceType.KING, W] }), 'e4', 'e5').allowed).toBe(true);
      expect(resolveMove(mk({ e4: [PieceType.KING, B] }), 'e4', 'e5').allowed).toBe(true);
    });
  });
});

// Stage 2, module 1 — promotions integrated into resolveMove (pure logic).
describe('resolveMove — promotions', () => {
  it('Knecht onto its promo rank → nextBoard holds a Ver Knecht (knecht-vk, auto)', () => {
    const b = mk({ d5: [PieceType.KNEKHT, W] });
    const r = resolveMove(b, 'd5', 'd6', W);
    expect(r.allowed).toBe(true);
    expect(r.nextBoard.get('d6')).toEqual({ type: PieceType.VER_KNEKHT, color: W });
    expect(r.promotion).toEqual({ kind: 'knecht-vk' });
  });

  it('Prince onto the enemy castle, done=false & Konnets<3 → Konnet (prince-connet, auto)', () => {
    const b = mk({ c7: [PieceType.PRINCE, W] });
    const before = snap(b);
    const r = resolveMove(b, 'c7', 'c8', W, { white: false, black: false });
    expect(r.allowed).toBe(true);
    expect(r.nextBoard.get('c8')).toEqual({ type: PieceType.KONNET, color: W });
    expect(r.promotion).toEqual({ kind: 'prince-connet' });
    expect(r.nextPromotionState).toEqual({ white: true, black: false });
    expect(snap(b)).toEqual(before); // input not mutated
  });

  it('Prince onto the enemy castle, done=true → stays a Prince, no promotion, state unchanged', () => {
    const b = mk({ c7: [PieceType.PRINCE, W] });
    const r = resolveMove(b, 'c7', 'c8', W, { white: true, black: false });
    expect(r.allowed).toBe(true);
    expect(r.nextBoard.get('c8')).toEqual({ type: PieceType.PRINCE, color: W });
    expect(r.promotion).toBeUndefined();
    expect(r.nextPromotionState).toEqual({ white: true, black: false });
  });

  it('Prince onto the enemy castle, done=false & Konnets=3 → stays a Prince, done stays false', () => {
    const b = mk({
      c7: [PieceType.PRINCE, W],
      a4: [PieceType.KONNET, W],
      b4: [PieceType.KONNET, W],
      c4: [PieceType.KONNET, W],
    });
    const r = resolveMove(b, 'c7', 'c8', W, { white: false, black: false });
    expect(r.allowed).toBe(true);
    expect(r.nextBoard.get('c8')).toEqual({ type: PieceType.PRINCE, color: W });
    expect(r.promotion).toBeUndefined();
    expect(r.nextPromotionState).toEqual({ white: false, black: false });
  });

  it("Ver Knecht onto a back-rank corner (a8) → vk-dialog set='four' with freeze flags", () => {
    const r1 = resolveMove(mk({ a7: [PieceType.VER_KNEKHT, W] }), 'a7', 'a8', W);
    expect(r1.allowed).toBe(true);
    expect(r1.nextBoard.get('a8')).toEqual({ type: PieceType.VER_KNEKHT, color: W }); // not applied
    expect(r1.promotion).toEqual({
      kind: 'vk-dialog', set: 'four', princeFrozen: false, connetFrozen: false,
    });

    // Three white Princes freeze the Prince option.
    const r2 = resolveMove(
      mk({ a7: [PieceType.VER_KNEKHT, W], c4: [PieceType.PRINCE, W], d4: [PieceType.PRINCE, W], e4: [PieceType.PRINCE, W] }),
      'a7', 'a8', W,
    );
    expect(r2.promotion).toEqual({
      kind: 'vk-dialog', set: 'four', princeFrozen: true, connetFrozen: false,
    });
  });

  it("Ver Knecht onto an empty enemy castle (d8): allowed with vk-dialog set='castle' when <3 each", () => {
    const r = resolveMove(mk({ d7: [PieceType.VER_KNEKHT, W] }), 'd7', 'd8', W);
    expect(r.allowed).toBe(true);
    expect(r.promotion).toEqual({
      kind: 'vk-dialog', set: 'castle', princeFrozen: false, connetFrozen: false,
    });
  });

  it('Ver Knecht onto the enemy castle is ILLEGAL when 3 Princes AND 3 Konnets (vk-castle-blocked)', () => {
    const b = mk({
      d7: [PieceType.VER_KNEKHT, W],
      a4: [PieceType.PRINCE, W], b4: [PieceType.PRINCE, W], c4: [PieceType.PRINCE, W],
      a5: [PieceType.KONNET, W], b5: [PieceType.KONNET, W], c5: [PieceType.KONNET, W],
    });
    const before = snap(b);
    const r = resolveMove(b, 'd7', 'd8', W, { white: false, black: false });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('vk-castle-blocked');
    expect(snap(r.nextBoard)).toEqual(before); // board intact
    expect(r.nextPromotionState).toEqual({ white: false, black: false });
  });

  it('regression: an ordinary move has no promotion, state = input, board untouched', () => {
    const b = mk({ e4: [PieceType.KING, W] });
    const before = snap(b);
    const state = { white: false, black: false };
    const r = resolveMove(b, 'e4', 'e5', W, state);
    expect(r.allowed).toBe(true);
    expect(r.promotion).toBeUndefined();
    expect(r.nextPromotionState).toEqual(state);
    expect(snap(b)).toEqual(before); // input board not mutated
  });
});
