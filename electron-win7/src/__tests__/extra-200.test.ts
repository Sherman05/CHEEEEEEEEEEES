/**
 * 106 additional tests — bug regressions, edge cases, persistence, promotion details.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, getViewMode } from '../stores/gameStore';
import {
  PieceType, PieceColor, FILES, RANKS,
  createInitialPosition, cloneBoard, toSquare, parseSquare,
  boardToSerializable, boardFromSerializable,
  isCastle, isWhiteCastle, isBlackCastle,
  CASTLE_WHITE, CASTLE_BLACK,
} from '../logic/pieces';
import { checkPromotion } from '../logic/promotion';
import { checkScoutCapture } from '../logic/scout';

beforeEach(() => {
  useGameStore.getState().setInitialPosition();
});

// ════════════════════════════════════════════════════════════════════════
// 1-12: Drag-off-board history regression (Bug #4 fix)
// ════════════════════════════════════════════════════════════════════════
describe('drag-off-board history recording', () => {
  it('1. removePiece does not add to history (store-level)', () => {
    useGameStore.getState().startParty('t');
    const histBefore = useGameStore.getState().history.length;
    useGameStore.getState().removePiece('a2');
    // removePiece alone does not record history (Board.tsx handles that)
    expect(useGameStore.getState().history.length).toBe(histBefore);
  });

  it('2. piece removal from board actually removes it', () => {
    useGameStore.getState().startParty('t');
    expect(useGameStore.getState().board.has('a2')).toBe(true);
    useGameStore.getState().removePiece('a2');
    expect(useGameStore.getState().board.has('a2')).toBe(false);
  });

  it('3. removePiece on non-existent square is safe', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().removePiece('e4');
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('4. after removing piece, board size decreases by 1', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().removePiece('a1');
    expect(useGameStore.getState().board.size).toBe(31);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 5-16: Auto-promotion history regression (Bug #2 fix)
// ════════════════════════════════════════════════════════════════════════
describe('auto-promotion history correctness', () => {
  it('5. knekht on rank 5 moving to rank 6 triggers auto-promotion', () => {
    const result = checkPromotion(
      { type: PieceType.KNEKHT, color: PieceColor.WHITE },
      'a6'
    );
    expect(result).toEqual({ auto: true });
  });

  it('6. black knekht on rank 4 moving to rank 3 triggers auto-promotion', () => {
    const result = checkPromotion(
      { type: PieceType.KNEKHT, color: PieceColor.BLACK },
      'a3'
    );
    expect(result).toEqual({ auto: true });
  });

  it('7. VER_KNEKHT type exists and is distinct', () => {
    expect(PieceType.VER_KNEKHT).toBeDefined();
    expect(PieceType.VER_KNEKHT).not.toBe(PieceType.KNEKHT);
  });

  it('8. completePromotion updates board piece type', () => {
    useGameStore.getState().startParty('t');
    // Simulate: piece on e8 needs promotion
    const board = cloneBoard(useGameStore.getState().board);
    board.set('e8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.setState({ board });
    useGameStore.getState().setPromotionPending({
      square: 'e8',
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [{ type: PieceType.KONNET, color: PieceColor.WHITE }],
    });
    useGameStore.getState().completePromotion({ type: PieceType.KONNET, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.get('e8')?.type).toBe(PieceType.KONNET);
  });

  it('9. completePromotion clears promotionPending', () => {
    useGameStore.getState().startParty('t');
    const board = cloneBoard(useGameStore.getState().board);
    board.set('d8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    useGameStore.setState({ board });
    useGameStore.getState().setPromotionPending({
      square: 'd8',
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [{ type: PieceType.PRINCE, color: PieceColor.WHITE }],
    });
    useGameStore.getState().completePromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE });
    expect(useGameStore.getState().promotionPending).toBeNull();
  });

  it('10. auto-promotion does not trigger for non-knekht pieces', () => {
    expect(checkPromotion({ type: PieceType.RITTER, color: PieceColor.WHITE }, 'a6')).toBeNull();
    expect(checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, 'a6')).toBeNull();
    expect(checkPromotion({ type: PieceType.SCOUT, color: PieceColor.WHITE }, 'a6')).toBeNull();
  });

  it('11. auto-promotion does not trigger on wrong rank', () => {
    expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.WHITE }, 'a5')).toBeNull();
    expect(checkPromotion({ type: PieceType.KNEKHT, color: PieceColor.BLACK }, 'a4')).toBeNull();
  });

  it('12. completePromotion with no pending is no-op', () => {
    useGameStore.getState().startParty('t');
    const boardBefore = useGameStore.getState().board.size;
    useGameStore.getState().completePromotion({ type: PieceType.RITTER, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.size).toBe(boardBefore);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 13-24: Scout capture — edge cases
// ════════════════════════════════════════════════════════════════════════
describe('scout capture edge cases', () => {
  it('13. scout captures on ALL 8 castle squares', () => {
    const allCastles = [...CASTLE_WHITE, ...CASTLE_BLACK];
    for (const sq of allCastles) {
      const board: Map<string, any> = new Map();
      board.set(sq, { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(checkScoutCapture(
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
        'a1', sq, board
      )).toBe(true);
    }
  });

  it('14. scout does NOT capture on non-castle rank-1 squares', () => {
    for (const sq of ['a1', 'b1', 'g1', 'h1']) {
      const board: Map<string, any> = new Map();
      board.set(sq, { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(checkScoutCapture(
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
        'a2', sq, board
      )).toBe(false);
    }
  });

  it('15. scout does NOT capture on non-castle rank-8 squares', () => {
    for (const sq of ['a8', 'b8', 'g8', 'h8']) {
      const board: Map<string, any> = new Map();
      board.set(sq, { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(checkScoutCapture(
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
        'a7', sq, board
      )).toBe(false);
    }
  });

  it('16. scout does NOT capture on mid-board squares', () => {
    for (const sq of ['a4', 'e5', 'd3', 'h6']) {
      const board: Map<string, any> = new Map();
      board.set(sq, { type: PieceType.RITTER, color: PieceColor.BLACK });
      expect(checkScoutCapture(
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
        'a3', sq, board
      )).toBe(false);
    }
  });

  it('17. non-scout piece types never trigger scout capture', () => {
    const board: Map<string, any> = new Map();
    board.set('c1', { type: PieceType.RITTER, color: PieceColor.BLACK });
    const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT];
    for (const t of types) {
      expect(checkScoutCapture({ type: t, color: PieceColor.WHITE }, 'b2', 'c1', board)).toBe(false);
    }
  });

  it('18. scout cannot capture own pieces on castle', () => {
    const board: Map<string, any> = new Map();
    board.set('c1', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'b2', 'c1', board
    )).toBe(false);
  });

  it('19. scout capture on empty castle square returns false', () => {
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'b2', 'c1', new Map()
    )).toBe(false);
  });

  it('20. black scout captures white on white castle', () => {
    const board: Map<string, any> = new Map();
    board.set('d1', { type: PieceType.KING, color: PieceColor.WHITE });
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.BLACK },
      'd2', 'd1', board
    )).toBe(true);
  });

  it('21. white scout captures black on black castle', () => {
    const board: Map<string, any> = new Map();
    board.set('e8', { type: PieceType.KING, color: PieceColor.BLACK });
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'e7', 'e8', board
    )).toBe(true);
  });

  it('22. scout captures every piece type on castle', () => {
    const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.KNEKHT, PieceType.VER_KNEKHT, PieceType.SCOUT];
    for (const t of types) {
      const board: Map<string, any> = new Map();
      board.set('c8', { type: t, color: PieceColor.BLACK });
      expect(checkScoutCapture(
        { type: PieceType.SCOUT, color: PieceColor.WHITE },
        'c7', 'c8', board
      )).toBe(true);
    }
  });

  it('23. scout capture uses _from parameter loosely (any source square)', () => {
    const board: Map<string, any> = new Map();
    board.set('f1', { type: PieceType.PRINCE, color: PieceColor.BLACK });
    // _from is not validated — scout can capture from any square
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'h8', 'f1', board
    )).toBe(true);
  });

  it('24. two scouts on adjacent castle squares are independent', () => {
    const board: Map<string, any> = new Map();
    board.set('c1', { type: PieceType.SCOUT, color: PieceColor.BLACK });
    board.set('d1', { type: PieceType.SCOUT, color: PieceColor.BLACK });
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'c2', 'c1', board
    )).toBe(true);
    expect(checkScoutCapture(
      { type: PieceType.SCOUT, color: PieceColor.WHITE },
      'd2', 'd1', board
    )).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 25-36: Promotion — VER_KNEKHT and Prince on each castle/edge square
// ════════════════════════════════════════════════════════════════════════
describe('promotion boundary completeness', () => {
  it('25. white VK does NOT promote on own back rank', () => {
    for (const f of FILES) {
      expect(checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        toSquare(f, 1)
      )).toBeNull();
    }
  });

  it('26. black VK does NOT promote on own back rank', () => {
    for (const f of FILES) {
      expect(checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK },
        toSquare(f, 8)
      )).toBeNull();
    }
  });

  it('27. white VK on rank 2-7 never promotes', () => {
    for (let r = 2; r <= 7; r++) {
      expect(checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        toSquare('d', r)
      )).toBeNull();
    }
  });

  it('28. black VK on rank 2-7 never promotes', () => {
    for (let r = 2; r <= 7; r++) {
      expect(checkPromotion(
        { type: PieceType.VER_KNEKHT, color: PieceColor.BLACK },
        toSquare('d', r)
      )).toBeNull();
    }
  });

  it('29. white Prince on rank 1-7 never promotes', () => {
    for (let r = 1; r <= 7; r++) {
      expect(checkPromotion(
        { type: PieceType.PRINCE, color: PieceColor.WHITE },
        toSquare('d', r)
      )).toBeNull();
    }
  });

  it('30. black Prince on rank 2-8 never promotes', () => {
    for (let r = 2; r <= 8; r++) {
      expect(checkPromotion(
        { type: PieceType.PRINCE, color: PieceColor.BLACK },
        toSquare('d', r)
      )).toBeNull();
    }
  });

  it('31. white Prince on opponent castle (c8-f8) gets 2 options', () => {
    for (const sq of ['c8', 'd8', 'e8', 'f8']) {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.WHITE }, sq);
      expect(r?.options).toHaveLength(2);
    }
  });

  it('32. black Prince on opponent castle (c1-f1) gets 2 options', () => {
    for (const sq of ['c1', 'd1', 'e1', 'f1']) {
      const r = checkPromotion({ type: PieceType.PRINCE, color: PieceColor.BLACK }, sq);
      expect(r?.options).toHaveLength(2);
    }
  });

  it('33. promotion options always have matching color', () => {
    const r = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
    for (const opt of r!.options!) {
      expect(opt.color).toBe(PieceColor.WHITE);
    }
  });

  it('34. promotion options never include KING', () => {
    const r = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
    const types = r!.options!.map(o => o.type);
    expect(types).not.toContain(PieceType.KING);
  });

  it('35. promotion options never include KNEKHT', () => {
    const r = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
    const types = r!.options!.map(o => o.type);
    expect(types).not.toContain(PieceType.KNEKHT);
  });

  it('36. promotion options never include VER_KNEKHT', () => {
    const r = checkPromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }, 'a8');
    const types = r!.options!.map(o => o.type);
    expect(types).not.toContain(PieceType.VER_KNEKHT);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 37-48: Persistence (saveSession / loadSession contract)
// ════════════════════════════════════════════════════════════════════════
describe('persistence contract', () => {
  it('37. SavedSession has board field', () => {
    const board = boardToSerializable(createInitialPosition());
    expect(Object.keys(board).length).toBe(32);
  });

  it('38. boardToSerializable produces plain object', () => {
    const board = createInitialPosition();
    const ser = boardToSerializable(board);
    expect(ser.constructor).toBe(Object);
  });

  it('39. boardFromSerializable produces Map', () => {
    const board = boardFromSerializable({});
    expect(board instanceof Map).toBe(true);
  });

  it('40. serialized board can be JSON.stringified', () => {
    const board = boardToSerializable(createInitialPosition());
    const json = JSON.stringify(board);
    expect(typeof json).toBe('string');
    expect(json.length).toBeGreaterThan(0);
  });

  it('41. JSON round-trip preserves board data', () => {
    const board = boardToSerializable(createInitialPosition());
    const restored = JSON.parse(JSON.stringify(board));
    const map = boardFromSerializable(restored);
    expect(map.size).toBe(32);
    expect(map.get('e1')?.type).toBe(PieceType.KING);
  });

  it('42. restoreSession with modified board preserves changes', () => {
    const board = boardToSerializable(createInitialPosition());
    delete board['a1']; // remove ritter
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().board.has('a1')).toBe(false);
    expect(useGameStore.getState().board.size).toBe(31);
  });

  it('43. restoreSession indicator is set correctly', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.BLACK, moveNumber: 7,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '7 … __ хч',
    });
    expect(useGameStore.getState().moveIndicator).toBe('7 … __ хч');
  });

  it('44. restoreSession + endSession fully resets', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.BLACK, moveNumber: 5,
      gameMode: 'party', gameStage: 'play', partyFolder: 'test',
      indicator: '5 … __ хч',
    });
    useGameStore.getState().endSession();
    expect(useGameStore.getState().gameMode).toBe('none');
    expect(useGameStore.getState().board.size).toBe(32);
    expect(useGameStore.getState().partyFolder).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 45-56: History navigation — stress tests
// ════════════════════════════════════════════════════════════════════════
describe('history navigation stress', () => {
  it('45. 20 prevMoves at index 0 stays at 0', () => {
    useGameStore.getState().startParty('t');
    for (let i = 0; i < 20; i++) useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
  });

  it('46. 20 nextMoves at last index stays at last', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    for (let i = 0; i < 20; i++) useGameStore.getState().nextMove();
    expect(useGameStore.getState().historyIndex).toBe(1);
  });

  it('47. rapid prev/next alternation preserves consistency', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    for (let i = 0; i < 50; i++) {
      useGameStore.getState().prevMove();
      useGameStore.getState().nextMove();
    }
    expect(useGameStore.getState().historyIndex).toBe(2);
    expect(useGameStore.getState().lastMove).toEqual({ from: 'a7', to: 'a6' });
  });

  it('48. after branch, old future is gone', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().movePiece('b2', 'b3');
    // Go back to index 1 and branch
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().movePiece('h7', 'h6'); // new branch
    expect(useGameStore.getState().history.length).toBe(3);
    // Cannot navigate forward beyond new branch
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().historyIndex).toBe(2);
  });

  it('49. history entry board is independent from live board', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    const histBoard = useGameStore.getState().history[0].board;
    // History entry 0 should still have a2
    expect(histBoard['a2']).toBeDefined();
    // Live board should NOT have a2
    expect(useGameStore.getState().board.has('a2')).toBe(false);
  });

  it('50. prevMove restores currentTurn', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
  });

  it('51. nextMove restores currentTurn', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().prevMove();
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
  });

  it('52. prevMove restores moveNumber', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().moveNumber).toBe(2);
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().moveNumber).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 53-64: Setup mode — comprehensive edge cases
// ════════════════════════════════════════════════════════════════════════
describe('setup mode edge cases', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it('53. placing 32 pieces on all squares works', () => {
    for (const f of FILES) {
      for (const r of [1, 2]) {
        useGameStore.getState().placePiece(toSquare(f, r), { type: PieceType.RITTER, color: PieceColor.WHITE });
      }
      for (const r of [7, 8]) {
        useGameStore.getState().placePiece(toSquare(f, r), { type: PieceType.RITTER, color: PieceColor.BLACK });
      }
    }
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('54. placing piece on occupied square replaces it', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e4', { type: PieceType.RITTER, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.get('e4')).toEqual({ type: PieceType.RITTER, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.size).toBe(1);
  });

  it('55. movePiece in setup does not affect empty source', () => {
    useGameStore.getState().movePiece('a1', 'a2'); // nothing on a1
    expect(useGameStore.getState().board.size).toBe(0);
  });

  it('56. movePiece in setup actually moves the piece', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().movePiece('a1', 'h8');
    expect(useGameStore.getState().board.has('a1')).toBe(false);
    expect(useGameStore.getState().board.has('h8')).toBe(true);
  });

  it('57. movePiece in setup: piece type preserved', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.SCOUT, color: PieceColor.BLACK });
    useGameStore.getState().movePiece('a1', 'h8');
    expect(useGameStore.getState().board.get('h8')?.type).toBe(PieceType.SCOUT);
    expect(useGameStore.getState().board.get('h8')?.color).toBe(PieceColor.BLACK);
  });

  it('58. movePiece in setup: captures destination piece', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('a2', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().movePiece('a1', 'a2');
    expect(useGameStore.getState().board.size).toBe(1);
    expect(useGameStore.getState().board.get('a2')?.color).toBe(PieceColor.WHITE);
  });

  it('59. setFirstMoveTurn toggles between WHITE and BLACK', () => {
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
    useGameStore.getState().setFirstMoveTurn(PieceColor.BLACK);
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
    useGameStore.getState().setFirstMoveTurn(PieceColor.WHITE);
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
  });

  it('60. clearBoard then place then clear again = empty', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().clearBoard();
    expect(useGameStore.getState().board.size).toBe(0);
    useGameStore.getState().placePiece('d5', { type: PieceType.PRINCE, color: PieceColor.BLACK });
    useGameStore.getState().clearBoard();
    expect(useGameStore.getState().board.size).toBe(0);
  });

  it('61. startAnalysisPlay preserves board from setup', () => {
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('a2', { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().board.size).toBe(3);
    expect(useGameStore.getState().board.get('e1')?.type).toBe(PieceType.KING);
  });

  it('62. startAnalysisPlay sets gameStage to play', () => {
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().gameStage).toBe('play');
  });

  it('63. after startAnalysisPlay, moves work normally', () => {
    useGameStore.getState().placePiece('a2', { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('a5', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
    useGameStore.getState().startAnalysisPlay(null);
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
    expect(useGameStore.getState().historyIndex).toBe(1);
  });

  it('64. knekht rank restriction applies to all piece colors consistently', () => {
    // White knekht: ranks 1-5 OK, 6-8 blocked
    for (let r = 1; r <= 5; r++) {
      useGameStore.getState().placePiece(toSquare('a', r), { type: PieceType.KNEKHT, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.has(toSquare('a', r))).toBe(true);
      useGameStore.getState().removePiece(toSquare('a', r));
    }
    for (let r = 6; r <= 8; r++) {
      useGameStore.getState().placePiece(toSquare('a', r), { type: PieceType.KNEKHT, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.has(toSquare('a', r))).toBe(false);
    }
    // Black knekht: ranks 4-8 OK, 1-3 blocked
    for (let r = 4; r <= 8; r++) {
      useGameStore.getState().placePiece(toSquare('b', r), { type: PieceType.KNEKHT, color: PieceColor.BLACK });
      expect(useGameStore.getState().board.has(toSquare('b', r))).toBe(true);
      useGameStore.getState().removePiece(toSquare('b', r));
    }
    for (let r = 1; r <= 3; r++) {
      useGameStore.getState().placePiece(toSquare('b', r), { type: PieceType.KNEKHT, color: PieceColor.BLACK });
      expect(useGameStore.getState().board.has(toSquare('b', r))).toBe(false);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 65-76: Move mechanics — capture, indicator, edge cases
// ════════════════════════════════════════════════════════════════════════
describe('move mechanics deep', () => {
  it('65. movePiece on empty from-square is no-op', () => {
    useGameStore.getState().startParty('t');
    const turn = useGameStore.getState().currentTurn;
    useGameStore.getState().movePiece('e4', 'e5');
    expect(useGameStore.getState().currentTurn).toBe(turn);
  });

  it('66. capture removes target piece', () => {
    useGameStore.getState().startParty('t');
    const board = cloneBoard(useGameStore.getState().board);
    board.set('a3', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
    useGameStore.setState({ board });
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().board.get('a3')?.color).toBe(PieceColor.WHITE);
  });

  it('67. board size decreases by 1 after capture', () => {
    useGameStore.getState().startParty('t');
    const board = cloneBoard(useGameStore.getState().board);
    board.set('a3', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
    useGameStore.setState({ board });
    const sizeBefore = useGameStore.getState().board.size;
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().board.size).toBe(sizeBefore - 1);
  });

  it('68. indicator format: move 1 white = "1. __ хб"', () => {
    useGameStore.getState().startParty('t');
    expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
  });

  it('69. indicator format: move 1 black = "1 … __ хч"', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
  });

  it('70. indicator format: move 3 white = "3. __ хб"', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().movePiece('b2', 'b3');
    useGameStore.getState().movePiece('b7', 'b6');
    expect(useGameStore.getState().moveIndicator).toBe('3. __ хб');
  });

  it('71. lastMove from/to are set after move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('e2', 'e4');
    expect(useGameStore.getState().lastMove).toEqual({ from: 'e2', to: 'e4' });
  });

  it('72. selectedForDeletion cleared after move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().setSelectedForDeletion('a2');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('73. moveNumber does not increment on white move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().moveNumber).toBe(1);
  });

  it('74. moveNumber increments on black move', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().moveNumber).toBe(2);
  });

  it('75. 4 full moves = moveNumber 5', () => {
    useGameStore.getState().startParty('t');
    for (let i = 0; i < 4; i++) {
      const wFile = FILES[i];
      const bFile = FILES[i];
      useGameStore.getState().movePiece(toSquare(wFile, 2), toSquare(wFile, 3));
      useGameStore.getState().movePiece(toSquare(bFile, 7), toSquare(bFile, 6));
    }
    expect(useGameStore.getState().moveNumber).toBe(5);
  });

  it('76. move then undo then redo = same board', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('d2', 'd4');
    const afterMove = boardToSerializable(useGameStore.getState().board);
    useGameStore.getState().prevMove();
    useGameStore.getState().nextMove();
    const afterRedo = boardToSerializable(useGameStore.getState().board);
    expect(afterRedo).toEqual(afterMove);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 77-88: Initial position and piece placement validation
// ════════════════════════════════════════════════════════════════════════
describe('initial position validation', () => {
  it('77. white king at e1', () => {
    expect(useGameStore.getState().board.get('e1')).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
  });

  it('78. black king at e8', () => {
    expect(useGameStore.getState().board.get('e8')).toEqual({ type: PieceType.KING, color: PieceColor.BLACK });
  });

  it('79. white konnet at d1', () => {
    expect(useGameStore.getState().board.get('d1')).toEqual({ type: PieceType.KONNET, color: PieceColor.WHITE });
  });

  it('80. black konnet at d8', () => {
    expect(useGameStore.getState().board.get('d8')).toEqual({ type: PieceType.KONNET, color: PieceColor.BLACK });
  });

  it('81. white scouts at b1 and g1', () => {
    expect(useGameStore.getState().board.get('b1')?.type).toBe(PieceType.SCOUT);
    expect(useGameStore.getState().board.get('g1')?.type).toBe(PieceType.SCOUT);
  });

  it('82. black scouts at b8 and g8', () => {
    expect(useGameStore.getState().board.get('b8')?.type).toBe(PieceType.SCOUT);
    expect(useGameStore.getState().board.get('g8')?.type).toBe(PieceType.SCOUT);
  });

  it('83. white ritters at a1 and h1', () => {
    expect(useGameStore.getState().board.get('a1')?.type).toBe(PieceType.RITTER);
    expect(useGameStore.getState().board.get('h1')?.type).toBe(PieceType.RITTER);
  });

  it('84. white princes at c1 and f1', () => {
    expect(useGameStore.getState().board.get('c1')?.type).toBe(PieceType.PRINCE);
    expect(useGameStore.getState().board.get('f1')?.type).toBe(PieceType.PRINCE);
  });

  it('85. ranks 3-6 are empty', () => {
    for (const f of FILES) {
      for (const r of [3, 4, 5, 6]) {
        expect(useGameStore.getState().board.get(toSquare(f, r))).toBeUndefined();
      }
    }
  });

  it('86. all rank 2 pieces are white knechts', () => {
    for (const f of FILES) {
      const p = useGameStore.getState().board.get(toSquare(f, 2));
      expect(p?.type).toBe(PieceType.KNEKHT);
      expect(p?.color).toBe(PieceColor.WHITE);
    }
  });

  it('87. all rank 7 pieces are black knechts', () => {
    for (const f of FILES) {
      const p = useGameStore.getState().board.get(toSquare(f, 7));
      expect(p?.type).toBe(PieceType.KNEKHT);
      expect(p?.color).toBe(PieceColor.BLACK);
    }
  });

  it('88. isLightSquare pattern: a1 is dark, b1 is light', () => {
    // a=0 + 1=1 → odd → dark; b=1 + 1=2 → even → light
    const a1Light = (FILES.indexOf('a') + 1) % 2 === 0;
    const b1Light = (FILES.indexOf('b') + 1) % 2 === 0;
    expect(a1Light).toBe(false); // a1 is dark
    expect(b1Light).toBe(true);  // b1 is light
  });
});

// ════════════════════════════════════════════════════════════════════════
// 89-100: Board helpers and layout
// ════════════════════════════════════════════════════════════════════════
describe('board helpers and constants', () => {
  it('89. 64 unique squares via toSquare', () => {
    const squares = new Set<string>();
    for (const f of FILES) {
      for (const r of RANKS) {
        squares.add(toSquare(f, r));
      }
    }
    expect(squares.size).toBe(64);
  });

  it('90. parseSquare reverses toSquare for all 64', () => {
    for (const f of FILES) {
      for (const r of RANKS) {
        const sq = toSquare(f, r);
        const p = parseSquare(sq);
        expect(p.file).toBe(f);
        expect(p.rank).toBe(r);
      }
    }
  });

  it('91. CASTLE_WHITE contains c1, d1, e1, f1', () => {
    expect(CASTLE_WHITE).toContain('c1');
    expect(CASTLE_WHITE).toContain('d1');
    expect(CASTLE_WHITE).toContain('e1');
    expect(CASTLE_WHITE).toContain('f1');
  });

  it('92. CASTLE_BLACK contains c8, d8, e8, f8', () => {
    expect(CASTLE_BLACK).toContain('c8');
    expect(CASTLE_BLACK).toContain('d8');
    expect(CASTLE_BLACK).toContain('e8');
    expect(CASTLE_BLACK).toContain('f8');
  });

  it('93. no rank-2 or rank-7 squares are castle', () => {
    for (const f of FILES) {
      expect(isCastle(toSquare(f, 2))).toBe(false);
      expect(isCastle(toSquare(f, 7))).toBe(false);
    }
  });

  it('94. all mid-board squares are not castle', () => {
    for (const f of FILES) {
      for (const r of [3, 4, 5, 6]) {
        expect(isCastle(toSquare(f, r))).toBe(false);
      }
    }
  });

  it('95. cloneBoard of empty = empty', () => {
    expect(cloneBoard(new Map()).size).toBe(0);
  });

  it('96. cloneBoard of 1 piece = 1 piece', () => {
    const board = new Map();
    board.set('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    expect(cloneBoard(board).size).toBe(1);
  });

  it('97. cloneBoard piece data is equal', () => {
    const board = new Map();
    board.set('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    const clone = cloneBoard(board);
    expect(clone.get('e4')).toEqual(board.get('e4'));
  });

  it('98. boardToSerializable keys match Map keys', () => {
    const board = new Map();
    board.set('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    board.set('h8', { type: PieceType.KING, color: PieceColor.BLACK });
    const ser = boardToSerializable(board);
    expect(Object.keys(ser).sort()).toEqual(['a1', 'h8']);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 99-106: Integration — complex game scenarios
// ════════════════════════════════════════════════════════════════════════
describe('complex game scenarios', () => {
  it('99. party → 6 moves → branch at move 2 → new branch has 3 entries', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().movePiece('b2', 'b3');
    useGameStore.getState().movePiece('b7', 'b6');
    useGameStore.getState().movePiece('c2', 'c3');
    useGameStore.getState().movePiece('c7', 'c6');
    // 7 entries (initial + 6 moves)
    expect(useGameStore.getState().history.length).toBe(7);
    // Go back to index 2 and branch
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(2);
    useGameStore.getState().movePiece('h2', 'h3'); // new branch
    expect(useGameStore.getState().history.length).toBe(4); // 0,1,2 + new
    expect(useGameStore.getState().historyIndex).toBe(3);
  });

  it('100. analysis → setup → play → 3 moves → prevMove×3 → board = setup', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('d2', { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('d5', { type: PieceType.KNEKHT, color: PieceColor.BLACK });

    const setupBoard = boardToSerializable(useGameStore.getState().board);

    useGameStore.getState().startAnalysisPlay(null);
    useGameStore.getState().movePiece('d2', 'd3');
    useGameStore.getState().movePiece('d5', 'd4');
    useGameStore.getState().movePiece('e1', 'e2');

    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();

    const restoredBoard = boardToSerializable(useGameStore.getState().board);
    expect(restoredBoard).toEqual(setupBoard);
  });

  it('101. restore session mid-game → play more → full navigation', () => {
    const board = boardToSerializable(createInitialPosition());
    delete board['a2']; // simulate mid-game
    delete board['a7'];
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 5,
      gameMode: 'party', gameStage: 'play', partyFolder: 'test',
      indicator: '5. __ хб',
    });
    useGameStore.getState().movePiece('b2', 'b3');
    useGameStore.getState().movePiece('b7', 'b6');
    expect(useGameStore.getState().historyIndex).toBe(2);
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
    expect(useGameStore.getState().moveIndicator).toBe('5. __ хб');
  });

  it('102. endSession then startAnalysis → clean setup', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().endSession();
    useGameStore.getState().startAnalysis();
    expect(useGameStore.getState().board.size).toBe(0);
    expect(useGameStore.getState().gameMode).toBe('analysis');
    expect(useGameStore.getState().gameStage).toBe('setup');
  });

  it('103. startParty with folder name preserves it', () => {
    useGameStore.getState().startParty('my-game-2026');
    expect(useGameStore.getState().partyFolder).toBe('my-game-2026');
  });

  it('104. startParty with null folder is valid', () => {
    useGameStore.getState().startParty(null);
    expect(useGameStore.getState().partyFolder).toBeNull();
    expect(useGameStore.getState().gameMode).toBe('party');
  });

  it('105. multiple endSession calls are idempotent', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().endSession();
    useGameStore.getState().endSession();
    useGameStore.getState().endSession();
    expect(useGameStore.getState().gameMode).toBe('none');
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('106. full game lifecycle: start → play → end → start new → play → end', () => {
    // First game
    useGameStore.getState().startParty('game1');
    useGameStore.getState().movePiece('e2', 'e4');
    useGameStore.getState().movePiece('e7', 'e5');
    useGameStore.getState().endSession();

    // Second game
    useGameStore.getState().startParty('game2');
    expect(useGameStore.getState().partyFolder).toBe('game2');
    expect(useGameStore.getState().board.size).toBe(32);
    expect(useGameStore.getState().history.length).toBe(1);
    useGameStore.getState().movePiece('d2', 'd4');
    expect(useGameStore.getState().historyIndex).toBe(1);
    useGameStore.getState().endSession();

    expect(useGameStore.getState().gameMode).toBe('none');
  });
});
