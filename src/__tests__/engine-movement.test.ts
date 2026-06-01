import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { legalTargets, canPlace } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

/** Build a board from a compact map of square → [type, color]. */
function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}

const dests = (board: BoardState, from: Square): Set<string> =>
  new Set(legalTargets(board, from).map((t) => t.sq));
const captures = (board: BoardState, from: Square): Set<string> =>
  new Set(legalTargets(board, from).filter((t) => t.capture).map((t) => t.sq));

describe('§2 movability — Knecht / Ver Knecht', () => {
  it('white Knecht: 4 orthogonal single steps (no diagonals)', () => {
    const b = mk({ e4: [PieceType.KNEKHT, W] });
    // on rank 4 the double-step would leave the own half → forward only 1
    expect(dests(b, 'e4')).toEqual(new Set(['d4', 'f4', 'e3', 'e5']));
  });

  it('white Knecht double-steps forward only inside its own half', () => {
    const b = mk({ e2: [PieceType.KNEKHT, W] });
    expect(dests(b, 'e2')).toEqual(new Set(['d2', 'f2', 'e1', 'e3', 'e4']));
  });

  it('black Knecht double-steps downward inside its own half', () => {
    const b = mk({ e7: [PieceType.KNEKHT, B] });
    expect(dests(b, 'e7')).toEqual(new Set(['d7', 'f7', 'e8', 'e6', 'e5']));
  });

  it('Knecht does not jump: a piece on the intermediate cell blocks the double-step', () => {
    const b = mk({ e2: [PieceType.KNEKHT, W], e3: [PieceType.RITTER, W] });
    // forward blocked by own Ritter on e3; sideways/back still available
    expect(dests(b, 'e2')).toEqual(new Set(['d2', 'f2', 'e1']));
  });

  it('Knecht captures an adjacent enemy and stops there', () => {
    const b = mk({ e2: [PieceType.KNEKHT, W], e3: [PieceType.KNEKHT, B] });
    expect(captures(b, 'e2')).toEqual(new Set(['e3']));
    expect(dests(b, 'e2').has('e4')).toBe(false); // cannot reach past the captured piece
  });

  it('Ver Knecht moves identically to a Knecht', () => {
    const knecht = mk({ e2: [PieceType.KNEKHT, W] });
    const ver = mk({ e2: [PieceType.VER_KNEKHT, W] });
    expect(dests(ver, 'e2')).toEqual(dests(knecht, 'e2'));
  });
});

describe('§2 movability — Ritter (orthogonal, jumps)', () => {
  it('reaches 1–2 cells in each orthogonal direction', () => {
    const b = mk({ e4: [PieceType.RITTER, W] });
    expect(dests(b, 'e4')).toEqual(
      new Set(['d4', 'c4', 'f4', 'g4', 'e3', 'e2', 'e5', 'e6']),
    );
  });

  it('leaps over an adjacent friendly piece to the far cell', () => {
    const b = mk({ e4: [PieceType.RITTER, W], e5: [PieceType.KNEKHT, W] });
    const d = dests(b, 'e4');
    expect(d.has('e6')).toBe(true); // jumped over own Knecht on e5
    expect(d.has('e5')).toBe(false); // cannot land on a friendly piece
  });

  it('leaps over an enemy on the near cell and can still capture it OR land beyond', () => {
    const b = mk({ e4: [PieceType.RITTER, W], e5: [PieceType.KNEKHT, B] });
    const d = dests(b, 'e4');
    expect(d.has('e5')).toBe(true); // capture the near enemy
    expect(d.has('e6')).toBe(true); // or jump past it
    expect(captures(b, 'e4').has('e5')).toBe(true);
  });
});

describe('§2 movability — Prince (orth 1 + diagonal up to 3, no jump)', () => {
  it('1 orthogonal + up to 3 diagonal on an open board', () => {
    const b = mk({ e4: [PieceType.PRINCE, W] });
    expect(dests(b, 'e4')).toEqual(
      new Set([
        'd4', 'f4', 'e3', 'e5', // orthogonal step
        'f5', 'g6', 'h7', // up-right
        'd5', 'c6', 'b7', // up-left
        'f3', 'g2', 'h1', // down-right
        'd3', 'c2', 'b1', // down-left
      ]),
    );
  });

  it('diagonal projection stops at a blocking piece (inclusive for enemy capture)', () => {
    const friendly = mk({ e4: [PieceType.PRINCE, W], g6: [PieceType.KNEKHT, W] });
    const df = dests(friendly, 'e4');
    expect(df.has('f5')).toBe(true);
    expect(df.has('g6')).toBe(false); // own piece blocks, not a target
    expect(df.has('h7')).toBe(false); // cannot pass through

    const enemy = mk({ e4: [PieceType.PRINCE, W], g6: [PieceType.KNEKHT, B] });
    expect(captures(enemy, 'e4').has('g6')).toBe(true);
    expect(dests(enemy, 'e4').has('h7')).toBe(false);
  });

  it('does not reach 2 cells orthogonally', () => {
    const b = mk({ e4: [PieceType.PRINCE, W] });
    expect(dests(b, 'e4').has('c4')).toBe(false);
  });
});

describe('§2 movability — Konnet (Ritter orth + Prince diag)', () => {
  it('orthogonal jump like a Ritter, diagonal blocked like a Prince', () => {
    const b = mk({
      e4: [PieceType.KONNET, W],
      e5: [PieceType.KNEKHT, W], // orthogonal obstacle (jumped)
      g6: [PieceType.KNEKHT, W], // diagonal obstacle (blocks)
    });
    const d = dests(b, 'e4');
    expect(d.has('e6')).toBe(true); // jumped over e5 orthogonally
    expect(d.has('e5')).toBe(false); // friendly, cannot land
    expect(d.has('f5')).toBe(true); // diagonal step before the block
    expect(d.has('g6')).toBe(false); // diagonal block
    expect(d.has('h7')).toBe(false); // cannot pass the diagonal block
  });
});

describe('§2 movability — King', () => {
  it('one cell in all 8 directions', () => {
    const b = mk({ e4: [PieceType.KING, W] });
    expect(dests(b, 'e4')).toEqual(
      new Set(['d3', 'd4', 'd5', 'e3', 'e5', 'f3', 'f4', 'f5']),
    );
  });
});

describe('§2 movability — Scout (knight move, jumps)', () => {
  it('reaches the 8 knight cells on an open board', () => {
    const b = mk({ e4: [PieceType.SCOUT, W] });
    expect(dests(b, 'e4')).toEqual(
      new Set(['f6', 'g5', 'g3', 'f2', 'd2', 'c3', 'c5', 'd6']),
    );
  });

  it('jumps over surrounding pieces and still reaches knight cells', () => {
    const b = mk({
      e4: [PieceType.SCOUT, W],
      e5: [PieceType.KNEKHT, W], d4: [PieceType.KNEKHT, W],
      f4: [PieceType.KNEKHT, B], e3: [PieceType.KNEKHT, B],
      d5: [PieceType.KNEKHT, W], f5: [PieceType.KNEKHT, B],
      d3: [PieceType.KNEKHT, W], f3: [PieceType.KNEKHT, B],
    });
    expect(dests(b, 'e4')).toEqual(
      new Set(['f6', 'g5', 'g3', 'f2', 'd2', 'c3', 'c5', 'd6']),
    );
  });

  it('captures an enemy on a knight cell but not a friendly one', () => {
    const b = mk({
      e4: [PieceType.SCOUT, W],
      f6: [PieceType.KING, B], // enemy on a knight cell
      g5: [PieceType.KNEKHT, W], // friendly on a knight cell
    });
    expect(captures(b, 'e4').has('f6')).toBe(true);
    expect(dests(b, 'e4').has('g5')).toBe(false);
  });
});

describe('§7 placement rules', () => {
  it('white Knecht forbidden on promotion ranks 6–8, allowed below', () => {
    expect(canPlace(PieceType.KNEKHT, W, 'a6').allowed).toBe(false);
    expect(canPlace(PieceType.KNEKHT, W, 'h7').allowed).toBe(false);
    expect(canPlace(PieceType.KNEKHT, W, 'd8').allowed).toBe(false);
    expect(canPlace(PieceType.KNEKHT, W, 'a5').allowed).toBe(true);
  });

  it('black Knecht forbidden on promotion ranks 1–3, allowed above', () => {
    expect(canPlace(PieceType.KNEKHT, B, 'a1').allowed).toBe(false);
    expect(canPlace(PieceType.KNEKHT, B, 'h3').allowed).toBe(false);
    expect(canPlace(PieceType.KNEKHT, B, 'a4').allowed).toBe(true);
  });

  it('non-royal pieces forbidden on castle cells', () => {
    expect(canPlace(PieceType.RITTER, W, 'd1').allowed).toBe(false);
    expect(canPlace(PieceType.SCOUT, B, 'e8').allowed).toBe(false);
    expect(canPlace(PieceType.VER_KNEKHT, W, 'c1').allowed).toBe(false);
  });

  it('royal pieces allowed on castle cells', () => {
    expect(canPlace(PieceType.KING, W, 'e1').allowed).toBe(true);
    expect(canPlace(PieceType.PRINCE, W, 'c1').allowed).toBe(true);
    expect(canPlace(PieceType.KONNET, B, 'd8').allowed).toBe(true);
  });
});
