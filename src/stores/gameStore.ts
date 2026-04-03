import { create } from 'zustand';
import {
  BoardState,
  Piece,
  PieceColor,
  Square,
  createInitialPosition,
  cloneBoard,
  boardToSerializable,
  boardFromSerializable,
} from '../logic/pieces';

export type GameMode = 'none' | 'party' | 'analysis';
export type GameStage = 'start' | 'play' | 'setup';
export type ViewMode = 'start' | 'basic' | 'extended';

interface HistoryEntry {
  board: Record<string, Piece>;
  moveNumber: number;
  currentTurn: PieceColor;
  indicator: string;
}

interface GameState {
  board: BoardState;
  currentTurn: PieceColor;
  moveNumber: number;
  gameMode: GameMode;
  gameStage: GameStage;
  reversed: boolean;
  alwaysOnTop: boolean;
  partyFolder: string | null;
  lastMove: { from: Square | null; to: Square | null };
  history: HistoryEntry[];
  historyIndex: number;
  promotionPending: { square: Square; piece: Piece; options: Piece[] } | null;
  selectedForDeletion: Square | null;
  moveIndicator: string;
  introSkipped: boolean;
  showIntro: boolean;
  savedSession: boolean;

  // Actions
  setBoard: (board: BoardState) => void;
  movePiece: (from: Square, to: Square) => void;
  removePiece: (sq: Square) => void;
  placePiece: (sq: Square, piece: Piece) => void;
  setInitialPosition: () => void;
  clearBoard: () => void;
  startParty: (folder: string | null) => void;
  startAnalysis: () => void;
  startAnalysisPlay: (folder: string | null) => void;
  endSession: () => void;
  toggleReverse: () => void;
  toggleAlwaysOnTop: () => void;
  prevMove: () => void;
  nextMove: () => void;
  setFirstMoveTurn: (color: PieceColor) => void;
  setPromotionPending: (p: GameState['promotionPending']) => void;
  completePromotion: (piece: Piece) => void;
  setSelectedForDeletion: (sq: Square | null) => void;
  deleteSelectedPiece: () => void;
  setShowIntro: (show: boolean) => void;
  setIntroSkipped: (skipped: boolean) => void;
  setSavedSession: (saved: boolean) => void;
  restoreSession: (data: { board: Record<string, Piece>; currentTurn: PieceColor; moveNumber: number; gameMode: GameMode; gameStage: GameStage; partyFolder: string | null; indicator: string }) => void;
}

function buildIndicator(moveNumber: number, turn: PieceColor): string {
  if (turn === PieceColor.WHITE) {
    return `${moveNumber}. __ хб`;
  } else {
    return `${moveNumber} … __ хч`;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createInitialPosition(),
  currentTurn: PieceColor.WHITE,
  moveNumber: 1,
  gameMode: 'none',
  gameStage: 'start',
  reversed: false,
  alwaysOnTop: false,
  partyFolder: null,
  lastMove: { from: null, to: null },
  history: [],
  historyIndex: -1,
  promotionPending: null,
  selectedForDeletion: null,
  moveIndicator: '',
  introSkipped: false,
  showIntro: true,
  savedSession: false,

  setBoard: (board) => set({ board }),

  movePiece: (from, to) => {
    const state = get();
    const board = cloneBoard(state.board);
    const piece = board.get(from);
    if (!piece) return;

    board.delete(from);
    board.set(to, piece);

    const nextTurn = state.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    const nextMoveNumber = nextTurn === PieceColor.WHITE ? state.moveNumber + 1 : state.moveNumber;
    const indicator = buildIndicator(nextMoveNumber, nextTurn);

    // Truncate future history if we went back
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      board: boardToSerializable(board),
      moveNumber: nextMoveNumber,
      currentTurn: nextTurn,
      indicator,
    });

    set({
      board,
      currentTurn: nextTurn,
      moveNumber: nextMoveNumber,
      lastMove: { from, to },
      history: newHistory,
      historyIndex: newHistory.length - 1,
      moveIndicator: indicator,
      selectedForDeletion: null,
    });
  },

  removePiece: (sq) => {
    const board = cloneBoard(get().board);
    board.delete(sq);
    set({ board });
  },

  placePiece: (sq, piece) => {
    const board = cloneBoard(get().board);
    board.set(sq, piece);
    set({ board });
  },

  setInitialPosition: () => {
    set({
      board: createInitialPosition(),
      gameMode: 'none',
      gameStage: 'start',
      currentTurn: PieceColor.WHITE,
      moveNumber: 1,
      lastMove: { from: null, to: null },
      history: [],
      historyIndex: -1,
      promotionPending: null,
      selectedForDeletion: null,
      moveIndicator: '',
      partyFolder: null,
    });
  },

  clearBoard: () => {
    set({ board: new Map(), selectedForDeletion: null });
  },

  startParty: (folder) => {
    const indicator = buildIndicator(1, PieceColor.WHITE);
    const board = createInitialPosition();
    const entry: HistoryEntry = {
      board: boardToSerializable(board),
      moveNumber: 1,
      currentTurn: PieceColor.WHITE,
      indicator,
    };
    set({
      board,
      gameMode: 'party',
      gameStage: 'play',
      currentTurn: PieceColor.WHITE,
      moveNumber: 1,
      partyFolder: folder,
      lastMove: { from: null, to: null },
      history: [entry],
      historyIndex: 0,
      moveIndicator: indicator,
      promotionPending: null,
      selectedForDeletion: null,
    });
  },

  startAnalysis: () => {
    set({
      board: new Map(),
      gameMode: 'analysis',
      gameStage: 'setup',
      currentTurn: PieceColor.WHITE,
      moveNumber: 1,
      lastMove: { from: null, to: null },
      history: [],
      historyIndex: -1,
      moveIndicator: '',
      promotionPending: null,
      selectedForDeletion: null,
      partyFolder: null,
    });
  },

  startAnalysisPlay: (folder) => {
    const state = get();
    const indicator = buildIndicator(1, state.currentTurn);
    const entry: HistoryEntry = {
      board: boardToSerializable(state.board),
      moveNumber: 1,
      currentTurn: state.currentTurn,
      indicator,
    };
    set({
      gameStage: 'play',
      partyFolder: folder,
      moveNumber: 1,
      history: [entry],
      historyIndex: 0,
      moveIndicator: indicator,
    });
  },

  endSession: () => {
    set({
      board: createInitialPosition(),
      gameMode: 'none',
      gameStage: 'start',
      currentTurn: PieceColor.WHITE,
      moveNumber: 1,
      lastMove: { from: null, to: null },
      history: [],
      historyIndex: -1,
      moveIndicator: '',
      promotionPending: null,
      selectedForDeletion: null,
      partyFolder: null,
    });
  },

  toggleReverse: () => set((s) => ({ reversed: !s.reversed })),
  toggleAlwaysOnTop: () => set((s) => ({ alwaysOnTop: !s.alwaysOnTop })),

  prevMove: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    set({
      board: boardFromSerializable(entry.board),
      currentTurn: entry.currentTurn,
      moveNumber: entry.moveNumber,
      historyIndex: newIndex,
      moveIndicator: entry.indicator,
      lastMove: { from: null, to: null },
      selectedForDeletion: null,
    });
  },

  nextMove: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    set({
      board: boardFromSerializable(entry.board),
      currentTurn: entry.currentTurn,
      moveNumber: entry.moveNumber,
      historyIndex: newIndex,
      moveIndicator: entry.indicator,
      lastMove: { from: null, to: null },
      selectedForDeletion: null,
    });
  },

  setFirstMoveTurn: (color) => set({ currentTurn: color }),

  setPromotionPending: (p) => set({ promotionPending: p }),

  completePromotion: (piece) => {
    const state = get();
    if (!state.promotionPending) return;
    const board = cloneBoard(state.board);
    board.set(state.promotionPending.square, piece);

    // Update history
    const newHistory = [...state.history];
    if (newHistory.length > 0) {
      newHistory[newHistory.length - 1] = {
        ...newHistory[newHistory.length - 1],
        board: boardToSerializable(board),
      };
    }

    set({
      board,
      promotionPending: null,
      history: newHistory,
    });
  },

  setSelectedForDeletion: (sq) => set({ selectedForDeletion: sq }),

  deleteSelectedPiece: () => {
    const state = get();
    if (!state.selectedForDeletion) return;
    const board = cloneBoard(state.board);
    board.delete(state.selectedForDeletion);
    set({ board, selectedForDeletion: null });
  },

  setShowIntro: (show) => set({ showIntro: show }),
  setIntroSkipped: (skipped) => set({ introSkipped: skipped }),
  setSavedSession: (saved) => set({ savedSession: saved }),

  restoreSession: (data) => {
    set({
      board: boardFromSerializable(data.board),
      currentTurn: data.currentTurn,
      moveNumber: data.moveNumber,
      gameMode: data.gameMode,
      gameStage: data.gameStage,
      partyFolder: data.partyFolder,
      moveIndicator: data.indicator,
      showIntro: false,
      savedSession: true,
    });
  },
}));

export function getViewMode(state: Pick<GameState, 'gameMode' | 'gameStage'>): ViewMode {
  if (state.gameMode === 'none') return 'start';
  if (state.gameMode === 'analysis' && state.gameStage === 'setup') return 'extended';
  return 'basic';
}
