import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { resolveMove, validateMove, MSG_CASTLE_NON_ROYAL } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}
const snap = (b: BoardState) => boardToSerializable(b);

// §1/§4 — landing on a castle cell (c1 d1 e1 f1 / c8 d8 e8 f8) is royal-only,
// for BOTH simple moves and captures. Exceptions: a Ver Knecht promoting onto an
// EMPTY castle cell, and the Scout's §5 castle exchange.
describe('§1 castle landing — non-royal cannot land on a castle cell (simple OR capture)', () => {
  it('Ritter SIMPLE move onto an empty castle cell → rejected, board intact', () => {
    // Ritter on c3 steps one rank up to the empty castle cell c1 (white castle).
    const b = mk({ c3: [PieceType.RITTER, W] });
    const before = snap(b);
    const r = resolveMove(b, 'c3', 'c1', W);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
    expect(r.captureKind).toBe('none');
    expect(r.nextTurn).toBe(W); // unchanged
    expect(snap(r.nextBoard)).toEqual(before); // board unchanged
  });

  it('Knecht SIMPLE move onto an empty castle cell → rejected', () => {
    // White Knecht on e2 steps one cell back onto the empty castle cell e1.
    const b = mk({ e2: [PieceType.KNEKHT, W] });
    const r = resolveMove(b, 'e2', 'e1', W);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
  });

  it('Ver Knecht onto an EMPTY castle cell → allowed (promotion entry)', () => {
    // White Ver Knecht on e2 steps back to the empty white castle cell e1.
    const b = mk({ e2: [PieceType.VER_KNEKHT, W] });
    const r = resolveMove(b, 'e2', 'e1', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('none');
    expect(r.nextBoard.get('e1')).toEqual({ type: PieceType.VER_KNEKHT, color: W });
  });

  it('Ver Knecht onto an OCCUPIED castle cell → rejected', () => {
    // Enemy piece sitting on the castle cell e1 — VK may not capture onto a castle.
    const b = mk({ e2: [PieceType.VER_KNEKHT, W], e1: [PieceType.RITTER, B] });
    const r = resolveMove(b, 'e2', 'e1', W);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
  });

  it('royal (Prince) onto a castle cell → allowed', () => {
    // White Prince on d2 steps orthogonally onto the empty castle cell d1.
    const b = mk({ d2: [PieceType.PRINCE, W] });
    const r = resolveMove(b, 'd2', 'd1', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('none');
    expect(r.nextBoard.get('d1')).toEqual({ type: PieceType.PRINCE, color: W });
  });

  it('royal (King) onto an adjacent castle cell → allowed', () => {
    const b = mk({ d2: [PieceType.KING, W] });
    expect(validateMove(b, 'd2', 'd1').allowed).toBe(true);
  });

  it('Scout §5 castle exchange (capture) is preserved', () => {
    // Scout capturing an enemy on a castle cell remains a legal exchange (§5).
    const b = mk({ c3: [PieceType.SCOUT, W], d1: [PieceType.PRINCE, B] });
    const r = resolveMove(b, 'c3', 'd1', W);
    expect(r.allowed).toBe(true);
    expect(r.captureKind).toBe('scout-exchange');
  });
});
