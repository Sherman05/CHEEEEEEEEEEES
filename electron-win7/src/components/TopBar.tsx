import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { createInitialPosition, PieceColor } from '../logic/pieces';
import { getPieceSvg, getPieceName } from './Piece';

const BTN_SIZE = 32;

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

// Round metallic window control — same shape as the Intro page,
// but tinted blue-cyan to match the top bar.
const WIN_BTN: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  border: '1.5px solid #1a4f80',
  background: 'linear-gradient(180deg, #9ed4f5 0%, #5ca8e0 45%, #2f7ec0 75%, #205a98 100%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  boxShadow: '0 2px 3px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.35)',
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
  const completePromotion = useGameStore((s) => s.completePromotion);
  const setInitialPosition = useGameStore((s) => s.setInitialPosition);
  const setBoard = useGameStore((s) => s.setBoard);

  // Inline white-promotion picker replaces the title while pending.
  const whitePromotion = promotionPending && promotionPending.piece.color === PieceColor.WHITE
    ? promotionPending
    : null;

  const isStart = viewMode === 'start';
  const isPartyActive = gameMode === 'party';
  const isAnalysisActive = gameMode === 'analysis';
  const isSetup = gameStage === 'setup';

  const initialPosFrozen = isStart;
  // Active button looks dark/highlighted; inactive looks pale.
  // Disabled = analysis-setup forbids switching to party mid-setup.
  const partyDisabled = isAnalysisActive && isSetup;
  const analysisDisabled = false;
  const minimizeFrozen = !!promotionPending;

  // Style helper for Партия/Анализ tab buttons.
  const tabBtnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    height: 28,
    borderRadius: 3,
    border: '1px solid #1a5090',
    backgroundColor: active ? '#10437a' : '#9cc8e8',
    color: active ? '#ffffff' : '#1a3a60',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    padding: '0 16px',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    boxShadow: active
      ? 'inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px rgba(0,40,120,0.4)'
      : '0 1px 2px rgba(0,0,0,0.2)',
  });

  return (
    <div
      data-topbar
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        background: 'linear-gradient(180deg, #8ec8f0 0%, #5aace8 30%, #3a96e0 60%, #2a86d0 100%)',
        minHeight: 40,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Начальная расстановка — always visible */}
      <button
        style={{
          ...IMG_BTN,
          width: 28, height: 28,
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
        <svg width={28} height={28} viewBox="0 0 32 32">
          <rect x="1" y="1" width="30" height="30" rx="3" ry="3" fill="#f0f0f0" stroke="#000000" strokeWidth="1" />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 4 }).map((_, c) => {
              const dark = (r + c) % 2 === 1;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={5 + c * 5.5}
                  y={5 + r * 5.5}
                  width={5.5}
                  height={5.5}
                  fill={dark ? '#505050' : '#ffffff'}
                  stroke="#000000"
                  strokeWidth="0.4"
                />
              );
            })
          )}
        </svg>
      </button>

      {/* Партия */}
      <button
        style={tabBtnStyle(isPartyActive, partyDisabled)}
        disabled={partyDisabled} onClick={onPartyClick} title="Партия"
      >Партия</button>

      {/* Анализ */}
      <button
        style={tabBtnStyle(isAnalysisActive, analysisDisabled)}
        disabled={analysisDisabled} onClick={onAnalysisClick} title="Анализ"
      >Анализ</button>

      <div
        data-tauri-drag-region
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'move',
          minHeight: 32,
        }}
      >
        {!whitePromotion && (
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: 15,
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            letterSpacing: 0.3,
            pointerEvents: 'none',
          }}>GI chess-T1</span>
        )}
      </div>

      {/* White promotion picker — inline in flow, right of drag region, before window buttons */}
      {whitePromotion && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 2 }}>
          {whitePromotion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => completePromotion(opt)}
              title={getPieceName(opt.type)}
              style={{
                width: 36, height: 36, padding: 1,
                border: '1px solid #1a4080',
                borderRadius: 3,
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img
                src={getPieceSvg(opt)}
                alt={getPieceName(opt.type)}
                style={{ width: 36, height: 36, objectFit: 'contain' }}
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Свернуть */}
      <button
        style={{ ...WIN_BTN, opacity: minimizeFrozen ? 0.4 : 1, cursor: minimizeFrozen ? 'default' : 'pointer' }}
        disabled={minimizeFrozen} onClick={onMinimize} title="Свернуть"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="9" x2="10" y2="9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Поверх всех окон */}
      <button
        style={{ ...WIN_BTN, ...(alwaysOnTop ? { filter: 'brightness(1.2)', boxShadow: '0 0 6px rgba(255,255,255,0.6), inset 0 1px 1px rgba(255,255,255,0.4)' } : {}) }}
        onClick={onAlwaysOnTop} title="Поверх всех окон"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="1" width="5" height="5" fill="#cfe6f8" stroke="#fff" strokeWidth="0.6"/>
          <rect x="5" y="5" width="5" height="5" fill="#9ec6ec" stroke="#fff" strokeWidth="0.6"/>
        </svg>
      </button>

      {/* Закрыть */}
      <button style={WIN_BTN} onClick={onClose} title="Закрыть">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="2" x2="10" y2="10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="2" x2="2" y2="10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopBar;
