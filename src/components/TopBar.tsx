import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { createInitialPosition } from '../logic/pieces';

// Large white circle with thick dark border — per screenshot
const CIRCLE_BTN: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '2.5px solid #1a1a1a',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
  padding: 0,
};

const CIRCLE_FROZEN: React.CSSProperties = {
  ...CIRCLE_BTN,
  opacity: 0.4,
  cursor: 'default',
};

interface TopBarProps {
  onPartyClick: () => void;
  onAnalysisClick: () => void;
  onMinimize: () => void;
  onAlwaysOnTop: () => void;
  onClose: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onPartyClick, onAnalysisClick, onMinimize, onAlwaysOnTop, onClose }) => {
  const { gameMode, gameStage, alwaysOnTop } = useGameStore();
  const viewMode = getViewMode({ gameMode, gameStage });
  const promotionPending = useGameStore((s) => s.promotionPending);
  const setInitialPosition = useGameStore((s) => s.setInitialPosition);
  const setBoard = useGameStore((s) => s.setBoard);

  const isStart = viewMode === 'start';
  const isPartyActive = gameMode === 'party';
  const isAnalysisActive = gameMode === 'analysis';
  const isSetup = gameStage === 'setup';

  const initialPosFrozen = isStart;
  const partyFrozen = isPartyActive || (isAnalysisActive && isSetup);
  const analysisFrozen = isAnalysisActive;
  const minimizeFrozen = !!promotionPending;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      background: 'linear-gradient(180deg, #9dd0f0 0%, #6ab4e8 50%, #4a9ae0 100%)',
      minHeight: 54,
      flexShrink: 0,
    }}>
      {/* Нач. расстановка — chess piece icon per screenshot */}
      <button
        style={{
          ...(initialPosFrozen ? CIRCLE_FROZEN : CIRCLE_BTN),
          borderRadius: 8,
          width: 42,
          height: 42,
        }}
        disabled={initialPosFrozen}
        onClick={() => {
          if (initialPosFrozen) return;
          if (isSetup) {
            setBoard(createInitialPosition());
          } else {
            setInitialPosition();
          }
        }}
        title="Начальная расстановка"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M7 20h10v-2H7v2zm-1-4h12l-1.5-6h-9L7 16zm3.5-8h3V6h2V4h-2V2h-3v2h-2v2h2v2z"
            fill="#1a1a1a" stroke="none"/>
        </svg>
      </button>

      <div style={{ width: 1, height: 36, backgroundColor: 'rgba(0,0,0,0.15)' }} />

      {/* Партия — WHITE background, dark text, dark border per screenshot */}
      <button
        style={{
          height: 38,
          borderRadius: 6,
          border: '2.5px solid #1a1a1a',
          backgroundColor: partyFrozen ? '#e8e8e8' : '#ffffff',
          color: '#1a1a1a',
          cursor: partyFrozen ? 'default' : 'pointer',
          opacity: partyFrozen ? 0.5 : 1,
          padding: '0 22px',
          fontSize: 15,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isPartyActive ? '0 0 8px rgba(0,40,250,0.4), inset 0 0 6px rgba(0,100,200,0.2)' : 'none',
        }}
        disabled={partyFrozen}
        onClick={onPartyClick}
        title="Партия"
      >
        Партия
      </button>

      {/* Анализ — BLUE background, white text per screenshot */}
      <button
        style={{
          height: 38,
          borderRadius: 6,
          border: '2.5px solid #1a1a1a',
          backgroundColor: analysisFrozen ? '#8ab8d8' : '#0068c8',
          color: '#ffffff',
          cursor: analysisFrozen ? 'default' : 'pointer',
          opacity: analysisFrozen ? 0.5 : 1,
          padding: '0 22px',
          fontSize: 15,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isAnalysisActive ? '0 0 8px rgba(0,40,250,0.5), inset 0 0 6px rgba(255,255,255,0.2)' : 'none',
        }}
        disabled={analysisFrozen}
        onClick={onAnalysisClick}
        title="Анализ"
      >
        Анализ
      </button>

      <div style={{ flex: 1 }} />

      {/* Свернуть */}
      <button
        style={minimizeFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={minimizeFrozen}
        onClick={onMinimize}
        title="Свернуть"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <line x1="5" y1="14" x2="15" y2="14" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Поверх всех окон */}
      <button
        style={{
          ...CIRCLE_BTN,
          ...(alwaysOnTop ? { backgroundColor: '#d0e8ff', boxShadow: '0 0 6px rgba(0,40,250,0.4)' } : {}),
        }}
        onClick={onAlwaysOnTop}
        title="Поверх всех окон"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="3" y="3" width="9" height="9" rx="1" fill="none" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="7" y="7" width="9" height="9" rx="1" fill="#fff" stroke="#1a1a1a" strokeWidth="2" />
        </svg>
      </button>

      {/* Закрыть */}
      <button
        style={CIRCLE_BTN}
        onClick={onClose}
        title="Закрыть"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <line x1="5" y1="5" x2="15" y2="15" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="5" x2="5" y2="15" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopBar;
