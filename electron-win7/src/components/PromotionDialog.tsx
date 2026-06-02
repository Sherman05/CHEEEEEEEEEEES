import React, { useLayoutEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PieceColor } from '../logic/pieces';
import { getPieceSvg, getPieceName } from './Piece';

interface Rect { left: number; top: number; width: number; height: number; bottom: number; }

const PromotionDialog: React.FC<{ cellSize: number }> = ({ cellSize }) => {
  const promotionPending = useGameStore((s) => s.promotionPending);
  const completePromotion = useGameStore((s) => s.completePromotion);
  const [boardRect, setBoardRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!promotionPending) return;

    const measure = () => {
      const el = document.querySelector('[data-board-root]') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBoardRect({ left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom });
    };

    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    const boardEl = document.querySelector('[data-board-root]') as HTMLElement | null;
    if (boardEl) ro.observe(boardEl);
    // Also watch the top/bottom bars so geometry updates if their height changes.
    document.querySelectorAll('[data-topbar],[data-bottombar]').forEach((el) => ro.observe(el as HTMLElement));
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [promotionPending]);

  if (!promotionPending || !boardRect) return null;

  const { piece, options } = promotionPending;
  const isWhite = piece.color === PieceColor.WHITE;

  // Compact icons — must fit inside a button-bar row (~40px tall).
  const iconSize = Math.min(40, cellSize * 0.8);
  const buttonBox = iconSize + 8;

  // Horizontally centered over the board. Vertically: for white, sit INSIDE
  // the top button bar (above the board, clipping into the row of file
  // letters is allowed; squares are never covered). For black, sit INSIDE
  // the bottom button bar.
  const topBar = document.querySelector('[data-topbar]') as HTMLElement | null;
  const bottomBar = document.querySelector('[data-bottombar]') as HTMLElement | null;

  // Reserve space on the right for the window-control buttons (~110px)
  // so the popup sits just to the left of them, not over the title.
  const WIN_BTNS_WIDTH = 110;

  let topPx: number;
  let rightPx: number;
  if (isWhite) {
    const bar = topBar?.getBoundingClientRect();
    topPx = bar ? bar.top + Math.max(2, (bar.height - buttonBox) / 2) : 4;
    rightPx = bar ? (window.innerWidth - bar.right) + WIN_BTNS_WIDTH : WIN_BTNS_WIDTH;
  } else {
    const bar = bottomBar?.getBoundingClientRect();
    topPx = bar ? bar.top + Math.max(2, (bar.height - buttonBox) / 2) : (boardRect.bottom + 4);
    // Bottom bar: keep on the right but clear of the Перевернуть / history buttons (~120px)
    rightPx = bar ? (window.innerWidth - bar.right) + 120 : 120;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    right: rightPx,
    top: topPx,
    display: 'flex',
    gap: 3,
    padding: 3,
    backgroundColor: 'rgba(210,210,210,0.95)',
    border: '1px solid rgba(0,0,0,0.3)',
    borderRadius: 3,
    zIndex: 200,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  };

  return (
    <div style={style}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => completePromotion(opt)}
          style={{
            width: buttonBox,
            height: buttonBox,
            padding: 1,
            border: '1px solid #888',
            borderRadius: 3,
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={getPieceName(opt.type)}
        >
          <img
            src={getPieceSvg(opt)}
            alt={getPieceName(opt.type)}
            style={{ width: iconSize, height: iconSize, objectFit: 'contain' }}
            draggable={false}
          />
        </button>
      ))}
    </div>
  );
};

export default PromotionDialog;
