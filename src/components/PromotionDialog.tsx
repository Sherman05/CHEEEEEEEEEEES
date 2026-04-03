import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { PieceColor } from '../logic/pieces';
import { getPieceSvg, getPieceName } from './Piece';

const PromotionDialog: React.FC<{ cellSize: number }> = ({ cellSize }) => {
  const promotionPending = useGameStore((s) => s.promotionPending);
  const completePromotion = useGameStore((s) => s.completePromotion);

  if (!promotionPending) return null;

  const { piece, options } = promotionPending;
  const isWhite = piece.color === PieceColor.WHITE;

  // Position: right upper for white, right lower for black
  const style: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    ...(isWhite ? { top: 10 } : { bottom: 60 }),
    display: 'flex',
    gap: 6,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: '2px solid #0028fa',
    borderRadius: 8,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  const iconSize = cellSize * 0.72;

  return (
    <div style={style}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => completePromotion(opt)}
          style={{
            width: iconSize + 8,
            height: iconSize + 8,
            padding: 4,
            border: '1px solid #999',
            borderRadius: 6,
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
            style={{ width: iconSize, height: iconSize }}
            draggable={false}
          />
        </button>
      ))}
    </div>
  );
};

export default PromotionDialog;
