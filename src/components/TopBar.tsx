import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { createInitialPosition } from '../logic/pieces';

// Metallic 3D circle button style (gradient + highlight + shadow)
const CIRCLE_BTN_3D: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: '1.5px solid #555',
  background: 'linear-gradient(180deg, #f0f0f0 0%, #d8d8d8 30%, #b0b0b0 70%, #909090 100%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.6)',
};

const CIRCLE_BTN_FROZEN: React.CSSProperties = {
  ...CIRCLE_BTN_3D,
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
      padding: '5px 10px',
      background: 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 20%, #c0c0c0 50%, #b0b0b0 80%, #a0a0a0 100%)',
      minHeight: 50,
      flexShrink: 0,
      borderBottom: '1px solid #888',
    }}>
      {/* Начальная расстановка — шахматная доска 2×2 */}
      <button
        style={{
          ...(initialPosFrozen ? CIRCLE_BTN_FROZEN : CIRCLE_BTN_3D),
          borderRadius: 6,
          width: 38,
          height: 38,
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
        {/* 2x2 chess board icon */}
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="1" y="1" width="9" height="9" fill="#333" stroke="#333" strokeWidth="0.5"/>
          <rect x="10" y="1" width="9" height="9" fill="#fff" stroke="#333" strokeWidth="0.5"/>
          <rect x="1" y="10" width="9" height="9" fill="#fff" stroke="#333" strokeWidth="0.5"/>
          <rect x="10" y="10" width="9" height="9" fill="#333" stroke="#333" strokeWidth="0.5"/>
        </svg>
      </button>

      <div style={{ width: 1, height: 32, backgroundColor: 'rgba(0,0,0,0.2)' }} />

      {/* Партия — тёмно-синий фон, белый текст */}
      <button
        style={{
          height: 34,
          borderRadius: 4,
          border: '1px solid #333',
          backgroundColor: partyFrozen ? '#8090a0' : '#1a3366',
          color: '#ffffff',
          cursor: partyFrozen ? 'default' : 'pointer',
          opacity: partyFrozen ? 0.5 : 1,
          padding: '0 18px',
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isPartyActive ? '0 0 8px rgba(0,40,250,0.5), inset 0 0 6px rgba(0,100,200,0.3)' : '0 1px 3px rgba(0,0,0,0.3)',
        }}
        disabled={partyFrozen}
        onClick={onPartyClick}
        title="Партия"
      >
        Партия
      </button>

      {/* Анализ — голубой фон, белый текст */}
      <button
        style={{
          height: 34,
          borderRadius: 4,
          border: '1px solid #333',
          backgroundColor: analysisFrozen ? '#7ab0d0' : '#4a90d0',
          color: '#ffffff',
          cursor: analysisFrozen ? 'default' : 'pointer',
          opacity: analysisFrozen ? 0.5 : 1,
          padding: '0 18px',
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          boxShadow: isAnalysisActive ? '0 0 8px rgba(0,40,250,0.5), inset 0 0 6px rgba(255,255,255,0.3)' : '0 1px 3px rgba(0,0,0,0.3)',
        }}
        disabled={analysisFrozen}
        onClick={onAnalysisClick}
        title="Анализ"
      >
        Анализ
      </button>

      <div style={{ flex: 1 }} />

      {/* Свернуть — metallic 3D circle (—) */}
      <button
        style={minimizeFrozen ? CIRCLE_BTN_FROZEN : CIRCLE_BTN_3D}
        disabled={minimizeFrozen}
        onClick={onMinimize}
        title="Свернуть"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <line x1="4" y1="12" x2="12" y2="12" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Поверх всех окон — metallic 3D circle (chess texture) */}
      <button
        style={{
          ...CIRCLE_BTN_3D,
          ...(alwaysOnTop ? {
            background: 'linear-gradient(180deg, #b0d0f0 0%, #80b0e0 30%, #5090d0 70%, #3070c0 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.6), 0 0 8px rgba(0,80,200,0.4)',
          } : {}),
        }}
        onClick={onAlwaysOnTop}
        title="Поверх всех окон"
      >
        {/* Chess 2x2 texture icon */}
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="1" y="1" width="6" height="6" fill="#333" stroke="#333" strokeWidth="0.3"/>
          <rect x="7" y="1" width="6" height="6" fill="#fff" stroke="#333" strokeWidth="0.3"/>
          <rect x="1" y="7" width="6" height="6" fill="#fff" stroke="#333" strokeWidth="0.3"/>
          <rect x="7" y="7" width="6" height="6" fill="#333" stroke="#333" strokeWidth="0.3"/>
        </svg>
      </button>

      {/* Закрыть — metallic 3D circle (×) */}
      <button
        style={CIRCLE_BTN_3D}
        onClick={onClose}
        title="Закрыть"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <line x1="4" y1="4" x2="12" y2="12" stroke="#cc2020" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="4" x2="4" y2="12" stroke="#cc2020" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopBar;
