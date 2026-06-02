import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { validateMove, MSG_NO_MAJORITY, MSG_CASTLE_NON_ROYAL } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}

// Book-validated VERDICTS of validateMove. Book rules are ground truth: the
// expected allowed/reason/capture below are the book's, never tuned to output.
describe('book-validated verdicts', () => {
  it('V1 equality → forbidden: Knecht e5 takes Knecht e6 (1:1)', () => {
    const b = mk({ e5: [PieceType.KNEKHT, W], e6: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e5', 'e6');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_NO_MAJORITY);
    expect(r.capture).toBe('none');
  });

  it('V2 majority → allowed: Ver Knecht e5 takes Knecht e6 (1.5 > 1)', () => {
    const b = mk({ e5: [PieceType.VER_KNEKHT, W], e6: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e5', 'e6');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('V3 non-royal on castle → forbidden even with majority: Ritter b8 takes King c8 (3.5 > 1.5)', () => {
    const b = mk({ b8: [PieceType.RITTER, W], c7: [PieceType.PRINCE, W], c8: [PieceType.KING, B] });
    const r = validateMove(b, 'b8', 'c8');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
    expect(r.capture).toBe('none');
  });

  it('V4 royal on castle → allowed with majority: Prince c7 takes King c8 (3.5 > 1.5)', () => {
    const b = mk({ b8: [PieceType.RITTER, W], c7: [PieceType.PRINCE, W], c8: [PieceType.KING, B] });
    const r = validateMove(b, 'c7', 'c8');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('V5 Scout on a normal cell → unconditional capture despite defenders', () => {
    // Ritter c3 defended by Knecht c4 (≈3 defence); Scout ignores all of it.
    const b = mk({
      b1: [PieceType.SCOUT, W],
      c3: [PieceType.RITTER, B],
      c4: [PieceType.KNEKHT, B],
    });
    const r = validateMove(b, 'b1', 'c3');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('V6 Scout on a castle cell → exchange (both removed)', () => {
    const b = mk({ c3: [PieceType.SCOUT, W], d1: [PieceType.PRINCE, B] });
    const r = validateMove(b, 'c3', 'd1');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('scout-exchange');
  });

  it('V7 §6 royal alone in its own castle with an enemy royal: out forbidden, inside allowed', () => {
    const b = mk({ e1: [PieceType.KING, W], d1: [PieceType.PRINCE, B] });
    const out = validateMove(b, 'e1', 'e2');
    expect(out.allowed).toBe(false);
    expect(out.reason).toMatch(/замк/); // §6 castle restriction, not a §8 capture message
    expect(out.capture).toBe('none');

    const inside = validateMove(b, 'e1', 'f1');
    expect(inside.allowed).toBe(true);
    expect(inside.capture).toBe('none');
  });
});

// Fill remaining §4–9 validator branches not already covered by
// engine-validator.test.ts (Konnet via the validator, friendly-occupied target,
// per-piece geometry rejection, free analysis turn, plain 'none' for non-King).
describe('validator branch coverage (§4–9 gaps)', () => {
  it('Konnet orthogonal capture with majority → normal', () => {
    const b = mk({ e4: [PieceType.KONNET, W], e5: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('Konnet (royal) may capture on a castle cell with majority → normal', () => {
    const b = mk({ d7: [PieceType.KONNET, W], c8: [PieceType.KING, B] });
    const r = validateMove(b, 'd7', 'c8'); // diagonal onto black castle
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('geometry rejection: a Knecht cannot move diagonally (silent, no capture)', () => {
    const b = mk({ e4: [PieceType.KNEKHT, W], f5: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e4', 'f5');
    expect(r.allowed).toBe(false);
    expect(r.reason).not.toBe(MSG_NO_MAJORITY);
    expect(r.reason).not.toBe(MSG_CASTLE_NON_ROYAL);
  });

  it('geometry rejection: a Ritter cannot reach 3 cells away', () => {
    const b = mk({ a4: [PieceType.RITTER, W] });
    expect(validateMove(b, 'a4', 'd4').allowed).toBe(false);
  });

  it('cannot move onto a friendly piece', () => {
    const b = mk({ e4: [PieceType.KNEKHT, W], e5: [PieceType.RITTER, W] });
    expect(validateMove(b, 'e4', 'e5').allowed).toBe(false);
  });

  it("plain non-capturing move yields capture kind 'none' (Ritter)", () => {
    const b = mk({ e4: [PieceType.RITTER, W] });
    const r = validateMove(b, 'e4', 'e6'); // 2 cells up, empty
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('none');
  });

  it('§9 free analysis turn: with no turn passed, either colour may move', () => {
    const b = mk({ e4: [PieceType.KING, B] });
    expect(validateMove(b, 'e4', 'e5').allowed).toBe(true); // black moves, no turn gate
  });

  it('§9 party turn: moving the wrong colour is rejected', () => {
    const b = mk({ e4: [PieceType.KING, B] });
    expect(validateMove(b, 'e4', 'e5', { turn: W }).allowed).toBe(false);
    expect(validateMove(b, 'e4', 'e5', { turn: B }).allowed).toBe(true);
  });
});
