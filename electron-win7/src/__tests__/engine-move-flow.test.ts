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
