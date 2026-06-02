/**
 * Tests for the bugfix/ui-p0-p2 task pack — electron-win7 mirror.
 *
 * Full RTL-based tests for TASK-01 and TASK-02 live in the root src/__tests__
 * copy; they require Board rendering, which is currently flaky in the
 * electron-win7 vitest setup due to nested node_modules pulling a second copy
 * of React. We keep store-level coverage here so the rules verified by the
 * patch are still exercised against electron-win7's gameStore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../stores/gameStore';
import { PieceType, PieceColor } from '../logic/pieces';

beforeEach(() => {
  useGameStore.getState().setInitialPosition();
});

// ════════════════════════════════════════════════════════════════════════
// TASK-03 — VerKnecht cannot be placed on the last rank
// ════════════════════════════════════════════════════════════════════════
describe('TASK-03: VerKnecht cannot be placed on the last rank in setup', () => {
  it('setupMode_cannotPlaceWhiteVerKnechtOnRank8', () => {
    useGameStore.getState().startAnalysis();
    const before = new Map(useGameStore.getState().board);

    useGameStore.getState().placePiece('a8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('h8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('d8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });

    const after = useGameStore.getState().board;
    expect(after.has('a8')).toBe(false);
    expect(after.has('h8')).toBe(false);
    expect(after.has('d8')).toBe(false);
    expect(after.size).toBe(before.size);
  });

  it('setupMode_cannotPlaceBlackVerKnechtOnRank1', () => {
    useGameStore.getState().startAnalysis();
    const before = new Map(useGameStore.getState().board);

    useGameStore.getState().placePiece('a1', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('h1', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('d1', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });

    const after = useGameStore.getState().board;
    expect(after.has('a1')).toBe(false);
    expect(after.has('h1')).toBe(false);
    expect(after.has('d1')).toBe(false);
    expect(after.size).toBe(before.size);
  });

  it('white VK on intermediate ranks is allowed', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('a7', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('a2', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.get('a7')).toEqual({
      type: PieceType.VER_KNEKHT, color: PieceColor.WHITE,
    });
    expect(useGameStore.getState().board.get('a2')).toEqual({
      type: PieceType.VER_KNEKHT, color: PieceColor.WHITE,
    });
  });

  it('black VK on intermediate ranks is allowed', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('a2', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('a7', { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.get('a2')).toEqual({
      type: PieceType.VER_KNEKHT, color: PieceColor.BLACK,
    });
    expect(useGameStore.getState().board.get('a7')).toEqual({
      type: PieceType.VER_KNEKHT, color: PieceColor.BLACK,
    });
  });

  it('moving a VK onto the last rank in setup is also blocked', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('a7', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().movePiece('a7', 'a8'); // forbidden
    expect(useGameStore.getState().board.get('a8')).toBeUndefined();
    expect(useGameStore.getState().board.get('a7')).toEqual({
      type: PieceType.VER_KNEKHT, color: PieceColor.WHITE,
    });
  });
});
