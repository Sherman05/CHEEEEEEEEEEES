import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { createInitialPosition } from '../logic/pieces';
import btnReset from '../assets/btn-reset.png';
import btnMinimize from '../assets/btn-minimize.png';
import btnOntop from '../assets/btn-ontop.png';
import btnClose from '../assets/btn-close.png';

const BTN_SIZE = 36;

const IMG_BTN: React.CSSProperties = {
  width: BTN_SIZE,
  height: BTN_SIZE,
  cursor: 'pointer',
  padding: 0,
  border: 'none',
  background: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        background: 'linear-gradient(180deg, #8ec8f0 0%, #5aace8 30%, #3a96e0 60%, #2a86d0 100%)',
        minHeight: 48,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Начальная расстановка — PNG icon */}
      <button
        style={{
          ...IMG_BTN,
          opacity: initialPosFrozen ? 0.4 : 1,
          cursor: initialPosFrozen ? 'default' : 'pointer',
        }}
        disabled={initialPosFrozen}
        onClick={() => {
          if (initialPosFrozen) return;
          if (isSetup) { setBoard(createInitialPosition()); } else { setInitialPosition(); }
        }}
        title="Начальная расстановка"
      >
        <img src={btnReset} alt="Начальная расстановка" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>

      {/* Партия */}
      <button
        style={{
          height: 32, borderRadius: 3, border: '1px solid #1a5090',
          backgroundColor: partyFrozen ? '#7ab0d0' : '#3a90d0',
          color: '#fff', cursor: partyFrozen ? 'default' : 'pointer',
          opacity: partyFrozen ? 0.5 : 1, padding: '0 16px',
          fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial, sans-serif',
          boxShadow: isPartyActive ? '0 0 6px rgba(0,40,200,0.5)' : '0 1px 2px rgba(0,0,0,0.2)',
        }}
        disabled={partyFrozen} onClick={onPartyClick} title="Партия"
      >Партия</button>

      {/* Анализ */}
      <button
        style={{
          height: 32, borderRadius: 3, border: '1px solid #1a5090',
          backgroundColor: analysisFrozen ? '#7ab0d0' : '#3a90d0',
          color: '#fff', cursor: analysisFrozen ? 'default' : 'pointer',
          opacity: analysisFrozen ? 0.5 : 1, padding: '0 16px',
          fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial, sans-serif',
          boxShadow: isAnalysisActive ? '0 0 6px rgba(0,40,200,0.5)' : '0 1px 2px rgba(0,0,0,0.2)',
        }}
        disabled={analysisFrozen} onClick={onAnalysisClick} title="Анализ"
      >Анализ</button>

      {/* Drag region */}
      <div data-tauri-drag-region style={{ flex: 1, height: '100%', cursor: 'move', minHeight: 40 }} />

      {/* Свернуть — PNG icon */}
      <button
        style={{ ...IMG_BTN, opacity: minimizeFrozen ? 0.4 : 1, cursor: minimizeFrozen ? 'default' : 'pointer' }}
        disabled={minimizeFrozen} onClick={onMinimize} title="Свернуть"
      >
        <img src={btnMinimize} alt="Свернуть" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>

      {/* Поверх всех окон — PNG icon */}
      <button
        style={{ ...IMG_BTN, ...(alwaysOnTop ? { filter: 'brightness(1.3)' } : {}) }}
        onClick={onAlwaysOnTop} title="Поверх всех окон"
      >
        <img src={btnOntop} alt="Поверх всех окон" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>

      {/* Закрыть — PNG icon */}
      <button style={IMG_BTN} onClick={onClose} title="Закрыть">
        <img src={btnClose} alt="Закрыть" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>
    </div>
  );
};

export default TopBar;
