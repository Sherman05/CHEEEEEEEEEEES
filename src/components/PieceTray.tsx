import React, { useCallback, useState, useRef, useEffect } from 'react';
import { PieceType, PieceColor, toSquare, FILES, RANKS } from '../logic/pieces';
import type { Piece } from '../logic/pieces';
import { getPieceSvg, getPieceName, getPieceHeightFactor } from './Piece';
import { useGameStore } from '../stores/gameStore';

// Order top→bottom: Кр, Кт, Пр, Рт, Кн, ВК, Рк (rows 8→2)
const ALL_TYPES = [
  PieceType.KING,
  PieceType.KONNET,
  PieceType.PRINCE,
  PieceType.RITTER,
  PieceType.KNEKHT,
  PieceType.VER_KNEKHT,
  PieceType.SCOUT,
];

interface PieceTrayProps {
  color: PieceColor;
  cellSize: number;
  side: 'left' | 'right';
}

// Vertical space the column chrome eats besides the icons themselves:
// padding (2px top + 2px bottom) + gaps (6 gaps × 2px between 7 rows) +
// each row adds 4px around its icon (width/height = iconSize + 4).
// overhead = 4 (padding) + 12 (gaps) + 7×4 (row borders) = 44px.
const TRAY_COUNT = ALL_TYPES.length; // 7
const TRAY_OVERHEAD = 4 + (TRAY_COUNT - 1) * 2 + TRAY_COUNT * 4;
const TRAY_MIN_ICON = 16;

const PieceTray: React.FC<PieceTrayProps> = ({ color, cellSize }) => {
  // Icon size is derived from the MEASURED container height — exactly like the
  // board derives its cell size from its container — so it never depends on the
  // Windows system text size. When the surrounding bars grow (e.g. larger system
  // text), the available height shrinks and the icons shrink with it instead of
  // overflowing the bottom edge. cellSize * 0.85 is only an UPPER cap so the tray
  // looks identical to before whenever there is enough room.
  const containerRef = useRef<HTMLDivElement>(null);
  const [availHeight, setAvailHeight] = useState<number>(Infinity);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const recompute = () => setAvailHeight(parent.clientHeight);
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const maxIcon = cellSize * 0.85;
  const fitIcon = (availHeight - TRAY_OVERHEAD) / TRAY_COUNT;
  const iconSize = Math.max(TRAY_MIN_ICON, Math.min(maxIcon, fitIcon));
  const [dragPiece, setDragPiece] = useState<Piece | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const placePiece = useGameStore((s) => s.placePiece);
  const reversed = useGameStore((s) => s.reversed);
  const dragPieceRef = useRef<Piece | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, piece: Piece) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragPieceRef.current = piece;
    setDragPiece(piece);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!dragPiece) return;

    const handleMove = (e: MouseEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleUp = (e: MouseEvent) => {
      const piece = dragPieceRef.current;
      if (!piece) {
        setDragPiece(null);
        return;
      }

      // Find board element and calculate target square
      const boardEl = document.querySelector('[data-board-squares]') as HTMLElement;
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= 0 && y >= 0 && x < rect.width && y < rect.height) {
          const cellPx = rect.width / 8;
          const col = Math.floor(x / cellPx);
          const row = Math.floor(y / cellPx);
          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            const files = reversed ? [...FILES].reverse() : [...FILES];
            const ranks = reversed ? [...RANKS] : [...RANKS].reverse();
            const sq = toSquare(files[col], ranks[row]);
            placePiece(sq, piece);
          }
        }
      }

      dragPieceRef.current = null;
      setDragPiece(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragPiece, placePiece, reversed]);

  return (
    <>
      <div ref={containerRef} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '2px 2px',
        alignItems: 'center',
        // TASK-06: cap height to the available space and scroll vertically
        // so all pieces remain reachable when the window is short.
        maxHeight: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        alignSelf: 'stretch',
      }}>
        {ALL_TYPES.map((type) => {
          const piece: Piece = { type, color };
          const sz = iconSize * getPieceHeightFactor(type);
          return (
            <div
              key={type}
              onMouseDown={(e) => handleMouseDown(e, piece)}
              style={{
                width: iconSize + 4,
                height: iconSize + 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                userSelect: 'none',
              }}
              title={getPieceName(type)}
            >
              <img
                src={getPieceSvg(piece)}
                alt={getPieceName(type)}
                style={{ height: sz, width: 'auto', maxWidth: iconSize, pointerEvents: 'none' }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* Drag ghost — same height as on-tray (no enlargement) */}
      {dragPiece && (() => {
        const ghost = iconSize * getPieceHeightFactor(dragPiece.type);
        return (
        <img
          src={getPieceSvg(dragPiece)}
          alt=""
          style={{
            position: 'fixed',
            left: dragPos.x - ghost / 2,
            top: dragPos.y - ghost / 2,
            height: ghost,
            width: 'auto',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.9,
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          }}
          draggable={false}
        />
      );})()}
    </>
  );
};

export default PieceTray;
