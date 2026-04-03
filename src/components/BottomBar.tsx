import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import MoveIndicator from './MoveIndicator';

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
      padding: '6px 10px',
      background: 'linear-gradient(180deg, #4a9ae0 0%, #6ab4e8 50%, #9dd0f0 100%)',
      minHeight: 54,
      flexShrink: 0,
    }}>
      {/* Menu — circle with 3 horizontal lines */}
      <button
        style={CIRCLE_BTN}
        onClick={onMenuClick}
        title="Меню"
      >
        <svg width="22" height="22" viewBox="0 0 22 22">
          <line x1="5" y1="6" x2="17" y2="6" stroke="#0028fa" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="11" x2="17" y2="11" stroke="#0028fa" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="16" x2="17" y2="16" stroke="#0028fa" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Move Indicator */}
      {viewMode === 'basic' && <MoveIndicator />}

      {/* Extended view buttons */}
      {isExtended && (
        <>
          <button style={CIRCLE_BTN} onClick={onResetClick} title="Сброс">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M4 10a6 6 0 1 1 1.5 3.9" fill="none" stroke="#0028fa" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M4 6v4h4" fill="none" stroke="#0028fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button style={CIRCLE_BTN} onClick={onOkClick} title="Готово">
            <span style={{ fontSize: 15, fontWeight: 'bold', color: '#0028fa', fontFamily: 'serif' }}>Ok</span>
          </button>

          <button
            style={{
              ...CIRCLE_BTN,
              width: 'auto',
              borderRadius: 14,
              padding: '4px 12px',
              flexDirection: 'column',
              gap: 2,
              height: 'auto',
              minHeight: 40,
            }}
            onClick={onFirstMoveToggle}
            title="1-й ход"
          >
            <span style={{ fontSize: 10, color: '#1a1a1a', fontFamily: 'Arial, sans-serif' }}>1-й ход</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                width: 24, height: 10, borderRadius: 1,
                backgroundColor: '#ffffff',
                border: '1.5px solid #1a1a1a',
                position: 'relative',
              }}>
                {currentTurn === 'white' && <div style={{
                  width: 6, height: 6, borderRadius: '50%', backgroundColor: '#555',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
              <div style={{
                width: 24, height: 10, borderRadius: 1,
                backgroundColor: '#000000',
                border: '1.5px solid #1a1a1a',
                position: 'relative',
              }}>
                {currentTurn === 'black' && <div style={{
                  width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ccc',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
            </div>
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Предыдущий ход */}
      <button
        style={prevFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={prevFrozen}
        onClick={prevMove}
        title="Предыдущий ход"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M12 4L6 10l6 6" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Следующий ход */}
      <button
        style={nextFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={nextFrozen}
        onClick={nextMove}
        title="Следующий ход"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M8 4l6 6-6 6" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Удалить фигуру */}
      <button
        style={deleteFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={deleteFrozen}
        onClick={deleteSelectedPiece}
        title="Удалить фигуру"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M5 7h10l-1 9H6L5 7z" fill="none" stroke="#1a1a1a" strokeWidth="2" />
          <path d="M4 5h12" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M7.5 5V3.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V5" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Перевернуть доску */}
      <button
        style={reverseFrozen ? CIRCLE_FROZEN : CIRCLE_BTN}
        disabled={reverseFrozen}
        onClick={toggleReverse}
        title="Перевернуть доску"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M5 7l5-3 5 3" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 13l-5 3-5-3" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default BottomBar;
