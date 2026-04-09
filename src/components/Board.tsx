import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { FILES, RANKS, Square, toSquare, isCastle, PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { Piece } from '../logic/pieces';
import PieceComponent, { getPieceSvg, getPieceHeightFactor } from './Piece';
import { checkPromotion } from '../logic/promotion';
import { checkScoutCapture } from '../logic/scout';

// Design colors — matched to Figma mockup
const COLORS = {
  lightSquare: '#ffffff',
  darkSquare: '#6a6a6a',
  castleSquare: '#c4c4c4',
  boardBorder: '#1a1a1a',   // dark border around the board
  notation: '#333333',       // dark text, no borders
  highlightStart: 'rgba(100, 180, 255, 0.45)',
  highlightHover: 'rgba(100, 180, 255, 0.35)',
  highlightLastMove: 'rgba(100, 180, 255, 0.2)',
  highlightSelected: 'rgba(255, 100, 100, 0.35)',
  cellBorder: 'rgba(0, 0, 0, 0.45)',
  gridLine: 'rgba(0, 0, 0, 0.45)',
  midLine: 'rgba(0, 0, 0, 0.95)',
  outerBorder: '#1a1a1a',
};

function isLightSquare(file: string, rank: number): boolean {
  const fileIdx = FILES.indexOf(file as typeof FILES[number]);
  return (fileIdx + rank) % 2 === 0;
}

interface DragState {
  piece: Piece;
  fromSquare: Square;
  x: number;
  y: number;
  hoveredSquare: Square | null;
}

const Board: React.FC = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [containerSize, setContainerSize] = useState(600);

  const {
    board, currentTurn, gameMode, gameStage, reversed, lastMove,
    promotionPending, selectedForDeletion,
    movePiece, removePiece, setSelectedForDeletion,
    setPromotionPending,
  } = useGameStore();

  const viewMode = getViewMode({ gameMode, gameStage });

  // Responsive sizing — fixed margin from window edge / bars,
  // and the board NEVER grows past the available area (no overlap with bars).
  const BOARD_MARGIN = 4; // minimal gap between board and surrounding edges
  useEffect(() => {
    const parent = boardRef.current?.parentElement;
    if (!parent) return;
    const recompute = () => {
      const maxSize = Math.min(
        parent.clientWidth - BOARD_MARGIN * 2,
        parent.clientHeight - BOARD_MARGIN * 2,
      );
      setContainerSize(Math.max(120, maxSize));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // Outer ring (second contour around the notation row): a few px on every side.
  const outerRing = Math.max(4, Math.round(containerSize * 0.012));
  const notationSize = containerSize * 0.045;
  // Extra gap below the bottom-files row and to the right of the right-ranks col,
  // so they sit visibly offset from the board.
  const bottomFileGap = Math.round(notationSize * 0.35);
  const rightRankGap = Math.round(notationSize * 0.35);
  const boardSize = containerSize - notationSize * 2 - outerRing * 2 - bottomFileGap;
  const cellSize = boardSize / 8;
  // Origin of the inner area (notation + board) inside the outer ring.
  const innerOrigin = outerRing;

  const getFiles = useCallback(() => reversed ? [...FILES].reverse() : [...FILES], [reversed]);
  const getRanks = useCallback(() => reversed ? [...RANKS] : [...RANKS].reverse(), [reversed]);

  const getSquareFromPos = useCallback((clientX: number, clientY: number): Square | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const offset = innerOrigin + notationSize;
    const x = clientX - rect.left - offset;
    const y = clientY - rect.top - offset;
    if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null;

    const files = getFiles();
    const ranks = getRanks();
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;

    return toSquare(files[col], ranks[row]);
  }, [boardSize, cellSize, notationSize, innerOrigin, getFiles, getRanks]);

  const canMove = gameMode !== 'none' && gameStage === 'play' && !promotionPending;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !canMove) return;
    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) return;

    // If we have a piece selected for deletion, clicking selects a new one
    const piece = board.get(sq);
    if (!piece) return;

    // Can only move own pieces
    if (piece.color !== currentTurn) return;

    setDragState({
      piece,
      fromSquare: sq,
      x: e.clientX,
      y: e.clientY,
      hoveredSquare: sq,
    });
  }, [board, currentTurn, canMove, getSquareFromPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    const sq = getSquareFromPos(e.clientX, e.clientY);
    setDragState((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY, hoveredSquare: sq } : null);
  }, [dragState, getSquareFromPos]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;

    const targetSq = getSquareFromPos(e.clientX, e.clientY);

    if (!targetSq) {
      // Check if we have a last hovered square to snap to
      if (dragState.hoveredSquare && dragState.hoveredSquare !== dragState.fromSquare) {
        // Snap to last hovered square (between-cells case)
        const snapSq = dragState.hoveredSquare;
        const snapTarget = board.get(snapSq);
        if (!snapTarget || snapTarget.color !== dragState.piece.color) {
          movePiece(dragState.fromSquare, snapSq);
          setDragState(null);
          return;
        }
      }
      // No valid snap target — piece disappears (dragged off board)
      removePiece(dragState.fromSquare);
      // Advance turn
      const store = useGameStore.getState();
      const nextTurn = store.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      const nextMoveNumber = nextTurn === PieceColor.WHITE ? store.moveNumber + 1 : store.moveNumber;
      const indicator = nextTurn === PieceColor.WHITE
        ? `${nextMoveNumber}. __ хб`
        : `${nextMoveNumber} … __ хч`;
      useGameStore.setState({
        currentTurn: nextTurn,
        moveNumber: nextMoveNumber,
        moveIndicator: indicator,
        lastMove: { from: dragState.fromSquare, to: null },
      });
      setDragState(null);
      return;
    }

    if (targetSq === dragState.fromSquare) {
      // Clicked same square — no move, just deselect drag
      setDragState(null);
      return;
    }

    // Check if target has own piece
    const targetPiece = board.get(targetSq);
    if (targetPiece && targetPiece.color === dragState.piece.color) {
      // Can't place on own piece - snap back or go to last hovered
      setDragState(null);
      return;
    }

    // Check scout special capture
    const scoutResult = checkScoutCapture(dragState.piece, dragState.fromSquare, targetSq, board);
    if (scoutResult) {
      // Both pieces disappear
      const newBoard = new Map(board);
      newBoard.delete(dragState.fromSquare);
      newBoard.delete(targetSq);
      const store = useGameStore.getState();
      const nextTurn = store.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      const nextMoveNumber = nextTurn === PieceColor.WHITE ? store.moveNumber + 1 : store.moveNumber;
      const indicator = nextTurn === PieceColor.WHITE
        ? `${nextMoveNumber}. __ хб`
        : `${nextMoveNumber} … __ хч`;

      // Record in history
      const newHistory = store.history.slice(0, store.historyIndex + 1);
      newHistory.push({
        board: boardToSerializable(newBoard),
        moveNumber: nextMoveNumber,
        currentTurn: nextTurn,
        indicator,
      });

      useGameStore.setState({
        board: newBoard,
        currentTurn: nextTurn,
        moveNumber: nextMoveNumber,
        lastMove: { from: dragState.fromSquare, to: targetSq },
        moveIndicator: indicator,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
      setDragState(null);
      return;
    }

    // Knekht movement restrictions
    const targetRank = parseInt(targetSq[1]);
    if (dragState.piece.type === PieceType.KNEKHT && dragState.piece.color === PieceColor.WHITE && targetRank >= 7) {
      setDragState(null);
      return;
    }
    if (dragState.piece.type === PieceType.KNEKHT && dragState.piece.color === PieceColor.BLACK && targetRank <= 2) {
      setDragState(null);
      return;
    }

    // Normal move (including capture)
    movePiece(dragState.fromSquare, targetSq);

    // Promotions only in actual play — never during "Задать позицию".
    const movedPiece = dragState.piece;
    const promotion = gameStage === 'play' ? checkPromotion(movedPiece, targetSq) : null;
    if (promotion) {
      if (promotion.auto) {
        // Auto-promote knekht -> ver_knekht
        const store = useGameStore.getState();
        const newBoard = new Map(store.board);
        newBoard.set(targetSq, { type: PieceType.VER_KNEKHT, color: movedPiece.color });
        useGameStore.setState({ board: newBoard });
      } else {
        setPromotionPending({
          square: targetSq,
          piece: movedPiece,
          options: promotion.options!,
        });
      }
    }

    setDragState(null);
  }, [dragState, board, movePiece, removePiece, getSquareFromPos, viewMode, setSelectedForDeletion, setPromotionPending]);

  // Handle click for piece selection (for deletion)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragState) return;
    if (gameStage !== 'setup' && gameStage !== 'play') return;

    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) {
      setSelectedForDeletion(null);
      return;
    }

    const piece = board.get(sq);
    if (piece) {
      setSelectedForDeletion(sq);
    } else {
      setSelectedForDeletion(null);
    }
  }, [dragState, board, gameStage, getSquareFromPos, setSelectedForDeletion]);

  // Analysis setup - allow placing any piece
  const handleSetupMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || gameStage !== 'setup') return;
    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) return;

    const piece = board.get(sq);
    if (!piece) return;

    setDragState({
      piece,
      fromSquare: sq,
      x: e.clientX,
      y: e.clientY,
      hoveredSquare: sq,
    });
  }, [board, gameStage, getSquareFromPos]);

  const handleSetupMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragState || gameStage !== 'setup') return;

    const targetSq = getSquareFromPos(e.clientX, e.clientY);
    if (!targetSq) {
      // Remove piece if dragged off board
      removePiece(dragState.fromSquare);
      setDragState(null);
      return;
    }

    if (targetSq !== dragState.fromSquare) {
      // Knekht cannot be placed on its forbidden ranks even during setup.
      const p = dragState.piece;
      const targetRank = parseInt(targetSq[1], 10);
      const blocked =
        p.type === PieceType.KNEKHT &&
        ((p.color === PieceColor.WHITE && targetRank >= 7) ||
         (p.color === PieceColor.BLACK && targetRank <= 2));
      if (!blocked) {
        movePiece(dragState.fromSquare, targetSq);
      }
    }

    setDragState(null);
  }, [dragState, gameStage, getSquareFromPos, movePiece, removePiece]);

  const isSetup = gameStage === 'setup';

  // Handle HTML5 drop from PieceTray (analysis setup)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (gameStage !== 'setup') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, [gameStage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (gameStage !== 'setup') return;
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const piece = JSON.parse(data) as Piece;
      const sq = getSquareFromPos(e.clientX, e.clientY);
      if (sq) {
        const { placePiece } = useGameStore.getState();
        placePiece(sq, piece);
      }
    } catch {
      // Invalid data
    }
  }, [gameStage, getSquareFromPos]);

  // Handle click for piece selection (for deletion) in play mode too
  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    if (dragState) return;
    if (gameMode === 'none') return;

    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) {
      setSelectedForDeletion(null);
      return;
    }

    const piece = board.get(sq);
    if (piece) {
      setSelectedForDeletion(sq);
    } else {
      setSelectedForDeletion(null);
    }
  }, [dragState, board, gameMode, getSquareFromPos, setSelectedForDeletion]);

  const renderSquare = (file: string, rank: number, colIdx: number, rowIdx: number) => {
    const sq = toSquare(file, rank);
    const piece = board.get(sq);
    const isLight = isLightSquare(file, rank);
    const castle = isCastle(sq);

    let bgColor = isLight ? COLORS.lightSquare : COLORS.darkSquare;
    if (castle) bgColor = COLORS.castleSquare;

    // No special line between ranks 4 and 5 — same divider as everywhere else.

    let highlight = '';
    if (dragState?.fromSquare === sq) {
      highlight = COLORS.highlightStart;
    } else if (dragState?.hoveredSquare === sq && dragState.fromSquare !== sq) {
      highlight = COLORS.highlightHover;
    } else if (lastMove.to === sq && !dragState) {
      highlight = COLORS.highlightLastMove;
    }
    if (selectedForDeletion === sq) {
      highlight = COLORS.highlightSelected;
    }

    const isDragging = dragState?.fromSquare === sq;

    return (
      <div
        key={sq}
        data-square={sq}
        style={{
          position: 'absolute',
          left: colIdx * cellSize,
          top: rowIdx * cellSize,
          width: cellSize,
          height: cellSize,
          backgroundColor: bgColor,
          borderRight: `1px solid ${COLORS.gridLine}`,
          borderBottom: `1px solid ${COLORS.cellBorder}`,
          boxSizing: 'border-box',
        }}
      >
        {castle && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="castleHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#castleHatch)" />
          </svg>
        )}
        {highlight && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: highlight,
            pointerEvents: 'none',
          }} />
        )}
        {piece && (
          <PieceComponent
            piece={piece}
            cellSize={cellSize}
            scale={0.95}
            isDragging={isDragging}
          />
        )}
      </div>
    );
  };

  const files = getFiles();
  const ranks = getRanks();

  return (
    <div
      ref={boardRef}
      data-board-root
      style={{
        width: containerSize,
        height: containerSize,
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseDown={isSetup ? handleSetupMouseDown : handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={isSetup ? handleSetupMouseUp : handleMouseUp}
      onClick={isSetup ? handleClick : handlePlayClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Outer second contour around the notation row */}
      <div data-board-outer style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: containerSize,
        height: containerSize - bottomFileGap + outerRing, // visually contains the offset bottom row too
        border: `2px solid ${COLORS.outerBorder}`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }} />

      {/* Left notation (ranks) — plain text, no borders */}
      <div style={{
        position: 'absolute',
        left: innerOrigin,
        top: innerOrigin + notationSize,
        width: notationSize,
        height: boardSize,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {ranks.map((rank) => (
          <div key={rank} style={{
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.notation,
            fontSize: cellSize * 0.28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
          }}>
            {rank}
          </div>
        ))}
      </div>

      {/* Right notation (ranks) — shifted further right per design */}
      <div style={{
        position: 'absolute',
        left: innerOrigin + notationSize + boardSize + rightRankGap,
        top: innerOrigin + notationSize,
        width: notationSize,
        height: boardSize,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {ranks.map((rank) => (
          <div key={rank} style={{
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.notation,
            fontSize: cellSize * 0.28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
          }}>
            {rank}
          </div>
        ))}
      </div>

      {/* Top notation (files) — plain text */}
      <div style={{
        position: 'absolute',
        left: innerOrigin + notationSize,
        top: innerOrigin,
        width: boardSize,
        height: notationSize,
        display: 'flex',
        flexDirection: 'row',
      }}>
        {files.map((file) => (
          <div key={file} style={{
            width: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.notation,
            fontSize: cellSize * 0.28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
          }}>
            {file}
          </div>
        ))}
      </div>

      {/* Bottom notation (files) — dropped below the board */}
      <div style={{
        position: 'absolute',
        left: innerOrigin + notationSize,
        top: innerOrigin + notationSize + boardSize + bottomFileGap,
        width: boardSize,
        height: notationSize,
        display: 'flex',
        flexDirection: 'row',
      }}>
        {files.map((file) => (
          <div key={file} style={{
            width: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.notation,
            fontSize: cellSize * 0.28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
          }}>
            {file}
          </div>
        ))}
      </div>

      {/* Board squares — dark inner border around the board */}
      <div data-board-squares style={{
        position: 'absolute',
        left: innerOrigin + notationSize,
        top: innerOrigin + notationSize,
        width: boardSize,
        height: boardSize,
        border: `2px solid ${COLORS.boardBorder}`,
        boxSizing: 'content-box',
      }}>
        {ranks.map((rank, rowIdx) =>
          files.map((file, colIdx) =>
            renderSquare(file, rank, colIdx, rowIdx)
          )
        )}

        {/* Thick black line between ranks 4 and 5 — always at mid-board */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: cellSize * 4 - 1,
          height: 2,
          backgroundColor: '#000000',
          pointerEvents: 'none',
        }} />

        {/* Castle outlines — c..f on rank 1 and rank 8 */}
        {(() => {
          const castleCols = files.map((f, i) => ['c','d','e','f'].includes(f) ? i : -1).filter(i => i >= 0);
          if (castleCols.length !== 4) return null;
          const minCol = Math.min(...castleCols);
          const ranksList = ranks;
          const row1 = ranksList.indexOf(1);
          const row8 = ranksList.indexOf(8);
          const BW = 2;
          const mkBox = (row: number) => (
            <div key={row} style={{
              position: 'absolute',
              left: minCol * cellSize,
              top: row * cellSize,
              width: cellSize * 4,
              height: cellSize,
              border: `${BW}px solid #000000`,
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }} />
          );
          // Internal vertical separators (thicker than regular grid)
          const mkVerts = (row: number) => [1, 2, 3].map(i => (
            <div key={`v-${row}-${i}`} style={{
              position: 'absolute',
              left: (minCol + i) * cellSize - 0.75,
              top: row * cellSize,
              width: 1.5,
              height: cellSize,
              backgroundColor: '#000000',
              pointerEvents: 'none',
            }} />
          ));
          return (
            <>
              {mkBox(row1)}
              {mkBox(row8)}
              {mkVerts(row1)}
              {mkVerts(row8)}
            </>
          );
        })()}
      </div>

      {/* Drag ghost — same height as on-board (no enlargement on drag) */}
      {dragState && (() => {
        const ghostHeight = cellSize * 0.95 * getPieceHeightFactor(dragState.piece.type);
        return (
        <img
          src={getPieceSvg(dragState.piece)}
          style={{
            position: 'fixed',
            left: dragState.x - ghostHeight / 2,
            top: dragState.y - ghostHeight / 2,
            height: ghostHeight,
            width: 'auto',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.9,
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          }}
          draggable={false}
        />
      );})()}
    </div>
  );
};

export default Board;
