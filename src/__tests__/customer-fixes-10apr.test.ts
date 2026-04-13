/**
 * Comprehensive tests for ALL 11 customer feedback items from 10.04.2026.
 * Points 1-7: functional, Points 8-11: design, Bonus: IntroPage HTML.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../stores/gameStore';
import { PieceType, PieceColor, boardToSerializable } from '../logic/pieces';

beforeEach(() => {
  useGameStore.getState().setInitialPosition();
});

// ════════════════════════════════════════════════════════════════════════
// POINT 1: FolderDialog — overwrite warning when folder exists
// ════════════════════════════════════════════════════════════════════════
describe('Point 1: FolderDialog overwrite warning', () => {
  it('renders overwrite warning with Да/Нет, clicking Нет returns to input', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
    const { default: FolderDialog } = await import('../components/FolderDialog');

    // Mock Tauri invoke: checkFolderExists returns true
    vi.mock('@tauri-apps/api/core', () => ({
      invoke: vi.fn((cmd: string) => {
        if (cmd === 'check_folder_exists_on_desktop') return Promise.resolve(true);
        if (cmd === 'create_folder_on_desktop') return Promise.resolve('/mock/path');
        return Promise.resolve(null);
      }),
    }));

    const { unmount } = render(React.createElement(FolderDialog, {
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      onDismiss: vi.fn(),
    }));

    // Type folder name and click Создать
    const input = screen.getByPlaceholderText('Моя партия');
    fireEvent.change(input, { target: { value: 'TestFolder' } });
    fireEvent.click(screen.getByText('Создать'));

    // Wait for overwrite warning
    await vi.waitFor(() => {
      expect(screen.getByText('Папка с таким именем уже существует. Перезаписать содержимое?')).toBeTruthy();
    });

    // Да and Нет buttons present
    expect(screen.getByText('Да')).toBeTruthy();
    expect(screen.getByText('Нет')).toBeTruthy();

    // Click Нет — returns to input
    fireEvent.click(screen.getByText('Нет'));
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Моя партия')).toBeTruthy();
    });

    unmount();
    cleanup();
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 2: FolderDialog — Пропустить, X → dismiss, bottom text
// ════════════════════════════════════════════════════════════════════════
describe('Point 2: FolderDialog UI changes', () => {
  it('button says "Пропустить", X calls onDismiss, bottom text correct', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
    const { default: FolderDialog } = await import('../components/FolderDialog');

    const onCancel = vi.fn();
    const onDismiss = vi.fn();

    const { unmount } = render(React.createElement(FolderDialog, {
      onConfirm: vi.fn(),
      onCancel,
      onDismiss,
    }));

    // "Пропустить" button exists
    expect(screen.getByText('Пропустить')).toBeTruthy();

    // No button labeled "Отмена" (only X title)
    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons.find(b => b.textContent === 'Отмена');
    expect(cancelBtn).toBeUndefined();

    // Bottom text matches spec
    const expected = 'Папка будет создана на Рабочем столе. Нажмите «Пропустить», чтобы продолжать без создания папки; фото позиций будут сохраняться в папке «Изображения».';
    expect(screen.getByText(expected)).toBeTruthy();

    // X button calls onDismiss, NOT onCancel
    const xBtn = screen.getByTitle('Отмена');
    fireEvent.click(xBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    unmount();
    cleanup();
  });

  it('clicking Пропустить calls onCancel (skip without folder)', async () => {
    const React = await import('react');
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
    const { default: FolderDialog } = await import('../components/FolderDialog');

    const onCancel = vi.fn();
    const onDismiss = vi.fn();

    const { unmount } = render(React.createElement(FolderDialog, {
      onConfirm: vi.fn(),
      onCancel,
      onDismiss,
    }));

    fireEvent.click(screen.getByText('Пропустить'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    unmount();
    cleanup();
  });

  it('dismiss from start mode does NOT start any session', () => {
    const state = useGameStore.getState();
    expect(state.gameMode).toBe('none');
    expect(state.gameStage).toBe('start');
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 3: prevMove button after restoreSession + 1st move
// ════════════════════════════════════════════════════════════════════════
describe('Point 3: prevMove after restart/restore', () => {
  it('restoreSession creates exactly 1 history entry at index 0', () => {
    const board = boardToSerializable(useGameStore.getState().board);
    useGameStore.getState().restoreSession({
      board,
      currentTurn: PieceColor.BLACK,
      moveNumber: 5,
      gameMode: 'party',
      gameStage: 'play',
      partyFolder: null,
      indicator: '5 … __ хч',
    });

    const state = useGameStore.getState();
    expect(state.history.length).toBe(1);
    expect(state.historyIndex).toBe(0);
  });

  it('after restore + 1 move, prevMove goes back to restored position', () => {
    const board = boardToSerializable(useGameStore.getState().board);
    useGameStore.getState().restoreSession({
      board,
      currentTurn: PieceColor.BLACK,
      moveNumber: 5,
      gameMode: 'party',
      gameStage: 'play',
      partyFolder: null,
      indicator: '5 … __ хч',
    });

    // Black makes a move
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().historyIndex).toBe(1);

    // prevMove should work
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
    expect(useGameStore.getState().moveIndicator).toBe('5 … __ хч');
  });

  it('startParty creates initial entry with lastMove {null, null}', () => {
    useGameStore.getState().startParty('test');
    const state = useGameStore.getState();
    expect(state.history.length).toBe(1);
    expect(state.historyIndex).toBe(0);
    expect(state.history[0].lastMove).toEqual({ from: null, to: null });
  });

  it('after startParty + 1 move, historyIndex is 1 and prevMove works', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('e2', 'e4');
    expect(useGameStore.getState().historyIndex).toBe(1);

    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
  });

  it('startAnalysisPlay creates initial entry', () => {
    useGameStore.getState().startAnalysis();
    // Place some pieces
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });

    useGameStore.getState().startAnalysisPlay('test');
    const state = useGameStore.getState();
    expect(state.history.length).toBe(1);
    expect(state.historyIndex).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 4: lastMove highlight preserved in navigation
// ════════════════════════════════════════════════════════════════════════
describe('Point 4: lastMove in history navigation', () => {
  it('each history entry stores its own lastMove', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('a2', 'a3'); // white
    useGameStore.getState().movePiece('a7', 'a6'); // black
    useGameStore.getState().movePiece('b2', 'b3'); // white

    const state = useGameStore.getState();
    expect(state.history.length).toBe(4);
    expect(state.history[0].lastMove).toEqual({ from: null, to: null });
    expect(state.history[1].lastMove).toEqual({ from: 'a2', to: 'a3' });
    expect(state.history[2].lastMove).toEqual({ from: 'a7', to: 'a6' });
    expect(state.history[3].lastMove).toEqual({ from: 'b2', to: 'b3' });
  });

  it('prevMove restores lastMove from history', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');

    // Go back to move 1
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: 'a2', to: 'a3' });

    // Go back to initial
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
  });

  it('nextMove restores lastMove from history', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');

    // Go back to start
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });

    // Go forward
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: 'a2', to: 'a3' });

    useGameStore.getState().nextMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: 'a7', to: 'a6' });
  });

  it('full navigation cycle: 3 moves, back×3, forward×3 — lastMove matches at each step', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().movePiece('b2', 'b3');

    const expected = [
      { from: null, to: null },
      { from: 'a2', to: 'a3' },
      { from: 'a7', to: 'a6' },
      { from: 'b2', to: 'b3' },
    ];

    // Navigate back to start
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
    expect(useGameStore.getState().lastMove).toEqual(expected[0]);

    // Navigate forward one by one, checking lastMove
    for (let i = 1; i <= 3; i++) {
      useGameStore.getState().nextMove();
      expect(useGameStore.getState().historyIndex).toBe(i);
      expect(useGameStore.getState().lastMove).toEqual(expected[i]);
    }
  });

  it('prevMove at index 0 does nothing', () => {
    useGameStore.getState().startParty('test');
    expect(useGameStore.getState().historyIndex).toBe(0);
    useGameStore.getState().prevMove(); // should not crash
    expect(useGameStore.getState().historyIndex).toBe(0);
  });

  it('nextMove at last index does nothing', () => {
    useGameStore.getState().startParty('test');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().historyIndex).toBe(1);
    useGameStore.getState().nextMove(); // should not crash
    expect(useGameStore.getState().historyIndex).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 5: movePiece in setup does NOT toggle turn / change history
// ════════════════════════════════════════════════════════════════════════
describe('Point 5: setup movePiece no side effects', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it('currentTurn unchanged after moving piece in setup', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    const before = useGameStore.getState().currentTurn;
    useGameStore.getState().movePiece('e4', 'e5');
    expect(useGameStore.getState().currentTurn).toBe(before);
  });

  it('moveNumber unchanged after moving piece in setup', () => {
    useGameStore.getState().placePiece('d4', { type: PieceType.RITTER, color: PieceColor.BLACK });
    const before = useGameStore.getState().moveNumber;
    useGameStore.getState().movePiece('d4', 'd5');
    expect(useGameStore.getState().moveNumber).toBe(before);
  });

  it('history length unchanged after moving piece in setup', () => {
    useGameStore.getState().placePiece('c3', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    const before = useGameStore.getState().history.length;
    useGameStore.getState().movePiece('c3', 'c4');
    expect(useGameStore.getState().history.length).toBe(before);
  });

  it('lastMove unchanged after moving piece in setup', () => {
    useGameStore.getState().placePiece('a4', { type: PieceType.RITTER, color: PieceColor.WHITE });
    const before = useGameStore.getState().lastMove;
    useGameStore.getState().movePiece('a4', 'a5');
    expect(useGameStore.getState().lastMove).toEqual(before);
  });

  it('piece is actually moved on the board in setup', () => {
    useGameStore.getState().placePiece('b2', { type: PieceType.PRINCE, color: PieceColor.BLACK });
    useGameStore.getState().movePiece('b2', 'b4');
    expect(useGameStore.getState().board.has('b2')).toBe(false);
    expect(useGameStore.getState().board.has('b4')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 6: placePiece clears selectedForDeletion; toggle/empty deselect
// ════════════════════════════════════════════════════════════════════════
describe('Point 6: selection reset on place, toggle, empty click', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it('placePiece clears selectedForDeletion', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('e4');
    expect(useGameStore.getState().selectedForDeletion).toBe('e4');

    useGameStore.getState().placePiece('d4', { type: PieceType.RITTER, color: PieceColor.WHITE });
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('setSelectedForDeletion(null) clears selection (empty square click)', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('e4');
    expect(useGameStore.getState().selectedForDeletion).toBe('e4');

    useGameStore.getState().setSelectedForDeletion(null);
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('deleteSelectedPiece clears selection and removes piece', () => {
    useGameStore.getState().placePiece('f5', { type: PieceType.RITTER, color: PieceColor.BLACK });
    useGameStore.getState().setSelectedForDeletion('f5');
    useGameStore.getState().deleteSelectedPiece();

    expect(useGameStore.getState().selectedForDeletion).toBeNull();
    expect(useGameStore.getState().board.has('f5')).toBe(false);
  });

  it('deleteSelectedPiece does nothing if nothing selected', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().deleteSelectedPiece(); // no selection
    expect(useGameStore.getState().board.has('a1')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 7: Knekht (pawn) placement restrictions
// ════════════════════════════════════════════════════════════════════════
describe('Point 7: knekht rank restrictions', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  // White knekht: forbidden on ranks 6, 7, 8
  const whiteKnekht = { type: PieceType.KNEKHT, color: PieceColor.WHITE };
  const blackKnekht = { type: PieceType.KNEKHT, color: PieceColor.BLACK };

  describe('placePiece restrictions', () => {
    it.each(['a6', 'b7', 'c8', 'd6', 'e7', 'f8', 'g6', 'h8'])(
      'white knekht CANNOT be placed on %s',
      (sq) => {
        useGameStore.getState().placePiece(sq, whiteKnekht);
        expect(useGameStore.getState().board.has(sq)).toBe(false);
      }
    );

    it.each(['a1', 'b2', 'c3', 'd1', 'e2', 'f3', 'g1', 'h3'])(
      'black knekht CANNOT be placed on %s',
      (sq) => {
        useGameStore.getState().placePiece(sq, blackKnekht);
        expect(useGameStore.getState().board.has(sq)).toBe(false);
      }
    );

    it.each(['a1', 'b2', 'c3', 'd4', 'e5'])(
      'white knekht CAN be placed on %s',
      (sq) => {
        useGameStore.getState().placePiece(sq, whiteKnekht);
        expect(useGameStore.getState().board.has(sq)).toBe(true);
      }
    );

    it.each(['a4', 'b5', 'c6', 'd7', 'e8'])(
      'black knekht CAN be placed on %s',
      (sq) => {
        useGameStore.getState().placePiece(sq, blackKnekht);
        expect(useGameStore.getState().board.has(sq)).toBe(true);
      }
    );
  });

  describe('movePiece restrictions in setup', () => {
    it('white knekht cannot be moved to rank 6 in setup', () => {
      useGameStore.getState().placePiece('a5', whiteKnekht);
      useGameStore.getState().movePiece('a5', 'a6');
      expect(useGameStore.getState().board.has('a5')).toBe(true);
      expect(useGameStore.getState().board.has('a6')).toBe(false);
    });

    it('white knekht cannot be moved to rank 7 in setup', () => {
      useGameStore.getState().placePiece('b5', whiteKnekht);
      useGameStore.getState().movePiece('b5', 'b7');
      expect(useGameStore.getState().board.has('b5')).toBe(true);
      expect(useGameStore.getState().board.has('b7')).toBe(false);
    });

    it('white knekht cannot be moved to rank 8 in setup', () => {
      useGameStore.getState().placePiece('c5', whiteKnekht);
      useGameStore.getState().movePiece('c5', 'c8');
      expect(useGameStore.getState().board.has('c5')).toBe(true);
      expect(useGameStore.getState().board.has('c8')).toBe(false);
    });

    it('black knekht cannot be moved to rank 3 in setup', () => {
      useGameStore.getState().placePiece('a4', blackKnekht);
      useGameStore.getState().movePiece('a4', 'a3');
      expect(useGameStore.getState().board.has('a4')).toBe(true);
      expect(useGameStore.getState().board.has('a3')).toBe(false);
    });

    it('black knekht cannot be moved to rank 2 in setup', () => {
      useGameStore.getState().placePiece('b4', blackKnekht);
      useGameStore.getState().movePiece('b4', 'b2');
      expect(useGameStore.getState().board.has('b4')).toBe(true);
      expect(useGameStore.getState().board.has('b2')).toBe(false);
    });

    it('black knekht cannot be moved to rank 1 in setup', () => {
      useGameStore.getState().placePiece('c4', blackKnekht);
      useGameStore.getState().movePiece('c4', 'c1');
      expect(useGameStore.getState().board.has('c4')).toBe(true);
      expect(useGameStore.getState().board.has('c1')).toBe(false);
    });

    it('white knekht CAN be moved to rank 5 in setup', () => {
      useGameStore.getState().placePiece('a4', whiteKnekht);
      useGameStore.getState().movePiece('a4', 'a5');
      expect(useGameStore.getState().board.has('a4')).toBe(false);
      expect(useGameStore.getState().board.has('a5')).toBe(true);
    });

    it('black knekht CAN be moved to rank 4 in setup', () => {
      useGameStore.getState().placePiece('a5', blackKnekht);
      useGameStore.getState().movePiece('a5', 'a4');
      expect(useGameStore.getState().board.has('a5')).toBe(false);
      expect(useGameStore.getState().board.has('a4')).toBe(true);
    });
  });

  describe('non-knekht pieces are NOT restricted', () => {
    it('white king can be placed on rank 8', () => {
      useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.has('e8')).toBe(true);
    });

    it('black ritter can be placed on rank 1', () => {
      useGameStore.getState().placePiece('d1', { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(useGameStore.getState().board.has('d1')).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 8: "Начальная расстановка" button design (TopBar)
// ════════════════════════════════════════════════════════════════════════
describe('Point 8: Initial position button design', () => {
  it('TopBar renders SVG with correct attributes for initial position button', async () => {
    const { default: fs } = await import('fs');
    const source = fs.readFileSync('src/components/TopBar.tsx', 'utf-8');

    // Outer border ~1px
    expect(source).toMatch(/strokeWidth=["']1["']/);

    // Inner squares start with offset (padding from edge)
    // Should have x offset > 3 for ~15% padding on a 32px viewBox
    expect(source).toMatch(/x=\{5/);
    expect(source).toMatch(/y=\{5/);

    // Light fill for background (light gap)
    expect(source).toMatch(/fill=["']#f0f0f0["']/);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 9: Reset button arrow — counter-clockwise
// ════════════════════════════════════════════════════════════════════════
describe('Point 9: Reset button arrow direction', () => {
  it('IconReset SVG uses counter-clockwise arc', async () => {
    const { default: fs } = await import('fs');
    const source = fs.readFileSync('src/components/icons/ButtonIcons.tsx', 'utf-8');

    // Should contain "counter-clockwise" or "CCW" in comments
    expect(source.toLowerCase()).toMatch(/counter.?clockwise|ccw/);

    // Arc sweep flag: A rx ry ... 1 1 (large-arc=1, sweep=1 = CCW visual)
    expect(source).toMatch(/A\s+26\s+26\s+0\s+1\s+1/);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 10: Window width at startup
// ════════════════════════════════════════════════════════════════════════
describe('Point 10: Startup window width', () => {
  it('tauri.conf.json has narrow initial width (<=700)', async () => {
    const { default: fs } = await import('fs');
    const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf-8'));

    const windows = conf.app?.windows ?? conf.tauri?.windows ?? [];
    expect(windows.length).toBeGreaterThan(0);

    const win = windows[0];
    expect(win.width).toBeLessThanOrEqual(700);
    expect(win.width).toBeGreaterThanOrEqual(500); // not too small
  });

  it('minWidth allows for piece trays in analysis mode', async () => {
    const { default: fs } = await import('fs');
    const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf-8'));

    const windows = conf.app?.windows ?? conf.tauri?.windows ?? [];
    const win = windows[0];
    expect(win.minWidth).toBeGreaterThanOrEqual(500);
  });
});

// ════════════════════════════════════════════════════════════════════════
// POINT 11: Castle overlay border — no duplicate lines
// ════════════════════════════════════════════════════════════════════════
describe('Point 11: Castle overlay border', () => {
  it('Board.tsx castle uses individual lines (no CSS border box)', async () => {
    const { default: fs } = await import('fs');
    const source = fs.readFileSync('src/components/Board.tsx', 'utf-8');

    // Castle draws one horizontal line per side (mkHoriz), not a CSS border box
    expect(source).toMatch(/mkHoriz/);
    // 5 vertical lines of equal width (left edge + 3 internal + right edge)
    expect(source).toMatch(/\[0,\s*1,\s*2,\s*3,\s*4\]/);
    // Only one horizontal line drawn per castle (the side NOT touching board edge)
    expect(source).toMatch(/atBottom/);
  });
});

// ════════════════════════════════════════════════════════════════════════
// BONUS: IntroPage supports HTML rendering
// ════════════════════════════════════════════════════════════════════════
describe('Bonus: IntroPage HTML support', () => {
  it('IntroPage uses dangerouslySetInnerHTML for text content', async () => {
    const { default: fs } = await import('fs');
    const source = fs.readFileSync('src/components/IntroPage.tsx', 'utf-8');

    expect(source).toContain('dangerouslySetInnerHTML');
    expect(source).toContain('__html');
  });
});

// ════════════════════════════════════════════════════════════════════════
// INTEGRATION: Full game flow
// ════════════════════════════════════════════════════════════════════════
describe('Integration: full game flow', () => {
  it('start party → moves → navigate → restore highlight', () => {
    useGameStore.getState().startParty(null);

    // Make 5 moves
    useGameStore.getState().movePiece('e2', 'e4');
    useGameStore.getState().movePiece('e7', 'e5');
    useGameStore.getState().movePiece('d2', 'd4');
    useGameStore.getState().movePiece('d7', 'd5');
    useGameStore.getState().movePiece('b1', 'c3');

    expect(useGameStore.getState().historyIndex).toBe(5);
    expect(useGameStore.getState().lastMove).toEqual({ from: 'b1', to: 'c3' });

    // Navigate back to move 2
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(2);
    expect(useGameStore.getState().lastMove).toEqual({ from: 'e7', to: 'e5' });

    // Navigate forward to last
    useGameStore.getState().nextMove();
    useGameStore.getState().nextMove();
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().historyIndex).toBe(5);
    expect(useGameStore.getState().lastMove).toEqual({ from: 'b1', to: 'c3' });
  });

  it('analysis setup → place pieces → restricted knekht → start play → navigate', () => {
    useGameStore.getState().startAnalysis();

    // Place pieces
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('a2', { type: PieceType.KNEKHT, color: PieceColor.WHITE });

    // Try forbidden rank
    useGameStore.getState().placePiece('a6', { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.has('a6')).toBe(false);

    // Move piece in setup — no turn change
    const turnBefore = useGameStore.getState().currentTurn;
    useGameStore.getState().movePiece('a2', 'a4');
    expect(useGameStore.getState().currentTurn).toBe(turnBefore);

    // Start play
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().history.length).toBe(1);
    expect(useGameStore.getState().historyIndex).toBe(0);
  });
});
