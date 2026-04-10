import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { PieceType, PieceColor } from '../logic/pieces';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.getState().setInitialPosition();
  });

  describe('initial state', () => {
    it('starts with 32 pieces', () => {
      expect(useGameStore.getState().board.size).toBe(32);
    });

    it('starts with white turn', () => {
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
    });

    it('starts in no game mode', () => {
      expect(useGameStore.getState().gameMode).toBe('none');
      expect(useGameStore.getState().gameStage).toBe('start');
    });

    it('view mode is start', () => {
      const { gameMode, gameStage } = useGameStore.getState();
      expect(getViewMode({ gameMode, gameStage })).toBe('start');
    });
  });

  describe('movePiece', () => {
    it('moves piece and alternates turn', () => {
      const store = useGameStore.getState();
      // Start a party first so moves work
      store.startParty('test');

      useGameStore.getState().movePiece('a2', 'a3');
      const state = useGameStore.getState();
      expect(state.board.get('a2')).toBeUndefined();
      expect(state.board.get('a3')).toEqual({ type: PieceType.KNEKHT, color: PieceColor.WHITE });
      expect(state.currentTurn).toBe(PieceColor.BLACK);
    });

    it('increments move number after black moves', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3'); // white
      useGameStore.getState().movePiece('a7', 'a6'); // black
      expect(useGameStore.getState().moveNumber).toBe(2);
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
    });

    it('captures enemy piece', () => {
      useGameStore.getState().startParty('test');
      // Place enemy piece manually for capture test
      const board = new Map(useGameStore.getState().board);
      board.set('a3', { type: PieceType.KNEKHT, color: PieceColor.BLACK });
      useGameStore.setState({ board });

      useGameStore.getState().movePiece('a2', 'a3');
      const state = useGameStore.getState();
      expect(state.board.get('a3')).toEqual({ type: PieceType.KNEKHT, color: PieceColor.WHITE });
      expect(state.board.get('a2')).toBeUndefined();
    });

    it('records move in history', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().history.length).toBe(1);
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().history.length).toBe(2);
    });
  });

  describe('startParty', () => {
    it('sets game mode to party play', () => {
      useGameStore.getState().startParty('test-folder');
      const state = useGameStore.getState();
      expect(state.gameMode).toBe('party');
      expect(state.gameStage).toBe('play');
      expect(state.partyFolder).toBe('test-folder');
      expect(state.moveIndicator).toBe('1. __ хб');
    });

    it('view mode is basic', () => {
      useGameStore.getState().startParty('test');
      const { gameMode, gameStage } = useGameStore.getState();
      expect(getViewMode({ gameMode, gameStage })).toBe('basic');
    });
  });

  describe('startAnalysis', () => {
    it('sets game mode to analysis setup with empty board', () => {
      useGameStore.getState().startAnalysis();
      const state = useGameStore.getState();
      expect(state.gameMode).toBe('analysis');
      expect(state.gameStage).toBe('setup');
      expect(state.board.size).toBe(0);
    });

    it('view mode is extended', () => {
      useGameStore.getState().startAnalysis();
      const { gameMode, gameStage } = useGameStore.getState();
      expect(getViewMode({ gameMode, gameStage })).toBe('extended');
    });
  });

  describe('startAnalysisPlay', () => {
    it('transitions from setup to play', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
      useGameStore.getState().startAnalysisPlay('analysis-folder');
      const state = useGameStore.getState();
      expect(state.gameStage).toBe('play');
      expect(state.partyFolder).toBe('analysis-folder');
      expect(state.board.get('e1')).toBeDefined();
    });
  });

  describe('endSession', () => {
    it('resets to start state with initial position', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().endSession();
      const state = useGameStore.getState();
      expect(state.gameMode).toBe('none');
      expect(state.gameStage).toBe('start');
      expect(state.board.size).toBe(32);
      expect(state.moveIndicator).toBe('');
    });
  });

  describe('history navigation', () => {
    it('prevMove goes back', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      const state = useGameStore.getState();
      expect(state.board.get('a2')).toBeDefined(); // piece is back
      expect(state.board.get('a3')).toBeUndefined();
    });

    it('nextMove goes forward', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      useGameStore.getState().nextMove();
      const state = useGameStore.getState();
      expect(state.board.get('a3')).toBeDefined();
      expect(state.board.get('a2')).toBeUndefined();
    });

    it('new move after going back truncates future', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().history.length).toBe(3);

      useGameStore.getState().prevMove(); // go back to after white's move
      useGameStore.getState().movePiece('h7', 'h6'); // new black move
      expect(useGameStore.getState().history.length).toBe(3); // old future truncated
    });
  });

  describe('toggleReverse', () => {
    it('toggles reversed state', () => {
      expect(useGameStore.getState().reversed).toBe(false);
      useGameStore.getState().toggleReverse();
      expect(useGameStore.getState().reversed).toBe(true);
      useGameStore.getState().toggleReverse();
      expect(useGameStore.getState().reversed).toBe(false);
    });
  });

  describe('clearBoard', () => {
    it('removes all pieces', () => {
      useGameStore.getState().clearBoard();
      expect(useGameStore.getState().board.size).toBe(0);
    });
  });

  describe('placePiece / removePiece', () => {
    it('places a piece on empty square', () => {
      useGameStore.getState().placePiece('d4', { type: PieceType.KING, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.get('d4')).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
    });

    it('removes a piece', () => {
      useGameStore.getState().removePiece('a1');
      expect(useGameStore.getState().board.get('a1')).toBeUndefined();
    });
  });

  describe('move indicator format', () => {
    it('shows correct format for white turn', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
    });

    it('shows correct format for black turn', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
    });

    it('increments move number correctly', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3'); // white
      useGameStore.getState().movePiece('a7', 'a6'); // black
      expect(useGameStore.getState().moveIndicator).toBe('2. __ хб');
    });
  });

  describe('setFirstMoveTurn', () => {
    it('changes first move to black in analysis', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().setFirstMoveTurn(PieceColor.BLACK);
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
    });

    it('changes first move to white', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().setFirstMoveTurn(PieceColor.BLACK);
      useGameStore.getState().setFirstMoveTurn(PieceColor.WHITE);
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
    });
  });

  describe('move mechanics - detailed', () => {
    it('movePiece with no piece on from square is a no-op', () => {
      useGameStore.getState().startParty('test');
      const boardBefore = useGameStore.getState().board.size;
      useGameStore.getState().movePiece('e4', 'e5'); // nothing on e4
      expect(useGameStore.getState().board.size).toBe(boardBefore);
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE); // turn not changed
    });

    it('lastMove is updated after movePiece', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      const state = useGameStore.getState();
      expect(state.lastMove.from).toBe('a2');
      expect(state.lastMove.to).toBe('a3');
    });

    it('selectedForDeletion is cleared after movePiece', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().setSelectedForDeletion('a2');
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('white move does not increment moveNumber', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().moveNumber).toBe(1);
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().moveNumber).toBe(1);
    });

    it('black move increments moveNumber', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().moveNumber).toBe(2);
    });

    it('three full moves reach moveNumber 4', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().movePiece('b2', 'b3');
      useGameStore.getState().movePiece('b7', 'b6');
      useGameStore.getState().movePiece('c2', 'c3');
      useGameStore.getState().movePiece('c7', 'c6');
      expect(useGameStore.getState().moveNumber).toBe(4);
    });

    it('turn alternates correctly across multiple moves', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
      useGameStore.getState().movePiece('b2', 'b3');
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
    });
  });

  describe('history tracking - detailed', () => {
    it('startParty creates initial history entry', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().history).toHaveLength(1);
      expect(useGameStore.getState().historyIndex).toBe(0);
    });

    it('each move adds a history entry', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().history).toHaveLength(2);
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().history).toHaveLength(3);
    });

    it('historyIndex tracks current position', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().historyIndex).toBe(0);
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().historyIndex).toBe(1);
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().historyIndex).toBe(2);
    });

    it('history entries store board state correctly', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      const entry = useGameStore.getState().history[1];
      expect(entry.board['a3']).toBeDefined();
      expect(entry.board['a2']).toBeUndefined();
    });

    it('history entries store moveNumber and currentTurn', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      const entry = useGameStore.getState().history[1];
      expect(entry.moveNumber).toBe(1);
      expect(entry.currentTurn).toBe(PieceColor.BLACK);
    });
  });

  describe('history navigation - detailed', () => {
    it('prevMove at index 0 is a no-op', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().historyIndex).toBe(0);
    });

    it('nextMove at last index is a no-op', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().nextMove();
      expect(useGameStore.getState().historyIndex).toBe(1);
    });

    it('prevMove restores board state', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().board.get('a2')).toBeDefined();
      expect(useGameStore.getState().board.get('a3')).toBeUndefined();
    });

    it('prevMove restores currentTurn', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.BLACK);
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().currentTurn).toBe(PieceColor.WHITE);
    });

    it('prevMove restores moveNumber', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().moveNumber).toBe(2);
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().moveNumber).toBe(1);
    });

    it('prevMove clears lastMove', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
    });

    it('prevMove clears selectedForDeletion', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().setSelectedForDeletion('b2');
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('nextMove restores board state', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      useGameStore.getState().nextMove();
      expect(useGameStore.getState().board.get('a3')).toBeDefined();
      expect(useGameStore.getState().board.get('a2')).toBeUndefined();
    });

    it('nextMove restores lastMove from history (#4)', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().prevMove();
      useGameStore.getState().nextMove();
      expect(useGameStore.getState().lastMove).toEqual({ from: 'a2', to: 'a3' });
    });

    it('multiple prevMove steps back correctly', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().movePiece('b2', 'b3');
      expect(useGameStore.getState().historyIndex).toBe(3);
      useGameStore.getState().prevMove();
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().historyIndex).toBe(1);
    });

    it('history truncation removes future entries', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().movePiece('b2', 'b3');
      expect(useGameStore.getState().history).toHaveLength(4);
      useGameStore.getState().prevMove();
      useGameStore.getState().prevMove();
      // Now at index 1, make a new move
      useGameStore.getState().movePiece('h7', 'h6');
      expect(useGameStore.getState().history).toHaveLength(3); // 0,1,new
    });

    it('prevMove multiple times then nextMove multiple times', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().prevMove();
      useGameStore.getState().prevMove();
      expect(useGameStore.getState().historyIndex).toBe(0);
      useGameStore.getState().nextMove();
      useGameStore.getState().nextMove();
      expect(useGameStore.getState().historyIndex).toBe(2);
    });
  });

  describe('indicator format for various move numbers', () => {
    it('move 1 white: "1. __ хб"', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
    });

    it('move 1 black: "1 … __ хч"', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
    });

    it('move 2 white: "2. __ хб"', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      expect(useGameStore.getState().moveIndicator).toBe('2. __ хб');
    });

    it('move 2 black: "2 … __ хч"', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().movePiece('b2', 'b3');
      expect(useGameStore.getState().moveIndicator).toBe('2 … __ хч');
    });

    it('move 3 white: "3. __ хб"', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().movePiece('b2', 'b3');
      useGameStore.getState().movePiece('b7', 'b6');
      expect(useGameStore.getState().moveIndicator).toBe('3. __ хб');
    });

    it('move 5 white reached by 8 half-moves', () => {
      useGameStore.getState().startParty('test');
      const moves = [['a2','a3'],['a7','a6'],['b2','b3'],['b7','b6'],['c2','c3'],['c7','c6'],['d2','d3'],['d7','d6']];
      for (const [from, to] of moves) {
        useGameStore.getState().movePiece(from, to);
      }
      expect(useGameStore.getState().moveIndicator).toBe('5. __ хб');
      expect(useGameStore.getState().moveNumber).toBe(5);
    });

    it('move 10 white reached by 18 half-moves', () => {
      useGameStore.getState().startParty('test');
      // 9 full moves (18 half-moves): white moves files a-h + a again (rank 2->3, then 3->4)
      // black moves files a-h + a again (rank 7->6, then 6->5)
      const whiteMoves: [string, string][] = [
        ['a2','a3'],['b2','b3'],['c2','c3'],['d2','d3'],
        ['e2','e3'],['f2','f3'],['g2','g3'],['h2','h3'],
        ['a3','a4'],
      ];
      const blackMoves: [string, string][] = [
        ['a7','a6'],['b7','b6'],['c7','c6'],['d7','d6'],
        ['e7','e6'],['f7','f6'],['g7','g6'],['h7','h6'],
        ['a6','a5'],
      ];
      for (let i = 0; i < 9; i++) {
        useGameStore.getState().movePiece(whiteMoves[i][0], whiteMoves[i][1]);
        useGameStore.getState().movePiece(blackMoves[i][0], blackMoves[i][1]);
      }
      expect(useGameStore.getState().moveNumber).toBe(10);
      expect(useGameStore.getState().moveIndicator).toBe('10. __ хб');
    });
  });

  describe('party start/end', () => {
    it('startParty resets to initial position', () => {
      useGameStore.getState().clearBoard();
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().board.size).toBe(32);
    });

    it('startParty with null folder', () => {
      useGameStore.getState().startParty(null);
      expect(useGameStore.getState().partyFolder).toBeNull();
      expect(useGameStore.getState().gameMode).toBe('party');
    });

    it('startParty clears lastMove', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().lastMove).toEqual({ from: null, to: null });
    });

    it('startParty clears promotionPending', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().promotionPending).toBeNull();
    });

    it('startParty clears selectedForDeletion', () => {
      useGameStore.getState().startParty('test');
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('endSession resets everything', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().endSession();
      const s = useGameStore.getState();
      expect(s.gameMode).toBe('none');
      expect(s.gameStage).toBe('start');
      expect(s.board.size).toBe(32);
      expect(s.currentTurn).toBe(PieceColor.WHITE);
      expect(s.moveNumber).toBe(1);
      expect(s.history).toHaveLength(0);
      expect(s.historyIndex).toBe(-1);
      expect(s.moveIndicator).toBe('');
      expect(s.promotionPending).toBeNull();
      expect(s.selectedForDeletion).toBeNull();
      expect(s.partyFolder).toBeNull();
      expect(s.lastMove).toEqual({ from: null, to: null });
    });
  });

  describe('analysis mode', () => {
    it('startAnalysis gives empty board', () => {
      useGameStore.getState().startAnalysis();
      expect(useGameStore.getState().board.size).toBe(0);
    });

    it('startAnalysis sets setup stage', () => {
      useGameStore.getState().startAnalysis();
      expect(useGameStore.getState().gameStage).toBe('setup');
    });

    it('startAnalysis clears history', () => {
      useGameStore.getState().startAnalysis();
      expect(useGameStore.getState().history).toHaveLength(0);
      expect(useGameStore.getState().historyIndex).toBe(-1);
    });

    it('startAnalysis clears moveIndicator', () => {
      useGameStore.getState().startAnalysis();
      expect(useGameStore.getState().moveIndicator).toBe('');
    });

    it('startAnalysisPlay preserves board from setup', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().placePiece('e1', { type: PieceType.KING, color: PieceColor.WHITE });
      useGameStore.getState().placePiece('e8', { type: PieceType.KING, color: PieceColor.BLACK });
      useGameStore.getState().startAnalysisPlay('folder');
      expect(useGameStore.getState().board.get('e1')).toBeDefined();
      expect(useGameStore.getState().board.get('e8')).toBeDefined();
    });

    it('startAnalysisPlay sets play stage', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().startAnalysisPlay(null);
      expect(useGameStore.getState().gameStage).toBe('play');
    });

    it('startAnalysisPlay creates initial history entry', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().startAnalysisPlay(null);
      expect(useGameStore.getState().history).toHaveLength(1);
      expect(useGameStore.getState().historyIndex).toBe(0);
    });

    it('startAnalysisPlay sets moveIndicator', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().startAnalysisPlay(null);
      expect(useGameStore.getState().moveIndicator).toBe('1. __ хб');
    });

    it('startAnalysisPlay respects setFirstMoveTurn to black', () => {
      useGameStore.getState().startAnalysis();
      useGameStore.getState().setFirstMoveTurn(PieceColor.BLACK);
      useGameStore.getState().startAnalysisPlay(null);
      expect(useGameStore.getState().moveIndicator).toBe('1 … __ хч');
    });
  });

  describe('promotion pending', () => {
    it('setPromotionPending stores pending state', () => {
      const pending = {
        square: 'a8' as const,
        piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        options: [
          { type: PieceType.KONNET, color: PieceColor.WHITE },
          { type: PieceType.PRINCE, color: PieceColor.WHITE },
        ],
      };
      useGameStore.getState().setPromotionPending(pending);
      expect(useGameStore.getState().promotionPending).toEqual(pending);
    });

    it('setPromotionPending to null clears it', () => {
      useGameStore.getState().setPromotionPending({
        square: 'a8',
        piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        options: [],
      });
      useGameStore.getState().setPromotionPending(null);
      expect(useGameStore.getState().promotionPending).toBeNull();
    });

    it('completePromotion places chosen piece and clears pending', () => {
      useGameStore.getState().startParty('test');
      // Manually set up promotion scenario
      const board = new Map(useGameStore.getState().board);
      board.set('a8', { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
      useGameStore.setState({ board });
      useGameStore.getState().setPromotionPending({
        square: 'a8',
        piece: { type: PieceType.VER_KNEKHT, color: PieceColor.WHITE },
        options: [{ type: PieceType.KONNET, color: PieceColor.WHITE }],
      });
      useGameStore.getState().completePromotion({ type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.get('a8')).toEqual({ type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(useGameStore.getState().promotionPending).toBeNull();
    });

    it('completePromotion is no-op if no pending', () => {
      useGameStore.getState().startParty('test');
      const boardBefore = useGameStore.getState().board.size;
      useGameStore.getState().completePromotion({ type: PieceType.KONNET, color: PieceColor.WHITE });
      expect(useGameStore.getState().board.size).toBe(boardBefore);
    });

    it('completePromotion updates last history entry', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().setPromotionPending({
        square: 'a3',
        piece: { type: PieceType.KNEKHT, color: PieceColor.WHITE },
        options: [{ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE }],
      });
      useGameStore.getState().completePromotion({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
      const lastEntry = useGameStore.getState().history[useGameStore.getState().history.length - 1];
      expect(lastEntry.board['a3']).toEqual({ type: PieceType.VER_KNEKHT, color: PieceColor.WHITE });
    });
  });

  describe('board clearing and initial position', () => {
    it('clearBoard results in empty map', () => {
      useGameStore.getState().clearBoard();
      expect(useGameStore.getState().board.size).toBe(0);
    });

    it('clearBoard clears selectedForDeletion', () => {
      useGameStore.getState().setSelectedForDeletion('a1');
      useGameStore.getState().clearBoard();
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('setInitialPosition resets board to 32 pieces', () => {
      useGameStore.getState().clearBoard();
      useGameStore.getState().setInitialPosition();
      expect(useGameStore.getState().board.size).toBe(32);
    });

    it('setInitialPosition resets gameMode to none', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().setInitialPosition();
      expect(useGameStore.getState().gameMode).toBe('none');
    });

    it('setInitialPosition resets moveNumber to 1', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().movePiece('a7', 'a6');
      useGameStore.getState().setInitialPosition();
      expect(useGameStore.getState().moveNumber).toBe(1);
    });

    it('setInitialPosition clears history', () => {
      useGameStore.getState().startParty('test');
      useGameStore.getState().movePiece('a2', 'a3');
      useGameStore.getState().setInitialPosition();
      expect(useGameStore.getState().history).toHaveLength(0);
      expect(useGameStore.getState().historyIndex).toBe(-1);
    });
  });

  describe('toggles', () => {
    beforeEach(() => {
      // Ensure clean toggle state
      if (useGameStore.getState().reversed) useGameStore.getState().toggleReverse();
      if (useGameStore.getState().alwaysOnTop) useGameStore.getState().toggleAlwaysOnTop();
    });

    it('toggleReverse toggles from false to true', () => {
      expect(useGameStore.getState().reversed).toBe(false);
      useGameStore.getState().toggleReverse();
      expect(useGameStore.getState().reversed).toBe(true);
    });

    it('toggleReverse toggles back to false', () => {
      useGameStore.getState().toggleReverse();
      useGameStore.getState().toggleReverse();
      expect(useGameStore.getState().reversed).toBe(false);
    });

    it('toggleAlwaysOnTop toggles from false to true', () => {
      expect(useGameStore.getState().alwaysOnTop).toBe(false);
      useGameStore.getState().toggleAlwaysOnTop();
      expect(useGameStore.getState().alwaysOnTop).toBe(true);
    });

    it('toggleAlwaysOnTop toggles back to false', () => {
      useGameStore.getState().toggleAlwaysOnTop();
      useGameStore.getState().toggleAlwaysOnTop();
      expect(useGameStore.getState().alwaysOnTop).toBe(false);
    });

    it('toggleReverse three times ends on true', () => {
      useGameStore.getState().toggleReverse();
      useGameStore.getState().toggleReverse();
      useGameStore.getState().toggleReverse();
      expect(useGameStore.getState().reversed).toBe(true);
    });

    it('toggleAlwaysOnTop three times ends on true', () => {
      useGameStore.getState().toggleAlwaysOnTop();
      useGameStore.getState().toggleAlwaysOnTop();
      useGameStore.getState().toggleAlwaysOnTop();
      expect(useGameStore.getState().alwaysOnTop).toBe(true);
    });
  });

  describe('session restore', () => {
    it('restores board from serialized data', () => {
      const boardData = {
        e4: { type: PieceType.KING, color: PieceColor.WHITE } as const,
      };
      useGameStore.getState().restoreSession({
        board: boardData,
        currentTurn: PieceColor.BLACK,
        moveNumber: 5,
        gameMode: 'party',
        gameStage: 'play',
        partyFolder: 'restored-folder',
        indicator: '5 … __ хч',
      });
      const s = useGameStore.getState();
      expect(s.board.size).toBe(1);
      expect(s.board.get('e4')).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
      expect(s.currentTurn).toBe(PieceColor.BLACK);
      expect(s.moveNumber).toBe(5);
      expect(s.gameMode).toBe('party');
      expect(s.gameStage).toBe('play');
      expect(s.partyFolder).toBe('restored-folder');
      expect(s.moveIndicator).toBe('5 … __ хч');
    });

    it('restoreSession sets showIntro to false', () => {
      useGameStore.getState().restoreSession({
        board: {},
        currentTurn: PieceColor.WHITE,
        moveNumber: 1,
        gameMode: 'none',
        gameStage: 'start',
        partyFolder: null,
        indicator: '',
      });
      expect(useGameStore.getState().showIntro).toBe(false);
    });

    it('restoreSession sets savedSession to true', () => {
      useGameStore.getState().restoreSession({
        board: {},
        currentTurn: PieceColor.WHITE,
        moveNumber: 1,
        gameMode: 'none',
        gameStage: 'start',
        partyFolder: null,
        indicator: '',
      });
      expect(useGameStore.getState().savedSession).toBe(true);
    });
  });

  describe('selectedForDeletion and deleteSelectedPiece', () => {
    it('setSelectedForDeletion stores the square', () => {
      useGameStore.getState().setSelectedForDeletion('a1');
      expect(useGameStore.getState().selectedForDeletion).toBe('a1');
    });

    it('setSelectedForDeletion to null clears it', () => {
      useGameStore.getState().setSelectedForDeletion('a1');
      useGameStore.getState().setSelectedForDeletion(null);
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('deleteSelectedPiece removes the piece and clears selection', () => {
      useGameStore.getState().setSelectedForDeletion('a1');
      useGameStore.getState().deleteSelectedPiece();
      expect(useGameStore.getState().board.get('a1')).toBeUndefined();
      expect(useGameStore.getState().selectedForDeletion).toBeNull();
    });

    it('deleteSelectedPiece is no-op when nothing selected', () => {
      const sizeBefore = useGameStore.getState().board.size;
      useGameStore.getState().deleteSelectedPiece();
      expect(useGameStore.getState().board.size).toBe(sizeBefore);
    });
  });

  describe('intro and session flags', () => {
    it('setShowIntro changes showIntro', () => {
      useGameStore.getState().setShowIntro(false);
      expect(useGameStore.getState().showIntro).toBe(false);
      useGameStore.getState().setShowIntro(true);
      expect(useGameStore.getState().showIntro).toBe(true);
    });

    it('setIntroSkipped changes introSkipped', () => {
      useGameStore.getState().setIntroSkipped(true);
      expect(useGameStore.getState().introSkipped).toBe(true);
      useGameStore.getState().setIntroSkipped(false);
      expect(useGameStore.getState().introSkipped).toBe(false);
    });

    it('setSavedSession changes savedSession', () => {
      useGameStore.getState().setSavedSession(true);
      expect(useGameStore.getState().savedSession).toBe(true);
      useGameStore.getState().setSavedSession(false);
      expect(useGameStore.getState().savedSession).toBe(false);
    });
  });

  describe('getViewMode', () => {
    it('returns start for gameMode none', () => {
      expect(getViewMode({ gameMode: 'none', gameStage: 'start' })).toBe('start');
    });

    it('returns extended for analysis setup', () => {
      expect(getViewMode({ gameMode: 'analysis', gameStage: 'setup' })).toBe('extended');
    });

    it('returns basic for analysis play', () => {
      expect(getViewMode({ gameMode: 'analysis', gameStage: 'play' })).toBe('basic');
    });

    it('returns basic for party play', () => {
      expect(getViewMode({ gameMode: 'party', gameStage: 'play' })).toBe('basic');
    });

    it('returns basic for party start', () => {
      expect(getViewMode({ gameMode: 'party', gameStage: 'start' })).toBe('basic');
    });
  });

  describe('placePiece / removePiece - additional', () => {
    it('placePiece overwrites existing piece', () => {
      useGameStore.getState().placePiece('a1', { type: PieceType.KING, color: PieceColor.BLACK });
      expect(useGameStore.getState().board.get('a1')).toEqual({ type: PieceType.KING, color: PieceColor.BLACK });
    });

    it('removePiece on empty square is a no-op', () => {
      const sizeBefore = useGameStore.getState().board.size;
      useGameStore.getState().removePiece('e4');
      expect(useGameStore.getState().board.size).toBe(sizeBefore);
    });

    it('placePiece then removePiece leaves square empty', () => {
      useGameStore.getState().placePiece('e4', { type: PieceType.SCOUT, color: PieceColor.WHITE });
      useGameStore.getState().removePiece('e4');
      expect(useGameStore.getState().board.get('e4')).toBeUndefined();
    });
  });

  describe('setBoard', () => {
    it('replaces the entire board', () => {
      const newBoard = new Map();
      newBoard.set('d4', { type: PieceType.KING, color: PieceColor.WHITE });
      useGameStore.getState().setBoard(newBoard);
      expect(useGameStore.getState().board.size).toBe(1);
      expect(useGameStore.getState().board.get('d4')).toBeDefined();
    });
  });
});
