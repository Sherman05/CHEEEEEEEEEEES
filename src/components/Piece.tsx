import React from 'react';
import { PieceType, PieceColor } from '../logic/pieces';
import type { Piece as PieceData } from '../logic/pieces';

// Customer-supplied piece PNGs (design/pieces, copied into src/assets/pieces).
// All sources are 300px tall — uniform height by construction. Do not modify.
import kingWhite from '../assets/pieces/korol-white.png';
import kingBlack from '../assets/pieces/korol-black.png';
import konnetWhite from '../assets/pieces/konnet-white.png';
import konnetBlack from '../assets/pieces/konnet-black.png';
import princeWhite from '../assets/pieces/prints-white.png';
import princeBlack from '../assets/pieces/prints-black.png';
import ritterWhite from '../assets/pieces/ritter-white.png';
import ritterBlack from '../assets/pieces/ritter-black.png';
import knekhtWhite from '../assets/pieces/knekht-white.png';
import knekhtBlack from '../assets/pieces/knekht-black.png';
import verKnekhtWhite from '../assets/pieces/ver-knekht-white.png';
import verKnekhtBlack from '../assets/pieces/ver-knekht-black.png';
import scoutWhite from '../assets/pieces/razvedchik-white.png';
import scoutBlack from '../assets/pieces/razvedchik-black.png';

const PIECE_IMGS: Record<string, string> = {
  [`${PieceType.KING}_${PieceColor.WHITE}`]: kingWhite,
  [`${PieceType.KING}_${PieceColor.BLACK}`]: kingBlack,
  [`${PieceType.KONNET}_${PieceColor.WHITE}`]: konnetWhite,
  [`${PieceType.KONNET}_${PieceColor.BLACK}`]: konnetBlack,
  [`${PieceType.PRINCE}_${PieceColor.WHITE}`]: princeWhite,
  [`${PieceType.PRINCE}_${PieceColor.BLACK}`]: princeBlack,
  [`${PieceType.RITTER}_${PieceColor.WHITE}`]: ritterWhite,
  [`${PieceType.RITTER}_${PieceColor.BLACK}`]: ritterBlack,
  [`${PieceType.KNEKHT}_${PieceColor.WHITE}`]: knekhtWhite,
  [`${PieceType.KNEKHT}_${PieceColor.BLACK}`]: knekhtBlack,
  [`${PieceType.VER_KNEKHT}_${PieceColor.WHITE}`]: verKnekhtWhite,
  [`${PieceType.VER_KNEKHT}_${PieceColor.BLACK}`]: verKnekhtBlack,
  [`${PieceType.SCOUT}_${PieceColor.WHITE}`]: scoutWhite,
  [`${PieceType.SCOUT}_${PieceColor.BLACK}`]: scoutBlack,
};

export function getPieceSvg(piece: PieceData): string {
  return PIECE_IMGS[`${piece.type}_${piece.color}`] || '';
}

// ── Promotion piece-picker sizing ───────────────────────────────────────────
// Size (px) of the little squares shown when choosing a piece for promotion —
// white picker lives in the TopBar, black picker in the BottomBar. Tune these
// two numbers here to resize the boxes / icons in BOTH pickers at once:
//   PROMOTION_PICK_BOX  — outer square (button) size
//   PROMOTION_PICK_ICON — piece image size inside the square (≈ box − padding)
export const PROMOTION_PICK_BOX = 36;
export const PROMOTION_PICK_ICON = 34;

// Per-piece visual size factors. Pawn (Knekht) = 1.0 baseline.
// All other pieces are scaled DOWN so their rendered height visually
// matches the pawn's height — design rule: "Выровнять высоту всех фигур
// под высоту пешки". The PNG artwork itself is unchanged.
// Tweak these constants to fine-tune; the same factor is reused for the
// drag ghost so pieces never enlarge while being moved.
// All customer PNGs are 300px tall and the artwork fills the full height,
// so by default they all render at exactly the same in-cell height.
// Per spec, King and Konnet may be slightly taller than the rest.
export const PIECE_HEIGHT_FACTOR: Record<PieceType, number> = {
  [PieceType.KING]:       1.08,
  [PieceType.KONNET]:     1.05,
  [PieceType.PRINCE]:     1.00,
  [PieceType.RITTER]:     1.00,
  [PieceType.VER_KNEKHT]: 1.00,
  [PieceType.SCOUT]:      1.00,
  [PieceType.KNEKHT]:     1.00,
};

export function getPieceHeightFactor(type: PieceType): number {
  return PIECE_HEIGHT_FACTOR[type] ?? 1;
}

const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.KING]: 'Король',
  [PieceType.KONNET]: 'Коннет',
  [PieceType.PRINCE]: 'Принц',
  [PieceType.RITTER]: 'Риттер',
  [PieceType.KNEKHT]: 'Кнехт',
  [PieceType.VER_KNEKHT]: 'Вер Кнехт',
  [PieceType.SCOUT]: 'Разведчик',
};

export function getPieceName(type: PieceType): string {
  return PIECE_NAMES[type] || '';
}

interface PieceProps {
  piece: PieceData;
  cellSize: number;
  scale?: number;
  isDragging?: boolean;
}

const PieceComponent: React.FC<PieceProps> = ({ piece, cellSize, scale = 0.95, isDragging = false }) => {
  const factor = getPieceHeightFactor(piece.type);
  // Render by HEIGHT, not by square box — preserves source aspect ratio.
  const iconHeight = cellSize * scale * factor;
  const src = getPieceSvg(piece);

  return (
    <img
      src={src}
      alt={getPieceName(piece.type)}
      style={{
        height: iconHeight,
        width: 'auto',
        maxWidth: cellSize * 0.98,
        pointerEvents: 'none',
        userSelect: 'none',
        // @ts-ignore webkit drag
        WebkitUserDrag: 'none',
        opacity: isDragging ? 0.5 : 1,
        position: 'absolute',
        bottom: cellSize * 0.02,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      draggable={false}
    />
  );
};

export default PieceComponent;
