import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import MoveIndicator from './MoveIndicator';

// Metallic 3D circle button
const CIRCLE_BTN: React.CSSProperties = {
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

const CIRCLE_FROZEN: React.CSSProperties = {
  ...CIRCLE_BTN,
  opacity: 0.4,
  cursor: 'default',
};

// Larger Ok button
const OK_BTN: React.CSSProperties = {
  ...CIRCLE_BTN,
  width: 44,
  height: 44,
};

interface BottomBarProps {
  onMenuClick: () => void;
  onResetClick?: () => void;
  onOkClick?: () => void;
  onFirstMoveToggle?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ onMenuClick, onResetClick, onOkClick, onFirstMoveToggle }) => {
  const { gameMode, gameStage, currentTurn, historyIndex, history } = useGameStore();
  const prevMove = useGameStore((s) => s.prevMove);
  const nextMove = useGameStore((s) => s.nextMove);
  const toggleReverse = useGameStore((s) => s.toggleReverse);
  const deleteSelectedPiece = useGameStore((s) => s.deleteSelectedPiece);
  const selectedForDeletion = useGameStore((s) => s.selectedForDeletion);

  const viewMode = getViewMode({ gameMode, gameStage });
  const isStart = viewMode === 'start';
  const isSetup = gameStage === 'setup';
  const isExtended = viewMode === 'extended';

  const prevFrozen = isStart || isSetup || historyIndex <= 0;
  const nextFrozen = isStart || isSetup || historyIndex >= history.length - 1;
  const reverseFrozen = isStart;
  const deleteFrozen = isStart || !selectedForDeletion;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 10px',
      background: 'linear-gradient(180deg, #a0a0a0 0%, #b0b0b0 20%, #c0c0c0 50%, #d0d0d0 80%, #e8e8e8 100%)',
      minHeight: 50,
      flexShrink: 0,
      borderTop: '1px solid #888',
    }}>
      {/* Ok — large circle */}
      {isExtended && (
        <button style={OK_BTN} onClick={onOkClick} title="Готово">
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1a3366', fontFamily: 'serif' }}>Ok</span>
        </button>
      )}

      {/* Меню (☰) */}
      <button
        style={CIRCLE_BTN}
        onClick={onMenuClick}
        title="Меню"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <line x1="3" y1="5" x2="15" y2="5" stroke="#1a3366" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="9" x2="15" y2="9" stroke="#1a3366" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="13" x2="15" y2="13" stroke="#1a3366" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Move Indicator — light rectangle */}
      {viewMode === 'basic' && <MoveIndicator />}

      {/* Extended view extras: Reset + 1-й ход toggle */}
      {isExtended && (
        <>
          <button style={CIRCLE_BTN} onClick={onResetClick} title="Сброс">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 8a5 5 0 1 1 1.2 3.2" fill="none" stroke="#1a3366" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 5v3h3" fill="none" stroke="#1a3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            style={{
              ...CIRCLE_BTN,
              width: 'auto',
              borderRadius: 12,
              padding: '4px 10px',
              flexDirection: 'column',
              gap: 2,
              height: 'auto',
              minHeight: 38,
            }}
            onClick={onFirstMoveToggle}
            title="1-й ход"
          >
            <span style={{ fontSize: 9, color: '#333', fontFamily: 'Arial, sans-serif' }}>1-й ход</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                width: 22, height: 9, borderRadius: 1,
                backgroundColor: '#ffffff',
                border: '1.5px solid #555',
                position: 'relative',
              }}>
                {currentTurn === 'white' && <div style={{
                  width: 5, height: 5, borderRadius: '50%', backgroundColor: '#555',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
              <div style={{
                width: 22, height: 9, borderRadius: 1,
                backgroundColor: '#000000',
                border: '1.5px solid #555',
                position: 'relative',
              }}>
                {currentTurn === 'black' && <div style={{
                  width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ccc',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
            </div>
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Предыдущий ход (‹) — circle */}
      <button
        style={prevFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={prevFrozen}
        onClick={prevMove}
        title="Предыдущий ход"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M10 3L5 8l5 5" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Следующий ход (›) — circle */}
      <button
        style={nextFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={nextFrozen}
        onClick={nextMove}
        title="Следующий ход"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M6 3l5 5-5 5" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Удалить фигуру (✕ в синем круге) */}
      <button
        style={{
          ...(!deleteFrozen ? CIRCLE_BTN : CIRCLE_FROZEN),
          background: !deleteFrozen
            ? 'linear-gradient(180deg, #5090d0 0%, #3070c0 50%, #2060a0 100%)'
            : 'linear-gradient(180deg, #b0b0b0 0%, #909090 50%, #808080 100%)',
          border: '1.5px solid #1a3366',
        }}
        disabled={deleteFrozen}
        onClick={deleteSelectedPiece}
        title="Удалить фигуру"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <line x1="4" y1="4" x2="12" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="4" x2="4" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Реверс (↻) */}
      <button
        style={reverseFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={reverseFrozen}
        onClick={toggleReverse}
        title="Перевернуть доску"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 6l4-3 4 3" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 10l-4 3-4-3" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default BottomBar;
