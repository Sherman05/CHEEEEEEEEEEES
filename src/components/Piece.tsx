import React from 'react';
import { PieceType, PieceColor } from '../logic/pieces';
import type { Piece as PieceData } from '../logic/pieces';

// Import all piece PNGs from Figma design
import kingWhite from '../assets/pieces/king_white.png';
import kingBlack from '../assets/pieces/king_black.png';
import konnetWhite from '../assets/pieces/konnet_white.png';
import konnetBlack from '../assets/pieces/konnet_black.png';
import princeWhite from '../assets/pieces/prince_white.png';
import princeBlack from '../assets/pieces/prince_black.png';
import ritterWhite from '../assets/pieces/ritter_white.png';
import ritterBlack from '../assets/pieces/ritter_black.png';
import knekhtWhite from '../assets/pieces/knekht_white.png';
import knekhtBlack from '../assets/pieces/knekht_black.png';
import verKnekhtWhite from '../assets/pieces/ver_knekht_white.png';
import verKnekhtBlack from '../assets/pieces/ver_knekht_black.png';
import scoutWhite from '../assets/pieces/scout_white.png';
import scoutBlack from '../assets/pieces/scout_black.png';

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

const PieceComponent: React.FC<PieceProps> = ({ piece, cellSize, scale = 0.9, isDragging = false }) => {
  const iconSize = cellSize * scale;
  const src = getPieceSvg(piece);

  return (
    <img
      src={src}
      alt={getPieceName(piece.type)}
      style={{
        width: iconSize,
        height: iconSize,
        pointerEvents: 'none',
        userSelect: 'none',
        // @ts-ignore webkit drag
        WebkitUserDrag: 'none',
        opacity: isDragging ? 0.5 : 1,
        position: 'absolute',
        bottom: cellSize * 0.02,
        left: '50%',
        transform: 'translateX(-50%)',
        objectFit: 'contain',
      }}
      draggable={false}
    />
  );
};

export default PieceComponent;
