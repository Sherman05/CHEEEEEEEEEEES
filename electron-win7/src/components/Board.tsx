import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { FILES, RANKS, Square, toSquare, isCastle, PieceColor, PieceType, boardToSerializable } from '../logic/pieces';
import type { Piece } from '../logic/pieces';
import PieceComponent, { getPieceSvg, getPieceHeightFactor } from './Piece';
import { checkPromotion } from '../logic/promotion';
import { resolveMove, MSG_NO_MAJORITY, MSG_CASTLE_NON_ROYAL, MSG_ROYAL_CASTLE_EXIT } from '../engine';

// Design colors — matched to Figma mockup
const COLORS = {
  lightSquare: '#ffffff',
  darkSquare: '#6a6a6a',
  castleSquare: '#c4c4c4',
  boardBorder: '#1a1a1a',   // dark border around the board
  notation: '#333333',       // dark text, no borders
  highlightStart: 'rgba(100, 180, 255, 0.45)',
  highlightHover: 'rgba(100, 180, 255, 0.35)',
  highlightLastMove: 'rgba(70, 130, 220, 0.45)',
  highlightLastMoveTo: 'rgba(255, 120, 130, 0.35)',
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
  const justDraggedRef = useRef(false);

  const {
    board, currentTurn, gameMode, gameStage, reversed, lastMove,
    promotionPending, selectedForDeletion,
    movePiece, setSelectedForDeletion,
    setPromotionPending, setMoveMessage, commitMove,
  } = useGameStore();

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
    // TASK-01: drop outside any valid cell → revert. No move, no turn change.
    // The dragged piece was never removed from `board`, so setDragState(null)
    // snaps it back. This React handler fires for releases over the board
    // element; releases elsewhere are caught by the window-level mouseup
    // listener registered while a drag is active (see below).
    if (!targetSq) {
      justDraggedRef.current = true;
      setDragState(null);
      return;
    }

    const resolvedSq: Square = targetSq;

    if (resolvedSq === dragState.fromSquare) {
      // Same square — no move; allow the click handler to fire (selection toggle).
      setDragState(null);
      return;
    }

    // ── Rules engine: resolve the move (pure), then apply the result ─────────
    // Party enforces strict turn order (§9); analysis-play passes no turn (free).
    // resolveMove validates, builds the next board (capture kind) and next side;
    // this component only applies its result to the store + GUI.
    const turn = gameMode === 'party' ? currentTurn : undefined;
    const res = resolveMove(board, dragState.fromSquare, resolvedSq, turn);

    if (!res.allowed) {
      // §8: brief, non-blocking message for the spec'd rule rejections — no
      // majority, a non-royal on a castle cell, and the §6 royal-castle-exit
      // ban. Moves rejected on pure geometry or onto a friendly piece stay silent.
      if (
        res.reason === MSG_NO_MAJORITY ||
        res.reason === MSG_CASTLE_NON_ROYAL ||
        res.reason === MSG_ROYAL_CASTLE_EXIT
      ) {
        setMoveMessage(res.reason);
      }
      // Suppress the click that fires right after this drag-release. Without
      // this, when the drop cell is occupied (illegal capture, onto-friendly,
      // non-royal-on-castle, or any blocked move onto a piece) the trailing
      // click would select that piece (red selection highlight) and leave it
      // lit after the §8 toast fades. Matches the no-target / success branches.
      justDraggedRef.current = true;
      setDragState(null);
      return;
    }

    commitMove(res.nextBoard, res.nextTurn, dragState.fromSquare, resolvedSq);

    // Promotions only in actual play, and never for a scout-exchange (the piece
    // is gone). Never during "Задать позицию".
    const movedPiece = dragState.piece;
    const promotion =
      res.captureKind !== 'scout-exchange' && gameStage === 'play'
        ? checkPromotion(movedPiece, resolvedSq)
        : null;
    if (promotion) {
      if (promotion.auto) {
        // Auto-promote knekht -> ver_knekht (update board AND history)
        const store = useGameStore.getState();
        const newBoard = new Map(store.board);
        newBoard.set(resolvedSq, { type: PieceType.VER_KNEKHT, color: movedPiece.color });
        const newHistory = [...store.history];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = {
            ...newHistory[newHistory.length - 1],
            board: boardToSerializable(newBoard),
          };
        }
        useGameStore.setState({ board: newBoard, history: newHistory });
      } else {
        setPromotionPending({
          square: resolvedSq,
          piece: movedPiece,
          options: promotion.options!,
        });
      }
    }

    justDraggedRef.current = true;
    setDragState(null);
  }, [dragState, board, currentTurn, gameMode, gameStage, commitMove, getSquareFromPos, setPromotionPending, setMoveMessage]);

  // Handle click for piece selection (for deletion)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (justDraggedRef.current) { justDraggedRef.current = false; return; }
    if (dragState) return;
    if (gameStage !== 'setup' && gameStage !== 'play') return;

    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) {
      setSelectedForDeletion(null);
      return;
    }

    const piece = board.get(sq);
    if (piece) {
      // #6: Toggle — clicking the same piece deselects it
      if (selectedForDeletion === sq) {
        setSelectedForDeletion(null);
      } else {
        setSelectedForDeletion(sq);
      }
    } else {
      setSelectedForDeletion(null);
    }
  }, [dragState, board, gameStage, selectedForDeletion, getSquareFromPos, setSelectedForDeletion]);

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
    // TASK-01 (+ followup): drop outside any valid cell → revert. Do NOT remove
    // the piece — it stays on dragState.fromSquare; setDragState(null) clears
    // the drag state and re-renders so the piece reappears at full opacity.
    // Releases outside the board element are handled by the window-level
    // mouseup listener registered while a drag is active (see below).
    if (!targetSq) {
      justDraggedRef.current = true;
      setDragState(null);
      return;
    }

    if (targetSq !== dragState.fromSquare) {
      // Knekht/VerKnecht cannot be placed on their forbidden ranks even during setup.
      const p = dragState.piece;
      const targetRank = parseInt(targetSq[1], 10);
      const knekhtBlocked =
        p.type === PieceType.KNEKHT &&
        ((p.color === PieceColor.WHITE && targetRank >= 6) ||
         (p.color === PieceColor.BLACK && targetRank <= 3));
      // TASK-03: VerKnecht must promote at last rank → no manual placement there.
      const verKnekhtBlocked =
        p.type === PieceType.VER_KNEKHT &&
        ((p.color === PieceColor.WHITE && targetRank === 8) ||
         (p.color === PieceColor.BLACK && targetRank === 1));
      if (!knekhtBlocked && !verKnekhtBlocked) {
        movePiece(dragState.fromSquare, targetSq);
      }
      // TASK-02: only suppress the next click when an actual drag-move was attempted.
      // A pure click (mousedown+up on same cell) must let the click handler run so
      // selectedForDeletion gets set and the "Удалить фигуру" button enables.
      justDraggedRef.current = true;
    }

    setDragState(null);
  }, [dragState, gameStage, getSquareFromPos, movePiece]);

  const isSetup = gameStage === 'setup';

  // TASK-01 followup: the board's onMouseUp / onMouseMove only fire for events
  // that occur over the board element. If a drag is released over a sibling
  // element (the move list, a toolbar) or outside the window entirely, that
  // handler never runs — so the drag ghost stays frozen at the board edge and
  // the source square stays dimmed forever. While a drag is active, also listen
  // on `window`: keep the ghost glued to the cursor past the board edge, and on
  // release outside the board fully revert. The dragged piece is never removed
  // from `board` during a drag, so clearing dragState alone restores it to
  // fromSquare on the re-render (ghost gone, source square un-dimmed). Events
  // that land back on the board are deferred to the board's own handlers (the
  // `overBoard` guard), so a drop is never handled twice.
  useEffect(() => {
    if (!dragState) return;
    const overBoard = (t: EventTarget | null): boolean =>
      t instanceof Node && !!boardRef.current && boardRef.current.contains(t);
    const onWindowMove = (e: MouseEvent) => {
      if (overBoard(e.target)) return;
      setDragState((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY, hoveredSquare: null } : null);
    };
    const onWindowUp = (e: MouseEvent) => {
      if (overBoard(e.target)) return;
      setDragState(null);
    };
    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('mouseup', onWindowUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMove);
      window.removeEventListener('mouseup', onWindowUp);
    };
  }, [dragState]);

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
    if (justDraggedRef.current) { justDraggedRef.current = false; return; }
    if (dragState) return;
    if (gameMode === 'none') return;

    const sq = getSquareFromPos(e.clientX, e.clientY);
    if (!sq) {
      setSelectedForDeletion(null);
      return;
    }

    const piece = board.get(sq);
    if (piece) {
      if (selectedForDeletion === sq) {
        setSelectedForDeletion(null);
      } else {
        setSelectedForDeletion(sq);
      }
    } else {
      setSelectedForDeletion(null);
    }
  }, [dragState, board, gameMode, selectedForDeletion, getSquareFromPos, setSelectedForDeletion]);

  const renderSquare = (file: string, rank: number, colIdx: number, rowIdx: number) => {
    const sq = toSquare(file, rank);
    const piece = board.get(sq);
    const isLight = isLightSquare(file, rank);
    const castle = isCastle(sq);

    let bgColor = isLight ? COLORS.lightSquare : COLORS.darkSquare;
    if (castle) bgColor = COLORS.castleSquare;

    // No special line between ranks 4 and 5 — same divider as everywhere else.

    // Highlight priority: lastMove is king — nothing overwrites it after a move.
    // During drag, show drag-related highlights instead.
    let highlight = '';
    if (dragState) {
      if (dragState.fromSquare === sq) {
        highlight = COLORS.highlightStart;
      } else if (dragState.hoveredSquare === sq && dragState.fromSquare !== sq) {
        highlight = COLORS.highlightHover;
      }
    } else if (lastMove.to === sq) {
      highlight = COLORS.highlightLastMoveTo;   // розовый — ALWAYS
    } else if (lastMove.from === sq) {
      highlight = COLORS.highlightLastMove;      // голубой — ALWAYS
    } else if (selectedForDeletion === sq) {
      highlight = COLORS.highlightSelected;
    }

    const isDragging = dragState?.fromSquare === sq;

    // Hide cell borderRight for squares immediately left of the castle (b1, b8)
    // to prevent doubling with the castle's left vertical line.
    const isLeftOfCastle = file === 'b' && (rank === 1 || rank === 8);

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
          borderRight: isLeftOfCastle ? 'none' : `1px solid ${COLORS.gridLine}`,
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

        {/* Castle outlines — c..f on rank 1 and rank 8.
            Drawn as individual lines (divs) to avoid CSS border doubling
            with the outer board contour.
            - rank 1 (bottom when normal): draw TOP horizontal only
            - rank 8 (top when normal): draw BOTTOM horizontal only
            All 5 vertical lines (left edge, 3 internal, right edge) are 1.5px. */}
        {(() => {
          const castleCols = files.map((f, i) => ['c','d','e','f'].includes(f) ? i : -1).filter(i => i >= 0);
          if (castleCols.length !== 4) return null;
          const minCol = Math.min(...castleCols);
          const row1 = ranks.indexOf(1);
          const row8 = ranks.indexOf(8);
          const LW = 1.5; // line width for all castle lines

          // One horizontal line for each castle (the side NOT touching board edge)
          const mkHoriz = (row: number, isRank1: boolean) => {
            // rank 1 at board bottom (normal) or top (reversed)
            const atBottom = (isRank1 && !reversed) || (!isRank1 && reversed);
            // Draw the OPPOSITE side: if castle is at bottom, draw its top line; vice versa
            const yPos = atBottom
              ? row * cellSize                        // top edge of the row
              : (row + 1) * cellSize - LW;            // bottom edge of the row
            return (
              <div key={`castle-h-${row}`} style={{
                position: 'absolute',
                left: minCol * cellSize,
                top: yPos,
                width: cellSize * 4,
                height: LW,
                backgroundColor: '#000000',
                pointerEvents: 'none',
              }} />
            );
          };

          // 5 vertical lines: left edge (i=0), 3 internal dividers (i=1,2,3), right edge (i=4)
          const mkVerts = (row: number) => [0, 1, 2, 3, 4].map(i => (
            <div key={`v-${row}-${i}`} style={{
              position: 'absolute',
              left: (minCol + i) * cellSize - LW / 2,
              top: row * cellSize,
              width: LW,
              height: cellSize,
              backgroundColor: '#000000',
              pointerEvents: 'none',
            }} />
          ));

          return (
            <>
              {mkHoriz(row1, true)}
              {mkHoriz(row8, false)}
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
