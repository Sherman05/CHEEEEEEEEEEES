import React from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { PieceColor } from '../logic/pieces';
import MoveIndicator from './MoveIndicator';
import { IconOk, IconMenu, IconDelete, IconReset } from './icons/ButtonIcons';
import { getPieceSvg, getPieceName, PROMOTION_PICK_BOX, PROMOTION_PICK_ICON } from './Piece';



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

const IMG_FROZEN: React.CSSProperties = {
  ...IMG_BTN,
  opacity: 0.4,
  cursor: 'default',
};

// Small gray circle for prev/next/reverse (no PNG provided)
const SMALL_CIRCLE: React.CSSProperties = {
  width: 28,
  height: 28,
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

const BottomBar: React.FC<BottomBarProps> = ({ onMenuClick, onResetClick, onOkClick, onFirstMoveToggle }) => {
  const { gameMode, gameStage, currentTurn, historyIndex, history } = useGameStore();
  const prevMove = useGameStore((s) => s.prevMove);
  const nextMove = useGameStore((s) => s.nextMove);
  const toggleReverse = useGameStore((s) => s.toggleReverse);
  const deleteSelectedPiece = useGameStore((s) => s.deleteSelectedPiece);
  const selectedForDeletion = useGameStore((s) => s.selectedForDeletion);
  const promotionPending = useGameStore((s) => s.promotionPending);
  const completePromotion = useGameStore((s) => s.completePromotion);
  const blackPromotion = promotionPending && promotionPending.piece.color === PieceColor.BLACK
    ? promotionPending
    : null;

  const viewMode = getViewMode({ gameMode, gameStage });
  const isStart = viewMode === 'start';
  const isSetup = gameStage === 'setup';
  void viewMode;

  const prevFrozen = isStart || isSetup || historyIndex <= 0;
  const nextFrozen = isStart || isSetup || historyIndex >= history.length - 1;
  const reverseFrozen = isStart;
  const deleteFrozen = !selectedForDeletion;

  const MenuButton = (
    <button style={IMG_BTN} onClick={onMenuClick} title="Меню">
      <IconMenu size={BTN_SIZE} />
    </button>
  );

  const ResetButton = isSetup ? (
    <button style={IMG_BTN} onClick={onResetClick} title="Сброс">
      <IconReset size={BTN_SIZE} />
    </button>
  ) : null;

  const FirstMoveToggle = (
    <button
      style={{ ...IMG_BTN, position: 'relative' }}
      onClick={onFirstMoveToggle}
      title="Очередь 1-го хода"
    >
      {/* Icon drawn as SVG — no pre-baked circle, so the programmatic
          dot indicator below is the ONLY circle visible. */}
      <svg width={BTN_SIZE} height={BTN_SIZE} viewBox="0 0 32 32" style={{ pointerEvents: 'none' }}>
        <rect x="1" y="1" width="30" height="30" rx="4" ry="4"
              fill="#b0b0b0" stroke="#666" strokeWidth="1.2" />
        <rect x="4" y="3" width="24" height="13" rx="2" ry="2"
              fill="#ffffff" stroke="#333" strokeWidth="0.8" />
        <rect x="4" y="16" width="24" height="13" rx="2" ry="2"
              fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
      </svg>
      {/* Dot indicator — a SINGLE element whose position and colour are
          derived solely from currentTurn. Because there is only one dot,
          it can never linger on the previous key: toggling white⇄black
          just moves this one dot, so exactly one key is ever marked. */}
      {(() => {
        const isWhiteTurn = currentTurn === PieceColor.WHITE;
        return (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: isWhiteTurn ? '30%' : '70%',
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: isWhiteTurn ? '#333' : '#eee',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        );
      })()}
    </button>
  );

  const OkButton = (
    <button style={IMG_BTN} onClick={onOkClick} title="Готово">
      <IconOk size={BTN_SIZE} />
    </button>
  );

  const PrevButton = (
    <button
      style={prevFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
      disabled={prevFrozen} onClick={prevMove} title="Предыдущий ход"
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M9 2L4 7l5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  const NextButton = (
    <button
      style={nextFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
      disabled={nextFrozen} onClick={nextMove} title="Следующий ход"
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M5 2l5 5-5 5" fill="none" stroke="#ddd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  const ReverseButton = (
    <button
      style={reverseFrozen ? SMALL_FROZEN : SMALL_CIRCLE}
      disabled={reverseFrozen} onClick={toggleReverse} title="Перевернуть доску"
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M3 5l4-3 4 3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 9l-4 3-4-3" fill="none" stroke="#ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  // Удалить фигуру — only in setup ("Задать позицию")
  const DeleteButton = isSetup ? (
    <button
      style={deleteFrozen ? IMG_FROZEN : IMG_BTN}
      disabled={deleteFrozen} onClick={deleteSelectedPiece} title="Удалить фигуру"
    >
      <IconDelete size={BTN_SIZE} />
    </button>
  ) : null;

  return (
    <div data-bottombar style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 8px',
      background: 'linear-gradient(180deg, #c0c0c0 0%, #d0d0d0 30%, #dcdcdc 60%, #e8e8e8 100%)',
      minHeight: 40,
      flexShrink: 0,
      borderTop: '1px solid #999',
    }}>
      {/* Меню — leftmost (per customer correction 08.04.2026) */}
      {MenuButton}
      <div style={{ width: 16 }} />

      {/* Setup mode: Сброс, Очередь хода, Ok, <grow>, Удалить, Перевернуть */}
      {isSetup && (
        <>
          {ResetButton}
          {FirstMoveToggle}
          {OkButton}
          <div style={{ flex: 1 }} />
          {DeleteButton}
          {ReverseButton}
        </>
      )}

      {/* Play mode: Move Indicator, <grow>, Prev Next Reverse.
          While a black promotion is pending, the indicator/arrows are
          replaced by an inline piece picker centered in the bar. */}
      {!isSetup && !isStart && !blackPromotion && (
        <>
          <MoveIndicator />
          <div style={{ flex: 1 }} />
          {PrevButton}
          {NextButton}
          {ReverseButton}
        </>
      )}
      {/* Black promotion picker — absolutely centered in the bar so it
          stays put regardless of Menu/other button widths. */}
      {!isSetup && !isStart && blackPromotion && (
        <>
          <div style={{ flex: 1 }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {blackPromotion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => completePromotion(opt)}
                title={getPieceName(opt.type)}
                style={{
                  width: PROMOTION_PICK_BOX, height: PROMOTION_PICK_BOX, padding: 1,
                  border: '1px solid #555',
                  borderRadius: 3,
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={getPieceSvg(opt)}
                  alt={getPieceName(opt.type)}
                  style={{ width: PROMOTION_PICK_ICON, height: PROMOTION_PICK_ICON, objectFit: 'contain' }}
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Start mode: just spacer */}
      {isStart && <div style={{ flex: 1 }} />}
    </div>
  );
};

export default BottomBar;
