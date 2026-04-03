import { boardToSerializable } from '../logic/pieces';
import type { Piece, BoardState } from '../logic/pieces';
import type { GameMode, GameStage } from '../stores/gameStore';
import { PieceColor } from '../logic/pieces';

const SESSION_KEY = 'chess-t1-session';
const INTRO_KEY = 'chess-t1-intro-skipped';

interface SavedSession {
  board: Record<string, Piece>;
  currentTurn: PieceColor;
  moveNumber: number;
  gameMode: GameMode;
  gameStage: GameStage;
  partyFolder: string | null;
  indicator: string;
}

export function saveSession(
  board: BoardState,
  currentTurn: PieceColor,
  moveNumber: number,
  gameMode: GameMode,
  gameStage: GameStage,
  partyFolder: string | null,
  indicator: string
) {
  const data: SavedSession = {
    board: boardToSerializable(board),
    currentTurn,
    moveNumber,
    gameMode,
    gameStage,
    partyFolder,
    indicator,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function setIntroSkipped(skipped: boolean) {
  localStorage.setItem(INTRO_KEY, skipped ? '1' : '0');
}

export function isIntroSkipped(): boolean {
  return localStorage.getItem(INTRO_KEY) === '1';
}
