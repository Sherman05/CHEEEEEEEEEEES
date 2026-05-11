/**
 * Tests for the bugfix/ui-p0-p2 task pack:
 *   TASK-01 — phantom move on drop into the notation strip / off-board area
 *   TASK-02 — "Удалить фигуру" button stays disabled after selecting a piece in setup
 *   TASK-03 — VerKnecht cannot be manually placed on the last rank
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { useGameStore } from '../stores/gameStore';
import { PieceType, PieceColor } from '../logic/pieces';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve(null)) }));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ close: vi.fn(), minimize: vi.fn(), setAlwaysOnTop: vi.fn() }),
}));

// jsdom doesn't ship ResizeObserver; Board uses one to track parent size.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof FakeResizeObserver }).ResizeObserver =
  FakeResizeObserver;

// Force getBoundingClientRect to return a known board rect so getSquareFromPos
// resolves real coordinates instead of all-zeros from jsdom.
const RECT = { left: 0, top: 0, right: 600, bottom: 600, width: 600, height: 600, x: 0, y: 0 };
beforeEach(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    ...RECT,
    toJSON: () => RECT,
  })) as unknown as () => DOMRect;
  useGameStore.getState().setInitialPosition();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Helpers — Board lays out: outerRing + notation + boardSize + notation + bottomFileGap.
// With containerSize=600 (Math.min of clientWidth/Height after subtracting margins), the
// notation row is ~27px and outerRing ~7px. We compute the inner area dynamically.
function getInnerOrigin(containerSize: number) {
  const outerRing = Math.max(4, Math.round(containerSize * 0.012));
  const notationSize = containerSize * 0.045;
  return outerRing + notationSize;
}
function getCellSize(containerSize: number) {
  const outerRing = Math.max(4, Math.round(containerSize * 0.012));
  const notationSize = containerSize * 0.045;
  const bottomFileGap = Math.round(notationSize * 0.35);
  const boardSize = containerSize - notationSize * 2 - outerRing * 2 - bottomFileGap;
  return boardSize / 8;
}

// Board's parent is sized via ResizeObserver. We override clientWidth/Height to feed it.
function withParentSize(size: number, run: () => void) {
  const origW = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const origH = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => size });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => size });
  try {
    run();
  } finally {
    if (origW) Object.defineProperty(HTMLElement.prototype, 'clientWidth', origW);
    if (origH) Object.defineProperty(HTMLElement.prototype, 'clientHeight', origH);
  }
}

// Coordinates of a board cell centre in the rect coordinate space.
function cellCenter(file: string, rank: number, containerSize: number) {
  const innerOrigin = getInnerOrigin(containerSize);
  const cellSize = getCellSize(containerSize);
  // Board is rendered with files a-h left→right and ranks 8-1 top→bottom (unreversed).
  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const col = FILES.indexOf(file);
  const row = 8 - rank;
  return {
    x: innerOrigin + (col + 0.5) * cellSize,
    y: innerOrigin + (row + 0.5) * cellSize,
  };
}

// ════════════════════════════════════════════════════════════════════════
// TASK-01 — phantom move
// ════════════════════════════════════════════════════════════════════════
describe('TASK-01: drop outside any valid cell reverts (no move, no turn change)', () => {
  it('dropOnNotationStrip_revertsAndDoesNotAdvanceTurn', async () => {
    useGameStore.getState().startParty('t');
    const { default: Board } = await import('../components/Board');

    withParentSize(600, () => {
      const { container } = render(<Board />);
      const root = container.querySelector('[data-board-root]') as HTMLElement;
      expect(root).toBeTruthy();

      const initialBoardCopy = new Map(useGameStore.getState().board);
      const initialTurn = useGameStore.getState().currentTurn;
      const initialHistoryLength = useGameStore.getState().history.length;
      const initialMoveNumber = useGameStore.getState().moveNumber;

      // Pick a white pawn at a2.
      const from = cellCenter('a', 2, 600);
      // Notation strip lives between outer ring and the inner board area.
      // y = 3 falls inside the top notation row (outerRing ~7..notationSize start).
      // Use x = innerOrigin + 5*cellSize-ish to stay over the strip horizontally.
      const noteY = 3;
      const noteX = getInnerOrigin(600) + getCellSize(600) * 3;

      act(() => {
        fireEvent.mouseDown(root, { button: 0, clientX: from.x, clientY: from.y });
        fireEvent.mouseUp(root, { button: 0, clientX: noteX, clientY: noteY });
      });

      const st = useGameStore.getState();
      expect(st.currentTurn).toBe(initialTurn);
      expect(st.moveNumber).toBe(initialMoveNumber);
      expect(st.history.length).toBe(initialHistoryLength);
      expect(st.board.size).toBe(initialBoardCopy.size);
      // The dragged piece must still be on its original square.
      expect(st.board.get('a2')).toEqual({ type: PieceType.KNEKHT, color: PieceColor.WHITE });
    });
  });

  it('dropOutsideBoard_revertsAndDoesNotAdvanceTurn', async () => {
    useGameStore.getState().startParty('t');
    const { default: Board } = await import('../components/Board');

    withParentSize(600, () => {
      const { container } = render(<Board />);
      const root = container.querySelector('[data-board-root]') as HTMLElement;

      const initialTurn = useGameStore.getState().currentTurn;
      const initialMoveNumber = useGameStore.getState().moveNumber;
      const initialHistoryLength = useGameStore.getState().history.length;

      const from = cellCenter('e', 2, 600);
      // Way past the right edge — outside any cell.
      act(() => {
        fireEvent.mouseDown(root, { button: 0, clientX: from.x, clientY: from.y });
        fireEvent.mouseUp(root, { button: 0, clientX: 590, clientY: 590 });
      });

      const st = useGameStore.getState();
      expect(st.currentTurn).toBe(initialTurn);
      expect(st.moveNumber).toBe(initialMoveNumber);
      expect(st.history.length).toBe(initialHistoryLength);
      expect(st.board.get('e2')).toEqual({ type: PieceType.KNEKHT, color: PieceColor.WHITE });
    });
  });

  it('setup mode: drop outside board does NOT remove the piece', async () => {
    // Setup: place a single piece, then drag it off the board.
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('d4', { type: PieceType.KING, color: PieceColor.WHITE });
    const { default: Board } = await import('../components/Board');

    withParentSize(600, () => {
      const { container } = render(<Board />);
      const root = container.querySelector('[data-board-root]') as HTMLElement;

      const from = cellCenter('d', 4, 600);
      act(() => {
        fireEvent.mouseDown(root, { button: 0, clientX: from.x, clientY: from.y });
        fireEvent.mouseUp(root, { button: 0, clientX: 595, clientY: 595 });
      });

      expect(useGameStore.getState().board.get('d4')).toEqual({
        type: PieceType.KING, color: PieceColor.WHITE,
      });
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
// TASK-02 — Delete button enables on click
// ════════════════════════════════════════════════════════════════════════
describe('TASK-02: clicking a piece in Setup selects it for deletion', () => {
  it('selectingPieceOnBoardInSetup_enablesDeleteButton', async () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('e4', { type: PieceType.RITTER, color: PieceColor.WHITE });

    const { default: Board } = await import('../components/Board');

    withParentSize(600, () => {
      const { container } = render(<Board />);
      const root = container.querySelector('[data-board-root]') as HTMLElement;

      expect(useGameStore.getState().selectedForDeletion).toBeNull();

      const c = cellCenter('e', 4, 600);
      // A bare click (mousedown + mouseup at the same point) should leave the
      // click handler free to fire and toggle selectedForDeletion.
      act(() => {
        fireEvent.mouseDown(root, { button: 0, clientX: c.x, clientY: c.y });
        fireEvent.mouseUp(root, { button: 0, clientX: c.x, clientY: c.y });
        fireEvent.click(root, { clientX: c.x, clientY: c.y });
      });

      expect(useGameStore.getState().selectedForDeletion).toBe('e4');
    });
  });

  it('clicking an empty square clears selection', async () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('e4', { type: PieceType.RITTER, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('e4');

    const { default: Board } = await import('../components/Board');

    withParentSize(600, () => {
      const { container } = render(<Board />);
      const root = container.querySelector('[data-board-root]') as HTMLElement;

      const c = cellCenter('a', 1, 600); // empty
      act(() => {
        // mousedown on empty cell does nothing (no piece), so no drag starts.
        fireEvent.mouseDown(root, { button: 0, clientX: c.x, clientY: c.y });
        fireEvent.mouseUp(root, { button: 0, clientX: c.x, clientY: c.y });
        fireEvent.click(root, { clientX: c.x, clientY: c.y });
      });

      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });
  });
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
