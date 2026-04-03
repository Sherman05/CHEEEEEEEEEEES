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
  });
});
