import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { createInitialPosition } from '../logic/pieces';

// Dark metallic 3D circle button (for window controls) — per mockup
const DARK_CIRCLE: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1.5px solid #333',
  background: 'linear-gradient(180deg, #808080 0%, #606060 40%, #484848 70%, #383838 100%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)',
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
      gap: 6,
      padding: '5px 8px',
      background: 'linear-gradient(180deg, #8ec8f0 0%, #5aace8 30%, #3a96e0 60%, #2a86d0 100%)',
      minHeight: 48,
      flexShrink: 0,
    }}>
      {/* Начальная расстановка — square button with 2x2 chess grid icon */}
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          border: '1.5px solid #333',
          backgroundColor: initialPosFrozen ? '#aaa' : '#e8e8e8',
          cursor: initialPosFrozen ? 'default' : 'pointer',
          opacity: initialPosFrozen ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="1" width="8" height="8" fill="#555" stroke="#333" strokeWidth="0.5"/>
          <rect x="9" y="1" width="8" height="8" fill="#fff" stroke="#333" strokeWidth="0.5"/>
          <rect x="1" y="9" width="8" height="8" fill="#fff" stroke="#333" strokeWidth="0.5"/>
          <rect x="9" y="9" width="8" height="8" fill="#555" stroke="#333" strokeWidth="0.5"/>
        </svg>
      </button>

      {/* Партия — blue rectangle button */}
      <button
        style={{
          height: 32,
          borderRadius: 3,
          border: '1px solid #1a5090',
          backgroundColor: partyFrozen ? '#7ab0d0' : '#3a90d0',
          color: '#ffffff',
          cursor: partyFrozen ? 'default' : 'pointer',
          opacity: partyFrozen ? 0.5 : 1,
          padding: '0 16px',
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isPartyActive ? '0 0 6px rgba(0,40,200,0.5)' : '0 1px 2px rgba(0,0,0,0.2)',
        }}
        disabled={partyFrozen}
        onClick={onPartyClick}
        title="Партия"
      >
        Партия
      </button>

      {/* Анализ — blue rectangle button */}
      <button
        style={{
          height: 32,
          borderRadius: 3,
          border: '1px solid #1a5090',
          backgroundColor: analysisFrozen ? '#7ab0d0' : '#3a90d0',
          color: '#ffffff',
          cursor: analysisFrozen ? 'default' : 'pointer',
          opacity: analysisFrozen ? 0.5 : 1,
          padding: '0 16px',
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isAnalysisActive ? '0 0 6px rgba(0,40,200,0.5)' : '0 1px 2px rgba(0,0,0,0.2)',
        }}
        disabled={analysisFrozen}
        onClick={onAnalysisClick}
        title="Анализ"
      >
        Анализ
      </button>

      <div style={{ flex: 1 }} />

      {/* 3 dark metallic circle buttons — per mockup */}
      {/* Свернуть */}
      <button
        style={{
          ...DARK_CIRCLE,
          opacity: minimizeFrozen ? 0.4 : 1,
          cursor: minimizeFrozen ? 'default' : 'pointer',
        }}
        disabled={minimizeFrozen}
        onClick={onMinimize}
        title="Свернуть"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <line x1="3" y1="10" x2="11" y2="10" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Поверх всех окон */}
      <button
        style={{
          ...DARK_CIRCLE,
          ...(alwaysOnTop ? {
            background: 'linear-gradient(180deg, #5090d0 0%, #3070b0 40%, #2060a0 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3), 0 0 6px rgba(0,80,200,0.4)',
          } : {}),
        }}
        onClick={onAlwaysOnTop}
        title="Поверх всех окон"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="1" y="1" width="6" height="6" fill="#888" stroke="#ccc" strokeWidth="0.8"/>
          <rect x="5" y="5" width="6" height="6" fill="#bbb" stroke="#ccc" strokeWidth="0.8"/>
        </svg>
      </button>

      {/* Закрыть */}
      <button
        style={DARK_CIRCLE}
        onClick={onClose}
        title="Закрыть"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <line x1="3" y1="3" x2="11" y2="11" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="11" y1="3" x2="3" y2="11" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopBar;
