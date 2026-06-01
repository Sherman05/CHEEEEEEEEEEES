import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { computeForceField, forceAt, STRENGTH } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}
const wAt = (board: BoardState, sq: Square): number =>
  forceAt(computeForceField(board), sq).white;
const bAt = (board: BoardState, sq: Square): number =>
  forceAt(computeForceField(board), sq).black;

describe('§11 strength values', () => {
  it('strength table matches the spec (Knecht units)', () => {
    expect(STRENGTH[PieceType.KNEKHT]).toBe(1);
    expect(STRENGTH[PieceType.VER_KNEKHT]).toBe(1.5);
    expect(STRENGTH[PieceType.RITTER]).toBe(2);
    expect(STRENGTH[PieceType.PRINCE]).toBe(1.5);
    expect(STRENGTH[PieceType.KONNET]).toBe(3);
    expect(STRENGTH[PieceType.KING]).toBe(1.5);
    expect(STRENGTH[PieceType.SCOUT]).toBe(0);
  });

  it('a lone piece defends its own cell with exactly its strength', () => {
    expect(wAt(mk({ e4: [PieceType.KING, W] }), 'e4')).toBe(1.5);
    expect(wAt(mk({ e4: [PieceType.KONNET, W] }), 'e4')).toBe(3);
    expect(wAt(mk({ e4: [PieceType.PRINCE, W] }), 'e4')).toBe(1.5);
    expect(wAt(mk({ e4: [PieceType.RITTER, W] }), 'e4')).toBe(2);
    expect(wAt(mk({ e4: [PieceType.VER_KNEKHT, W] }), 'e4')).toBe(1.5);
    expect(wAt(mk({ e4: [PieceType.KNEKHT, W] }), 'e4')).toBe(1);
  });

  it('a Scout is excluded from the force field — it does not even defend itself', () => {
    const b = mk({ e4: [PieceType.SCOUT, W] });
    expect(wAt(b, 'e4')).toBe(0);
    expect(bAt(b, 'e4')).toBe(0);
  });
});

describe('§3 projection — diagonal stops at first occupied (inclusive)', () => {
  it('Prince projects up to and including a piece on its diagonal, not beyond', () => {
    // Prince e4, friendly Knecht two cells up-right on g6.
    const b = mk({ e4: [PieceType.PRINCE, W], g6: [PieceType.KNEKHT, W] });
    expect(wAt(b, 'f5')).toBe(1.5); // Prince reaches f5 (diag dist 1)
    expect(wAt(b, 'g6')).toBe(2.5); // Prince 1.5 defends the Knecht + Knecht self 1
    expect(wAt(b, 'h7')).toBe(0); // blocked at g6 — nothing projects past it
  });
});

describe('§3 projection — jumpers pass through obstacles', () => {
  it('Ritter projects through an occupied cell onto the far cell', () => {
    // Ritter e4, enemy obstacle on e5 (kept enemy so it adds nothing to white).
    const b = mk({ e4: [PieceType.RITTER, W], e5: [PieceType.KNEKHT, B] });
    expect(wAt(b, 'e5')).toBe(2); // attacks the obstacle (inclusive, dist 1)
    expect(wAt(b, 'e6')).toBe(2); // passes through onto the far cell
  });

  it('Konnet projects through an obstacle orthogonally', () => {
    const b = mk({ e4: [PieceType.KONNET, W], e5: [PieceType.KNEKHT, B] });
    expect(wAt(b, 'e6')).toBe(3); // Konnet orthogonal jump
  });
});

describe('§3.4 superposition — colours summed separately', () => {
  it('two white projectors add up; black is tracked independently', () => {
    // Two white Knechts flank e4 (d4→e4 and f4→e4); a black Knecht on e5 also
    // projects forward onto e4.
    const b = mk({
      d4: [PieceType.KNEKHT, W],
      f4: [PieceType.KNEKHT, W],
      e5: [PieceType.KNEKHT, B],
    });
    const field = computeForceField(b);
    expect(forceAt(field, 'e4').white).toBe(2); // 1 + 1
    expect(forceAt(field, 'e4').black).toBe(1); // black Knecht forward
  });
});
