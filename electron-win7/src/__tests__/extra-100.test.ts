/**
 * 100 additional tests covering edge cases, regressions, and integration scenarios.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, getViewMode } from '../stores/gameStore';
import {
  PieceType, PieceColor, FILES, RANKS,
  createInitialPosition, cloneBoard, toSquare, parseSquare,
  boardToSerializable, boardFromSerializable,
  isCastle, isWhiteCastle, isBlackCastle,
} from '../logic/pieces';
import { checkPromotion } from '../logic/promotion';
import { checkScoutCapture, BoardState } from '../logic/scout';

beforeEach(() => {
  useGameStore.getState().setInitialPosition();
});

// ════════════════════════════════════════════════════════════════════════
// 1-10: gameStore — endSession / setInitialPosition edge cases
// ════════════════════════════════════════════════════════════════════════
describe('endSession & setInitialPosition edge cases', () => {
  it('1. endSession after analysis setup resets everything', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().endSession();
    expect(useGameStore.getState().board.size).toBe(32);
    expect(useGameStore.getState().gameMode).toBe('none');
  });

  it('2. endSession clears partyFolder', () => {
    useGameStore.getState().startParty('my-folder');
    expect(useGameStore.getState().partyFolder).toBe('my-folder');
    useGameStore.getState().endSession();
    expect(useGameStore.getState().partyFolder).toBeNull();
  });

  it('3. endSession clears promotionPending', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().setPromotionPending({
      square: 'e8',
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [],
    });
    useGameStore.getState().endSession();
    expect(useGameStore.getState().promotionPending).toBeNull();
  });

  it('4. endSession resets lastMove to null', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().endSession();
    expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
  });

  it('5. endSession resets historyIndex to -1', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().endSession();
    expect(useGameStore.getState().historyIndex).toBe(-1);
  });

  it('6. setInitialPosition resets moveIndicator', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().setInitialPosition();
    expect(useGameStore.getState().moveIndicator).toBe('');
  });

  it('7. double endSession is safe', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().endSession();
    useGameStore.getState().endSession();
    expect(useGameStore.getState().gameMode).toBe('none');
  });

  it('8. endSession from never-started state is safe', () => {
    useGameStore.getState().endSession();
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('9. setInitialPosition after clearBoard restores 32 pieces', () => {
    useGameStore.getState().clearBoard();
    expect(useGameStore.getState().board.size).toBe(0);
    useGameStore.getState().setInitialPosition();
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('10. endSession resets selectedForDeletion', () => {
    useGameStore.getState().startAnalysis();
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('a1');
    useGameStore.getState().endSession();
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 11-20: History truncation and branching
// ════════════════════════════════════════════════════════════════════════
describe('history truncation and branching', () => {
  it('11. new move at index 0 creates 2 entries', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().prevMove();
    useGameStore.getState().prevMove();
    // Now at index 0, make a new move
    useGameStore.getState().movePiece('e2', 'e4');
    expect(useGameStore.getState().history.length).toBe(2);
    expect(useGameStore.getState().historyIndex).toBe(1);
  });

  it('12. history entry board is serialized snapshot', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    const entry = useGameStore.getState().history[1];
    expect(typeof entry.board).toBe('object');
    expect(entry.board['a3']).toBeDefined();
    expect(entry.board['a2']).toBeUndefined();
  });

  it('13. history preserves indicator for each entry', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().history[0].indicator).toBe('1. __ хб');
    expect(useGameStore.getState().history[1].indicator).toBe('1 … __ хч');
  });

  it('14. history preserves currentTurn for each entry', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().history[0].currentTurn).toBe(PieceColor.WHITE);
    expect(useGameStore.getState().history[1].currentTurn).toBe(PieceColor.BLACK);
    expect(useGameStore.getState().history[2].currentTurn).toBe(PieceColor.WHITE);
  });

  it('15. prevMove restores board correctly', () => {
    useGameStore.getState().startParty('t');
    const boardBefore = boardToSerializable(useGameStore.getState().board);
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().prevMove();
    const boardAfter = boardToSerializable(useGameStore.getState().board);
    expect(boardAfter['a2']).toEqual(boardBefore['a2']);
  });

  it('16. 10 moves creates 11 history entries', () => {
    useGameStore.getState().startParty('t');
    const moves = [
      ['a2','a3'], ['a7','a6'], ['b2','b3'], ['b7','b6'],
      ['c2','c3'], ['c7','c6'], ['d2','d3'], ['d7','d6'],
      ['e2','e3'], ['e7','e6'],
    ];
    for (const [f, t] of moves) {
      useGameStore.getState().movePiece(f, t);
    }
    expect(useGameStore.getState().history.length).toBe(11);
    expect(useGameStore.getState().historyIndex).toBe(10);
  });

  it('17. prevMove clears selectedForDeletion', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().setSelectedForDeletion('a3');
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('18. nextMove clears selectedForDeletion', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().prevMove();
    useGameStore.getState().setSelectedForDeletion('a2');
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('19. prevMove restores moveIndicator', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
  });

  it('20. nextMove restores moveIndicator', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().prevMove();
    useGameStore.getState().nextMove();
    expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 21-30: Analysis mode — setup specifics
// ════════════════════════════════════════════════════════════════════════
describe('analysis mode setup details', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it('21. startAnalysis sets empty board', () => {
    expect(useGameStore.getState().board.size).toBe(0);
  });

  it('22. placePiece adds piece to empty board', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.RITTER, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.size).toBe(1);
  });

  it('23. placePiece replaces existing piece on same square', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.RITTER, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.get('a1')?.type).toBe(PieceType.KING);
    expect(useGameStore.getState().board.size).toBe(1);
  });

  it('24. removePiece on empty square is safe', () => {
    useGameStore.getState().removePiece('e4');
    expect(useGameStore.getState().board.size).toBe(0);
  });

  it('25. clearBoard in analysis clears everything', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('h8', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().clearBoard();
    expect(useGameStore.getState().board.size).toBe(0);
  });

  it('26. clearBoard resets selectedForDeletion', () => {
    useGameStore.getState().placePiece('e4', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('e4');
    useGameStore.getState().clearBoard();
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('27. multiple pieces can be placed', () => {
    for (const file of FILES) {
      useGameStore.getState().placePiece(toSquare(file, 1), { type: PieceType.RITTER, color: PieceColor.WHITE });
    }
    expect(useGameStore.getState().board.size).toBe(8);
  });

  it('28. setFirstMoveTurn to BLACK then startAnalysisPlay preserves turn', () => {
    useGameStore.getState().setFirstMoveTurn(PieceColor.BLACK);
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
  });

  it('29. startAnalysisPlay sets moveNumber to 1', () => {
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().moveNumber).toBe(1);
  });

  it('30. startAnalysisPlay with null folder sets partyFolder to null', () => {
    useGameStore.getState().startAnalysisPlay(null);
    expect(useGameStore.getState().partyFolder).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// 31-40: Promotion — completePromotion
// ════════════════════════════════════════════════════════════════════════
describe('completePromotion', () => {
  it('31. completePromotion replaces piece on pending square', () => {
    useGameStore.getState().startParty('t');
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
    expect(useGameStore.getState().promotionPending).toBeNull();
  });

  it('32. completePromotion does nothing if no pending', () => {
    useGameStore.getState().startParty('t');
    const sizeBefore = useGameStore.getState().board.size;
    useGameStore.getState().completePromotion({ type: PieceType.KONNET, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.size).toBe(sizeBefore);
  });

  it('33. completePromotion updates last history entry', () => {
    useGameStore.getState().startParty('t');
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().setPromotionPending({
      square: 'a3',
      piece: { type: PieceType.KNEKHT, color: PieceColor.WHITE },
      options: [{ type: PieceType.RITTER, color: PieceColor.WHITE }],
    });
    useGameStore.getState().completePromotion({ type: PieceType.RITTER, color: PieceColor.WHITE });

    const lastEntry = useGameStore.getState().history[useGameStore.getState().history.length - 1];
    expect(lastEntry.board['a3'].type).toBe(PieceType.RITTER);
  });

  it('34. promotionPending can be set to null', () => {
    useGameStore.getState().setPromotionPending(null);
    expect(useGameStore.getState().promotionPending).toBeNull();
  });

  it('35. promotionPending stores square and options', () => {
    const pending = {
      square: 'c8' as any,
      piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
      options: [
        { type: PieceType.KONNET, color: PieceColor.WHITE },
        { type: PieceType.PRINCE, color: PieceColor.WHITE },
      ],
    };
    useGameStore.getState().setPromotionPending(pending);
    expect(useGameStore.getState().promotionPending?.square).toBe('c8');
    expect(useGameStore.getState().promotionPending?.options).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 36-45: getViewMode comprehensive
// ════════════════════════════════════════════════════════════════════════
describe('getViewMode', () => {
  it('36. none + start = start', () => {
    expect(getViewMode({ gameMode: 'none', gameStage: 'start' })).toBe('start');
  });

  it('37. party + play = basic', () => {
    expect(getViewMode({ gameMode: 'party', gameStage: 'play' })).toBe('basic');
  });

  it('38. analysis + setup = extended', () => {
    expect(getViewMode({ gameMode: 'analysis', gameStage: 'setup' })).toBe('extended');
  });

  it('39. analysis + play = basic', () => {
    expect(getViewMode({ gameMode: 'analysis', gameStage: 'play' })).toBe('basic');
  });

  it('40. none + play = start (still none mode)', () => {
    expect(getViewMode({ gameMode: 'none', gameStage: 'play' })).toBe('start');
  });

  it('41. party + start = basic (unusual but handled)', () => {
    expect(getViewMode({ gameMode: 'party', gameStage: 'start' })).toBe('basic');
  });

  it('42. party + setup = basic', () => {
    expect(getViewMode({ gameMode: 'party', gameStage: 'setup' })).toBe('basic');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 43-52: Move indicator format across many moves
// ════════════════════════════════════════════════════════════════════════
describe('move indicator progression', () => {
  beforeEach(() => {
    useGameStore.getState().startParty('t');
  });

  it('43. initial indicator is 1. __ хб', () => {
    expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
  });

  it('44. after 1st white move → 1 … __ хч', () => {
    useGameStore.getState().movePiece('a2', 'a3');
    expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
  });

  it('45. after 1st black move → 2. __ хб', () => {
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().moveIndicator).toBe('2. __ хб');
  });

  it('46. after 2nd white move → 2 … __ хч', () => {
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().movePiece('b2', 'b3');
    expect(useGameStore.getState().moveIndicator).toBe('2 … __ хч');
  });

  it('47. after 5 full moves → 6. __ хб', () => {
    const moves = [
      ['a2','a3'], ['a7','a6'],
      ['b2','b3'], ['b7','b6'],
      ['c2','c3'], ['c7','c6'],
      ['d2','d3'], ['d7','d6'],
      ['e2','e3'], ['e7','e6'],
    ];
    for (const [f, t] of moves) useGameStore.getState().movePiece(f, t);
    expect(useGameStore.getState().moveIndicator).toBe('6. __ хб');
  });

  it('48. indicator restored after prevMove', () => {
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 49-58: toggleAlwaysOnTop and toggleReverse
// ════════════════════════════════════════════════════════════════════════
describe('toggle flags', () => {
  it('49. alwaysOnTop default is false', () => {
    expect(useGameStore.getState().alwaysOnTop).toBe(false);
  });

  it('50. toggleAlwaysOnTop flips to true', () => {
    useGameStore.getState().toggleAlwaysOnTop();
    expect(useGameStore.getState().alwaysOnTop).toBe(true);
  });

  it('51. toggleAlwaysOnTop twice returns to original', () => {
    const before = useGameStore.getState().alwaysOnTop;
    useGameStore.getState().toggleAlwaysOnTop();
    useGameStore.getState().toggleAlwaysOnTop();
    expect(useGameStore.getState().alwaysOnTop).toBe(before);
  });

  it('52. reversed default is false', () => {
    expect(useGameStore.getState().reversed).toBe(false);
  });

  it('53. toggleReverse three times → true', () => {
    useGameStore.getState().toggleReverse();
    useGameStore.getState().toggleReverse();
    useGameStore.getState().toggleReverse();
    expect(useGameStore.getState().reversed).toBe(true);
  });

  it('54. toggles are independent of game mode', () => {
    useGameStore.getState().startParty('t');
    const revBefore = useGameStore.getState().reversed;
    const aotBefore = useGameStore.getState().alwaysOnTop;
    useGameStore.getState().toggleReverse();
    useGameStore.getState().toggleAlwaysOnTop();
    expect(useGameStore.getState().reversed).toBe(!revBefore);
    expect(useGameStore.getState().alwaysOnTop).toBe(!aotBefore);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 55-64: deleteSelectedPiece edge cases
// ════════════════════════════════════════════════════════════════════════
describe('deleteSelectedPiece', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it('55. deletes the selected piece', () => {
    useGameStore.getState().placePiece('d4', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('d4');
    useGameStore.getState().deleteSelectedPiece();
    expect(useGameStore.getState().board.has('d4')).toBe(false);
  });

  it('56. clears lastMove after deletion', () => {
    useGameStore.getState().placePiece('d4', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('d4');
    useGameStore.getState().deleteSelectedPiece();
    expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
  });

  it('57. does nothing when selectedForDeletion is null', () => {
    useGameStore.getState().placePiece('d4', { type: PieceType.PRINCE, color: PieceColor.WHITE });
    useGameStore.getState().deleteSelectedPiece();
    expect(useGameStore.getState().board.has('d4')).toBe(true);
  });

  it('58. deleting from square that has no piece still clears selection', () => {
    useGameStore.getState().setSelectedForDeletion('e5');
    useGameStore.getState().deleteSelectedPiece();
    expect(useGameStore.getState().selectedForDeletion).toBeNull();
  });

  it('59. delete then place on same square works', () => {
    useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().setSelectedForDeletion('a1');
    useGameStore.getState().deleteSelectedPiece();
    useGameStore.getState().placePiece('a1', { type: PieceType.RITTER, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.get('a1')?.type).toBe(PieceType.RITTER);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 60-69: restoreSession comprehensive
// ════════════════════════════════════════════════════════════════════════
describe('restoreSession comprehensive', () => {
  it('60. restores currentTurn correctly', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.BLACK, moveNumber: 3,
      gameMode: 'party', gameStage: 'play', partyFolder: 'saved',
      indicator: '3 … __ хч',
    });
    expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
  });

  it('61. restores moveNumber correctly', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 10,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '10. __ хб',
    });
    expect(useGameStore.getState().moveNumber).toBe(10);
  });

  it('62. restores gameMode and gameStage', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'analysis', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().gameMode).toBe('analysis');
    expect(useGameStore.getState().gameStage).toBe('play');
  });

  it('63. restores partyFolder', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: 'my-game',
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().partyFolder).toBe('my-game');
  });

  it('64. sets showIntro to false', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().showIntro).toBe(false);
  });

  it('65. sets savedSession to true', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().savedSession).toBe(true);
  });

  it('66. restores lastMove as null (initial)', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
  });

  it('67. board data round-trips through restore', () => {
    const original = createInitialPosition();
    original.delete('a2'); // remove a pawn
    const board = boardToSerializable(original);
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    expect(useGameStore.getState().board.size).toBe(31);
    expect(useGameStore.getState().board.has('a2')).toBe(false);
  });

  it('68. after restore, two moves bring historyIndex to 2', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a7', 'a6');
    expect(useGameStore.getState().historyIndex).toBe(2);
    expect(useGameStore.getState().history.length).toBe(3);
  });

  it('69. restore then prevMove×1 then nextMove×1 round-trips', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: null,
      indicator: '1. __ хб',
    });
    useGameStore.getState().movePiece('e2', 'e4');
    const afterMove = boardToSerializable(useGameStore.getState().board);
    useGameStore.getState().prevMove();
    useGameStore.getState().nextMove();
    const afterNav = boardToSerializable(useGameStore.getState().board);
    expect(afterNav['e4']).toEqual(afterMove['e4']);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 70-79: Knekht restrictions — boundary rank tests (all files)
// ════════════════════════════════════════════════════════════════════════
describe('knekht boundary ranks on all files', () => {
  beforeEach(() => {
    useGameStore.getState().startAnalysis();
  });

  it.each(FILES)('70-%s. white knekht blocked on rank 6 file %s', (file) => {
    useGameStore.getState().placePiece(toSquare(file, 6), { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    expect(useGameStore.getState().board.has(toSquare(file, 6))).toBe(false);
  });

  it.each(FILES)('78-%s. black knekht blocked on rank 3 file %s', (file) => {
    useGameStore.getState().placePiece(toSquare(file, 3), { type: PieceType.KNEKHT, color: PieceColor.BLACK });
    expect(useGameStore.getState().board.has(toSquare(file, 3))).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 80-89: Board serialization edge cases
// ════════════════════════════════════════════════════════════════════════
describe('board serialization edge cases', () => {
  it('80. serialize board with all piece types', () => {
    const board: BoardState = new Map();
    const types = [PieceType.KING, PieceType.KONNET, PieceType.PRINCE, PieceType.RITTER, PieceType.SCOUT, PieceType.KNEKHT, PieceType.VER_KNEKHT];
    types.forEach((t, i) => {
      board.set(toSquare(FILES[i], 1), { type: t, color: PieceColor.WHITE });
    });
    const ser = boardToSerializable(board);
    const restored = boardFromSerializable(ser);
    expect(restored.size).toBe(7);
    types.forEach((t, i) => {
      expect(restored.get(toSquare(FILES[i], 1))?.type).toBe(t);
    });
  });

  it('81. serialize preserves both colors', () => {
    const board: BoardState = new Map();
    board.set('a1', { type: PieceType.KING, color: PieceColor.WHITE });
    board.set('a8', { type: PieceType.KING, color: PieceColor.BLACK });
    const restored = boardFromSerializable(boardToSerializable(board));
    expect(restored.get('a1')?.color).toBe(PieceColor.WHITE);
    expect(restored.get('a8')?.color).toBe(PieceColor.BLACK);
  });

  it('82. serialize full board and restore has same size', () => {
    const board = createInitialPosition();
    const restored = boardFromSerializable(boardToSerializable(board));
    expect(restored.size).toBe(board.size);
  });

  it('83. cloneBoard produces independent maps', () => {
    const board = createInitialPosition();
    const c1 = cloneBoard(board);
    const c2 = cloneBoard(board);
    c1.delete('a1');
    c2.delete('h8');
    expect(board.has('a1')).toBe(true);
    expect(board.has('h8')).toBe(true);
    expect(c1.has('a1')).toBe(false);
    expect(c2.has('h8')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 84-89: Castle helper exhaustive
// ════════════════════════════════════════════════════════════════════════
describe('castle helpers exhaustive', () => {
  it('84. exactly 4 white castle squares', () => {
    let count = 0;
    for (const f of FILES) {
      for (const r of RANKS) {
        if (isWhiteCastle(toSquare(f, r))) count++;
      }
    }
    expect(count).toBe(4);
  });

  it('85. exactly 4 black castle squares', () => {
    let count = 0;
    for (const f of FILES) {
      for (const r of RANKS) {
        if (isBlackCastle(toSquare(f, r))) count++;
      }
    }
    expect(count).toBe(4);
  });

  it('86. exactly 8 total castle squares', () => {
    let count = 0;
    for (const f of FILES) {
      for (const r of RANKS) {
        if (isCastle(toSquare(f, r))) count++;
      }
    }
    expect(count).toBe(8);
  });

  it('87. isCastle = isWhiteCastle OR isBlackCastle for all squares', () => {
    for (const f of FILES) {
      for (const r of RANKS) {
        const sq = toSquare(f, r);
        expect(isCastle(sq)).toBe(isWhiteCastle(sq) || isBlackCastle(sq));
      }
    }
  });

  it('88. white and black castles never overlap', () => {
    for (const f of FILES) {
      for (const r of RANKS) {
        const sq = toSquare(f, r);
        if (isWhiteCastle(sq)) expect(isBlackCastle(sq)).toBe(false);
        if (isBlackCastle(sq)) expect(isWhiteCastle(sq)).toBe(false);
      }
    }
  });

  it('89. all castle squares are on rank 1 or 8', () => {
    for (const f of FILES) {
      for (const r of RANKS) {
        const sq = toSquare(f, r);
        if (isCastle(sq)) {
          expect(r === 1 || r === 8).toBe(true);
        }
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 90-95: Intro page state
// ════════════════════════════════════════════════════════════════════════
describe('intro page state management', () => {
  it('90. setShowIntro toggles showIntro', () => {
    useGameStore.getState().setShowIntro(true);
    expect(useGameStore.getState().showIntro).toBe(true);
    useGameStore.getState().setShowIntro(false);
    expect(useGameStore.getState().showIntro).toBe(false);
  });

  it('91. setShowIntro(false) hides intro', () => {
    useGameStore.getState().setShowIntro(false);
    expect(useGameStore.getState().showIntro).toBe(false);
  });

  it('92. introSkipped defaults to false', () => {
    expect(useGameStore.getState().introSkipped).toBe(false);
  });

  it('93. setIntroSkipped(true) persists', () => {
    useGameStore.getState().setIntroSkipped(true);
    expect(useGameStore.getState().introSkipped).toBe(true);
  });

  it('94. setSavedSession toggles', () => {
    useGameStore.getState().setSavedSession(false);
    expect(useGameStore.getState().savedSession).toBe(false);
    useGameStore.getState().setSavedSession(true);
    expect(useGameStore.getState().savedSession).toBe(true);
  });

  it('95. setSavedSession(true) persists', () => {
    useGameStore.getState().setSavedSession(true);
    expect(useGameStore.getState().savedSession).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// 96-100: Integration — complex multi-step scenarios
// ════════════════════════════════════════════════════════════════════════
describe('complex integration scenarios', () => {
  it('96. party → 8 moves → navigate to start → navigate to end → board matches', () => {
    useGameStore.getState().startParty('t');
    const moves = [
      ['a2','a3'], ['a7','a6'], ['b2','b3'], ['b7','b6'],
      ['c2','c3'], ['c7','c6'], ['d2','d3'], ['d7','d6'],
    ];
    for (const [f, t] of moves) useGameStore.getState().movePiece(f, t);

    const boardAtEnd = boardToSerializable(useGameStore.getState().board);

    // Navigate to start
    for (let i = 0; i < 8; i++) useGameStore.getState().prevMove();
    expect(useGameStore.getState().historyIndex).toBe(0);
    expect(useGameStore.getState().board.size).toBe(32); // initial position

    // Navigate back to end
    for (let i = 0; i < 8; i++) useGameStore.getState().nextMove();
    expect(useGameStore.getState().historyIndex).toBe(8);

    const boardReturned = boardToSerializable(useGameStore.getState().board);
    expect(boardReturned).toEqual(boardAtEnd);
  });

  it('97. analysis → setup full position → play → moves → history works', () => {
    useGameStore.getState().startAnalysis();

    // Set up a mini position
    useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });
    useGameStore.getState().placePiece('a2', { type: PieceType.KNEKHT, color: PieceColor.WHITE });
    useGameStore.getState().placePiece('a5', { type: PieceType.KNEKHT, color: PieceColor.BLACK });

    useGameStore.getState().startAnalysisPlay('test');
    expect(useGameStore.getState().board.size).toBe(4);

    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().movePiece('a5', 'a4');

    expect(useGameStore.getState().historyIndex).toBe(2);
    useGameStore.getState().prevMove();
    expect(useGameStore.getState().lastMove).toEqual({ from: 'a2', to: 'a3' });
  });

  it('98. restore → play → end session → start fresh party', () => {
    const board = boardToSerializable(createInitialPosition());
    useGameStore.getState().restoreSession({
      board, currentTurn: PieceColor.WHITE, moveNumber: 1,
      gameMode: 'party', gameStage: 'play', partyFolder: 'old',
      indicator: '1. __ хб',
    });
    useGameStore.getState().movePiece('a2', 'a3');
    useGameStore.getState().endSession();

    useGameStore.getState().startParty('new');
    expect(useGameStore.getState().partyFolder).toBe('new');
    expect(useGameStore.getState().history.length).toBe(1);
    expect(useGameStore.getState().board.size).toBe(32);
  });

  it('99. capture does not increase board size', () => {
    useGameStore.getState().startParty('t');
    const board = cloneBoard(useGameStore.getState().board);
    board.set('a3', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
    useGameStore.setState({ board });
    const sizeBefore = useGameStore.getState().board.size;

    useGameStore.getState().movePiece('a2', 'a3'); // capture
    expect(useGameStore.getState().board.size).toBe(sizeBefore - 1);
  });

  it('100. 64 squares can each hold a piece via toSquare/parseSquare roundtrip', () => {
    let count = 0;
    for (const f of FILES) {
      for (const r of RANKS) {
        const sq = toSquare(f, r);
        const parsed = parseSquare(sq);
        expect(parsed.file).toBe(f);
        expect(parsed.rank).toBe(r);
        count++;
      }
    }
    expect(count).toBe(64);
  });
});
