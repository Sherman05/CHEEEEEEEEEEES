import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import MoveIndicator from './MoveIndicator';
import btnMenu from '../assets/btn-menu.png';
import btnOk from '../assets/btn-ok.png';
import btnDelete from '../assets/btn-delete.png';


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

const IMG_FROZEN: React.CSSProperties = {
  ...IMG_BTN,
  opacity: 0.4,
  cursor: 'default',
};

// Small gray circle for prev/next/reverse (no PNG provided)
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

interface BottomBarProps {
  onMenuClick: () => void;
  onResetClick?: () => void;
  onOkClick?: () => void;
  onFirstMoveToggle?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ onMenuClick, onOkClick, onFirstMoveToggle }) => {
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
      {/* Ok — PNG icon (extended/analysis mode) */}
      {isExtended && (
        <button style={IMG_BTN} onClick={onOkClick} title="Готово">
          <img src={btnOk} alt="Ok" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
        </button>
      )}

      {/* Меню — PNG icon */}
      <button style={IMG_BTN} onClick={onMenuClick} title="Меню">
        <img src={btnMenu} alt="Меню" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>

      {/* Move Indicator */}
      {viewMode === 'basic' && <MoveIndicator />}

      {/* Extended: 1-й ход */}
      {isExtended && (
        <>          <button
            style={{
              ...SMALL_CIRCLE,
              width: 'auto', borderRadius: 10, padding: '3px 8px',
              flexDirection: 'column', gap: 1, height: 'auto', minHeight: 36,
            }}
            onClick={onFirstMoveToggle}
            title="1-й ход"
          >
            <span style={{ fontSize: 8, color: '#eee', fontFamily: 'Arial, sans-serif' }}>1-й ход</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{
                width: 20, height: 8, borderRadius: 1,
                backgroundColor: '#ffffff', border: '1px solid #666', position: 'relative',
              }}>
                {currentTurn === 'white' && <div style={{
                  width: 4, height: 4, borderRadius: '50%', backgroundColor: '#555',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                }} />}
              </div>
              <div style={{
                width: 20, height: 8, borderRadius: 1,
                backgroundColor: '#1a1a1a', border: '1px solid #666', position: 'relative',
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

      {/* Предыдущий ход */}
      <button
        style={prevFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={prevFrozen} onClick={prevMove} title="Предыдущий ход"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 2L4 7l5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Следующий ход */}
      <button
        style={nextFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={nextFrozen} onClick={nextMove} title="Следующий ход"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M5 2l5 5-5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Удалить фигуру — PNG icon */}
      <button
        style={deleteFrozen ? IMG_FROZEN : IMG_BTN}
        disabled={deleteFrozen} onClick={deleteSelectedPiece} title="Удалить фигуру"
      >
        <img src={btnDelete} alt="Удалить" style={{ width: BTN_SIZE, height: BTN_SIZE }} draggable={false} />
      </button>

      {/* Перевернуть доску */}
      <button
        style={reverseFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
        disabled={reverseFrozen} onClick={toggleReverse} title="Перевернуть доску"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M3 5l4-3 4 3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 9l-4 3-4-3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Изменить размер */}
      <div
        style={{
          width: 28, height: 28, backgroundColor: '#2a7ac0',
          border: '1px solid #1a5090', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
