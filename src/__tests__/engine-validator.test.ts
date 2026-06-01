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

describe('§4 capture — strict force majority', () => {
  it('Knecht vs Knecht (1:1) → forbidden (equality)', () => {
    const b = mk({ e4: [PieceType.KNEKHT, W], e5: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_NO_MAJORITY);
  });

  it('Ver Knecht (1½) beats Knecht (1) → allowed', () => {
    const b = mk({ e4: [PieceType.VER_KNEKHT, W], e5: [PieceType.KNEKHT, B] });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('summed forces 3½ : 2½ → allowed (book example)', () => {
    // White: Ver Knecht e4 (mover, 1½) + Ritter e3 (2, jumps over e4) = 3½ on e5.
    // Black: Knecht e5 (self 1) + Ver Knecht e6 (1½) = 2½ on e5.
    const b = mk({
      e4: [PieceType.VER_KNEKHT, W],
      e3: [PieceType.RITTER, W],
      e5: [PieceType.KNEKHT, B],
      e6: [PieceType.VER_KNEKHT, B],
    });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('reversed sums (2½ : 3½) → forbidden', () => {
    // Mirror of the above: the lone white Ver Knecht (1½) attacks a defended Knecht.
    const b = mk({
      e4: [PieceType.VER_KNEKHT, W],
      e5: [PieceType.KNEKHT, B],
      e6: [PieceType.VER_KNEKHT, B],
      e7: [PieceType.RITTER, B],
    });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_NO_MAJORITY);
  });
});

describe('§4 castles — capture on a castle cell is royal-only', () => {
  it('lone Ritter attacking the King on e8 → forbidden (non-royal on castle)', () => {
    const b = mk({ e8: [PieceType.KING, B], e6: [PieceType.RITTER, W] });
    const r = validateMove(b, 'e6', 'e8');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
  });

  it('Ritter + Prince escort on e8 → W = 2 + 1½ = 3½ > 1½, Prince captures → allowed', () => {
    const b = mk({
      e8: [PieceType.KING, B],
      e6: [PieceType.RITTER, W], // supports e8 (2, jumps through e7)
      d7: [PieceType.PRINCE, W], // royal capturer (1½, diagonal onto e8)
    });
    const r = validateMove(b, 'd7', 'e8');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('non-royal with a clear majority still cannot capture on a castle', () => {
    // White 3 (Knecht e7 + Ritter e6) vs Black 1 (Knecht e8) — but the mover is a Knecht.
    const b = mk({
      e8: [PieceType.KNEKHT, B],
      e7: [PieceType.KNEKHT, W],
      e6: [PieceType.RITTER, W],
    });
    const r = validateMove(b, 'e7', 'e8');
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe(MSG_CASTLE_NON_ROYAL);
  });
});

describe('§6 royal alone in its own castle, enemy royal present', () => {
  it('move OUT of the castle is forbidden, move WITHIN it is allowed', () => {
    // White King e1 is the only white royal in c1–f1; black Prince sits on d1.
    const b = mk({ e1: [PieceType.KING, W], d1: [PieceType.PRINCE, B] });
    expect(validateMove(b, 'e1', 'e2').allowed).toBe(false); // outside
    expect(validateMove(b, 'e1', 'f1').allowed).toBe(true); // inside the castle
    expect(validateMove(b, 'e1', 'f1').capture).toBe('none');
  });

  it('restriction lifts when no enemy royal shares the castle', () => {
    const b = mk({ e1: [PieceType.KING, W] });
    expect(validateMove(b, 'e1', 'e2').allowed).toBe(true);
  });

  it('restriction lifts when a second friendly royal shares the castle', () => {
    const b = mk({
      e1: [PieceType.KING, W],
      f1: [PieceType.PRINCE, W],
      d1: [PieceType.PRINCE, B],
    });
    expect(validateMove(b, 'e1', 'e2').allowed).toBe(true);
  });
});

describe('§5 Scout specials', () => {
  it('captures any piece on a normal cell regardless of force', () => {
    const b = mk({ d4: [PieceType.SCOUT, W], f5: [PieceType.KING, B] });
    const r = validateMove(b, 'd4', 'f5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('a Scout with zero defence is taken by a single Knecht (1:0)', () => {
    const b = mk({ e5: [PieceType.SCOUT, B], e4: [PieceType.KNEKHT, W] });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('normal');
  });

  it('a Scout capturing on a castle cell is an exchange (both removed)', () => {
    const b = mk({ d6: [PieceType.SCOUT, W], e8: [PieceType.KING, B] });
    const r = validateMove(b, 'd6', 'e8');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('scout-exchange');
  });
});

describe('basic validator guards', () => {
  it('rejects an empty origin square', () => {
    expect(validateMove(mk({}), 'e4', 'e5').allowed).toBe(false);
  });

  it('rejects a geometrically impossible move', () => {
    const b = mk({ e4: [PieceType.KING, W] });
    expect(validateMove(b, 'e4', 'e6').allowed).toBe(false); // King reaches only 1 cell
  });

  it('allows a plain non-capturing move', () => {
    const b = mk({ e4: [PieceType.KING, W] });
    const r = validateMove(b, 'e4', 'e5');
    expect(r.allowed).toBe(true);
    expect(r.capture).toBe('none');
  });

  it('honours the optional turn check (§9)', () => {
    const b = mk({ e4: [PieceType.KING, W] });
    expect(validateMove(b, 'e4', 'e5', { turn: B }).allowed).toBe(false);
    expect(validateMove(b, 'e4', 'e5', { turn: W }).allowed).toBe(true);
  });
});
