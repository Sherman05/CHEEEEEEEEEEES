import { describe, it, expect } from 'vitest';
import { PieceColor, PieceType } from '../logic/pieces';
import type { BoardState, Square } from '../logic/pieces';
import { legalTargets } from '../engine';

const W = PieceColor.WHITE;
const B = PieceColor.BLACK;

function mk(entries: Record<Square, [PieceType, PieceColor]>): BoardState {
  const b: BoardState = new Map();
  for (const [sq, [t, c]] of Object.entries(entries)) b.set(sq, { type: t, color: c });
  return b;
}
const dests = (board: BoardState, from: Square): Set<string> =>
  new Set(legalTargets(board, from).map((t) => t.sq));

// Geometry validated against the book «Основы» (pp. 27–34), piece on e5, empty
// board. Book sets are ground truth — expected values are the book's, verbatim.
describe('§2 movement geometry — book («Основы», e5)', () => {
  it('Konnet: 1–2 orthogonal + 1–3 diagonal = 20 cells', () => {
    const b = mk({ e5: [PieceType.KONNET, W] });
    expect(dests(b, 'e5')).toEqual(
      new Set([
        // orthogonal 1–2
        'c5', 'd5', 'f5', 'g5', 'e3', 'e4', 'e6', 'e7',
        // diagonals 1–3
        'f6', 'g7', 'h8',
        'd6', 'c7', 'b8',
        'f4', 'g3', 'h2',
        'd4', 'c3', 'b2',
      ]),
    );
  });

  it('Konnet: forbids 4-straight / 3+-straight (e8, e2, e1, a5, h5)', () => {
    const d = dests(mk({ e5: [PieceType.KONNET, W] }), 'e5');
    for (const sq of ['e8', 'e2', 'e1', 'a5', 'h5']) expect(d.has(sq)).toBe(false);
  });

  it('Ritter: only 1–2 orthogonal = 8 cells, no diagonals', () => {
    const b = mk({ e5: [PieceType.RITTER, W] });
    expect(dests(b, 'e5')).toEqual(
      new Set(['c5', 'd5', 'f5', 'g5', 'e3', 'e4', 'e6', 'e7']),
    );
  });

  it('Ritter: forbids diagonals and 3-straight (e2, e8)', () => {
    const d = dests(mk({ e5: [PieceType.RITTER, W] }), 'e5');
    for (const sq of ['f6', 'd6', 'f4', 'd4', 'e2', 'e8']) expect(d.has(sq)).toBe(false);
  });

  it('Prince: 1 orthogonal + 1–3 diagonal = 16 cells', () => {
    const b = mk({ e5: [PieceType.PRINCE, W] });
    expect(dests(b, 'e5')).toEqual(
      new Set([
        // orthogonal 1 only
        'd5', 'f5', 'e4', 'e6',
        // diagonals 1–3
        'f6', 'g7', 'h8',
        'd6', 'c7', 'b8',
        'f4', 'g3', 'h2',
        'd4', 'c3', 'b2',
      ]),
    );
  });

  it('Prince: forbids 2-straight (c5, g5, e3, e7)', () => {
    const d = dests(mk({ e5: [PieceType.PRINCE, W] }), 'e5');
    for (const sq of ['c5', 'g5', 'e3', 'e7']) expect(d.has(sq)).toBe(false);
  });
});

describe('§2 jump vs no-jump — book', () => {
  it('Konnet jumps an enemy on e6 → e7 reachable (and e6 capturable)', () => {
    const d = dests(mk({ e5: [PieceType.KONNET, W], e6: [PieceType.KNEKHT, B] }), 'e5');
    expect(d.has('e7')).toBe(true); // jumped over e6
    expect(d.has('e6')).toBe(true); // near enemy is a capture
  });

  it('Ritter jumps an enemy on e6 → e7 reachable', () => {
    const d = dests(mk({ e5: [PieceType.RITTER, W], e6: [PieceType.KNEKHT, B] }), 'e5');
    expect(d.has('e7')).toBe(true);
    expect(d.has('e6')).toBe(true);
  });

  it('Prince does NOT jump diagonally: a piece on f6 blocks g7/h8', () => {
    const d = dests(mk({ e5: [PieceType.PRINCE, W], f6: [PieceType.KNEKHT, B] }), 'e5');
    expect(d.has('f6')).toBe(true); // diagonal stop is inclusive (capture)
    expect(d.has('g7')).toBe(false); // cannot pass the blocker
    expect(d.has('h8')).toBe(false);
  });

  it('Konnet does NOT jump diagonally: a piece on f6 blocks g7/h8', () => {
    const d = dests(mk({ e5: [PieceType.KONNET, W], f6: [PieceType.KNEKHT, B] }), 'e5');
    expect(d.has('f6')).toBe(true);
    expect(d.has('g7')).toBe(false);
    expect(d.has('h8')).toBe(false);
  });
});
