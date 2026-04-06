import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import MoveIndicator from './MoveIndicator';

// Small gray metallic circle button — per mockup
const SMALL_CIRCLE: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1.5px solid #555',
  background: 'linear-gradient(180deg, #a0a0a0 0%, #808080 40%, #606060 100%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
};

const SMALL_FROZEN: React.CSSProperties = {
  ...SMALL_CIRCLE,
  opacity: 0.4,
  cursor: 'default',
};

// White circle button style (for Menu, Ok)
const WHITE_CIRCLE: React.CSSProperties = {
  ...SMALL_CIRCLE,
  background: 'linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 40%, #d0d0d0 100%)',
  border: '1.5px solid #666',
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
      gap: 6,
      padding: '4px 8px',
      background: 'linear-gradient(180deg, #c0c0c0 0%, #d0d0d0 30%, #dcdcdc 60%, #e8e8e8 100%)',
      minHeight: 48,
      flexShrink: 0,
      borderTop: '1px solid #999',
    }}>
      {/* Ok — gray metallic circle with blue "Ok" text (per icon mockup) */}
      {isExtended && (
        <button
          style={{
            ...SMALL_CIRCLE,
            width: 40,
            height: 40,
            border: '2px solid #555',
          }}
          onClick={onOkClick}
          title="Готово"
        >
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#2a7ac0', fontFamily: 'serif' }}>Ok</span>
        </button>
      )}

      {/* Menu — white circle with blue lines (☰) */}
      <button
        style={WHITE_CIRCLE}
        onClick={onMenuClick}
        title="Меню"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <line x1="3" y1="4" x2="13" y2="4" stroke="#0050d0" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="8" x2="13" y2="8" stroke="#0050d0" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="12" x2="13" y2="12" stroke="#0050d0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Move Indicator — visible in basic (play) mode */}
      {viewMode === 'basic' && <MoveIndicator />}

      {/* Extended view extras: Reset + 1st move toggle */}
      {isExtended && (
        <>
          <button style={SMALL_CIRCLE} onClick={onResetClick} title="Сброс">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 7a4 4 0 1 1 1 2.6" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 4.5v2.5h2.5" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            style={{
              ...SMALL_CIRCLE,
              width: 'auto',
              borderRadius: 10,
              padding: '3px 8px',
              flexDirection: 'column',
              gap: 1,
              height: 'auto',
              minHeight: 36,
            }}
            onClick={onFirstMoveToggle}
            title="1-й ход"
          >
            <span style={{ fontSize: 8, color: '#eee', fontFamily: 'Arial, sans-serif' }}>1-й ход</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{
                width: 20, height: 8, borderRadius: 1,
                backgroundColor: '#ffffff',
                border: '1px solid #666',
                position: 'relative',
              }}>
                {currentTurn === 'white' && <div style={{
                  width: 4, height: 4, borderRadius: '50%', backgroundColor: '#555',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
              <div style={{
                width: 20, height: 8, borderRadius: 1,
                backgroundColor: '#1a1a1a',
                border: '1px solid #666',
                position: 'relative',
              }}>
                {currentTurn === 'black' && <div style={{
                  width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ccc',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
            </div>
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Prev move (‹) — gray circle */}
      <button
        style={prevFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={prevFrozen}
        onClick={prevMove}
        title="Предыдущий ход"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 2L4 7l5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Next move (›) — gray circle */}
      <button
        style={nextFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={nextFrozen}
        onClick={nextMove}
        title="Следующий ход"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M5 2l5 5-5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Delete piece — blue border circle, blue X on white bg (per icon mockup) */}
      <button
        style={{
          ...(deleteFrozen ? SMALL_FROZEN : {
            ...SMALL_CIRCLE,
            background: '#fff',
            border: '2px solid #2a7ac0',
          }),
        }}
        disabled={deleteFrozen}
        onClick={deleteSelectedPiece}
        title="Удалить фигуру"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <line x1="3" y1="3" x2="11" y2="11" stroke="#2a7ac0" strokeWidth="3" strokeLinecap="round" />
          <line x1="11" y1="3" x2="3" y2="11" stroke="#2a7ac0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Reverse — gray circle */}
      <button
        style={reverseFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={reverseFrozen}
        onClick={toggleReverse}
        title="Перевернуть доску"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M3 5l4-3 4 3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 9l-4 3-4-3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Resize — blue square per mockup */}
      <div
        style={{
          width: 28,
          height: 28,
          backgroundColor: '#2a7ac0',
          border: '1px solid #1a5090',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'nwse-resize',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
        title="Изменить размер"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export default BottomBar;
