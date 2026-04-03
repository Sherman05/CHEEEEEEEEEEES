import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore, getViewMode } from '../stores/gameStore';
import { FILES, RANKS, Square, toSquare, isCastle, PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { Piece } from '../logic/pieces';
import PieceComponent, { getPieceSvg } from './Piece';
import { checkPromotion } from '../logic/promotion';
import { checkScoutCapture } from '../logic/scout';

// Design colors — matched to screenshot
const COLORS = {
  lightSquare: '#ffffff',
  darkSquare: '#b8b8b8',
  castleSquare: '#dcdcdc',
  border: '#1060d0',
  borderOuter: '#0040ee',
  notation: '#ffffff',
  highlightStart: 'rgba(100, 180, 255, 0.45)',
  highlightHover: 'rgba(100, 180, 255, 0.35)',
  highlightLastMove: 'rgba(100, 180, 255, 0.2)',
  highlightSelected: 'rgba(255, 100, 100, 0.35)',
  cellBorder: 'rgba(0, 0, 0, 0.25)',
  gridLine: 'rgba(80, 160, 255, 0.3)',
};

function isLightSquare(file: string, rank: number): boolean {
  const fileIdx = FILES.indexOf(file as typeof FILES[number]);
  return (fileIdx + rank) % 2 !== 0;
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

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current?.parentElement) {
        const parent = boardRef.current.parentElement;
        const maxSize = Math.min(parent.clientWidth - 20, parent.clientHeight - 20);
        setContainerSize(Math.max(300, maxSize));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const notationSize = containerSize * 0.04;
  const borderSize = containerSize * 0.025; // thicker blue border per screenshot
  const boardSize = containerSize - (notationSize + borderSize) * 2;
  const cellSize = boardSize / 8;

  const getFiles = useCallback(() => reversed ? [...FILES].reverse() : [...FILES], [reversed]);
  const getRanks = useCallback(() => reversed ? [...RANKS] : [...RANKS].reverse(), [reversed]);

  const getSquareFromPos = useCallback((clientX: number, clientY: number): Square | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const offset = notationSize + borderSize;
    const x = clientX - rect.left - offset;
    const y = clientY - rect.top - offset;
    if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null;

    const files = getFiles();
    const ranks = getRanks();
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;

    return toSquare(files[col], ranks[row]);
  }, [boardSize, cellSize, notationSize, borderSize, getFiles, getRanks]);

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

    // Normal move (including capture)
    movePiece(dragState.fromSquare, targetSq);

    // Check promotions
    const movedPiece = dragState.piece;
    const promotion = checkPromotion(movedPiece, targetSq);
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
      movePiece(dragState.fromSquare, targetSq);
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
      {/* Outer border */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: `${borderSize * 1.5}px solid ${COLORS.borderOuter}`,
        borderRadius: 3,
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Inner area with notation */}
      <div style={{
        position: 'absolute',
        left: borderSize,
        top: borderSize,
        right: borderSize,
        bottom: borderSize,
        backgroundColor: COLORS.border,
      }}>
        {/* Left notation (ranks) */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: notationSize,
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

        {/* Right notation (ranks) */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: notationSize,
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

        {/* Top notation (files) */}
        <div style={{
          position: 'absolute',
          left: notationSize,
          top: 0,
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

        {/* Bottom notation (files) */}
        <div style={{
          position: 'absolute',
          left: notationSize,
          bottom: 0,
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

        {/* Board squares */}
        <div style={{
          position: 'absolute',
          left: notationSize,
          top: notationSize,
          width: boardSize,
          height: boardSize,
        }}>
          {ranks.map((rank, rowIdx) =>
            files.map((file, colIdx) =>
              renderSquare(file, rank, colIdx, rowIdx)
            )
          )}
        </div>
      </div>

      {/* Drag ghost */}
      {dragState && (
        <img
          src={getPieceSvg(dragState.piece)}
          style={{
            position: 'fixed',
            left: dragState.x - cellSize * 0.45,
            top: dragState.y - cellSize * 0.45,
            width: cellSize * 0.9,
            height: cellSize * 0.9,
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.9,
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          }}
          draggable={false}
        />
      )}
    </div>
  );
};

export default Board;
