import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, getViewMode } from './stores/gameStore';
import { PieceColor } from './logic/pieces';
import Board from './components/Board';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import PieceTray from './components/PieceTray';
import PromotionDialog from './components/PromotionDialog';
import FolderDialog from './components/FolderDialog';
import CloseDialog from './components/CloseDialog';
import MenuPopup from './components/MenuPopup';
import IntroPage from './components/IntroPage';
import { captureScreenshot, downloadBlob } from './utils/screenshot';
import { saveSession, loadSession, clearSession, setIntroSkipped, isIntroSkipped } from './utils/persistence';

async function tauriClose() {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch {
    window.close();
  }
}

const App: React.FC = () => {
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [folderMode, setFolderMode] = useState<'party' | 'analysis'>('party');
  const [saveMessage, setSaveMessage] = useState('');
  const [showIntroPage, setShowIntroPage] = useState(false);

  const {
    board, currentTurn, moveNumber, gameMode, gameStage, reversed, partyFolder,
    moveIndicator,
    startParty, startAnalysis, startAnalysisPlay, endSession,
    clearBoard, setFirstMoveTurn, toggleAlwaysOnTop,
    restoreSession,
    setIntroSkipped: storeSetIntroSkipped,
  } = useGameStore();

  const viewMode = getViewMode({ gameMode, gameStage });

  // Startup: check for saved session or show intro
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      restoreSession(saved);
      clearSession();
    } else if (!isIntroSkipped()) {
      setShowIntroPage(true);
    }
  }, []);

  const handlePartyClick = useCallback(() => {
    if (gameMode === 'analysis' && gameStage === 'play') {
      endSession();
      return;
    }
    setFolderMode('party');
    setShowFolderDialog(true);
  }, [gameMode, gameStage, endSession]);

  const handleAnalysisClick = useCallback(() => {
    if (gameMode === 'party') {
      endSession();
      return;
    }
    startAnalysis();
  }, [gameMode, startAnalysis, endSession]);

  // Folder confirm: create folder and start mode
  const handleFolderConfirm = useCallback((folderName: string) => {
    setShowFolderDialog(false);
    if (folderMode === 'party') {
      startParty(folderName);
    } else {
      startAnalysisPlay(folderName);
    }
  }, [folderMode, startParty, startAnalysisPlay]);

  // Folder cancel: proceed WITHOUT folder (screenshots go to Images/Downloads)
  const handleFolderCancel = useCallback(() => {
    setShowFolderDialog(false);
    if (folderMode === 'party') {
      startParty(null);
    } else {
      startAnalysisPlay(null);
    }
  }, [folderMode, startParty, startAnalysisPlay]);

  const handleMinimize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {
      // dev mode fallback
    }
  }, []);

  const handleAlwaysOnTop = useCallback(async () => {
    const newValue = !useGameStore.getState().alwaysOnTop;
    toggleAlwaysOnTop();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().setAlwaysOnTop(newValue);
    } catch {
      // dev mode fallback
    }
  }, [toggleAlwaysOnTop]);

  // × button in top bar: just close, end session, NO save dialog
  const handleClose = useCallback(async () => {
    clearSession();
    endSession();
    await tauriClose();
  }, [endSession]);

  // Menu → Выход: show close dialog if active session
  const handleExit = useCallback(() => {
    if (gameMode !== 'none' && gameStage === 'play') {
      setShowCloseDialog(true);
    } else {
      clearSession();
      endSession();
      tauriClose();
    }
  }, [gameMode, gameStage, endSession]);

  const handleCloseWithEnd = useCallback(async (save: boolean) => {
    if (save) {
      const blob = await captureScreenshot();
      if (blob) downloadBlob(blob, `${moveIndicator || 'position'}.png`);
    }
    clearSession();
    endSession();
    await tauriClose();
  }, [moveIndicator, endSession]);

  const handleCloseWithoutEnd = useCallback(async (save: boolean) => {
    if (save) {
      const blob = await captureScreenshot();
      if (blob) downloadBlob(blob, `${moveIndicator || 'position'}.png`);
    }
    saveSession(board, currentTurn, moveNumber, gameMode, gameStage, partyFolder, moveIndicator);
    await tauriClose();
  }, [board, currentTurn, moveNumber, gameMode, gameStage, partyFolder, moveIndicator]);

  const handleSavePosition = useCallback(async () => {
    const blob = await captureScreenshot();
    if (blob) {
      downloadBlob(blob, `${moveIndicator || 'position'}.png`);
      setSaveMessage('Текущая позиция сохранена');
      setTimeout(() => setSaveMessage(''), 1500);
    }
  }, [moveIndicator]);

  const handleEndParty = useCallback(() => {
    endSession();
  }, [endSession]);

  const handleEnterMain = useCallback(() => setShowIntroPage(false), []);
  const handleSkipIntro = useCallback(() => setShowIntroPage(false), []);
  const handleSkipIntroForever = useCallback(() => {
    setShowIntroPage(false);
    setIntroSkipped(true);
    storeSetIntroSkipped(true);
  }, [storeSetIntroSkipped]);

  const handleReset = useCallback(() => clearBoard(), [clearBoard]);
  const handleOk = useCallback(() => {
    setFolderMode('analysis');
    setShowFolderDialog(true);
  }, []);
  const handleFirstMoveToggle = useCallback(() => {
    setFirstMoveTurn(currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE);
  }, [currentTurn, setFirstMoveTurn]);

  const cellSize = 60;

  if (showIntroPage) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <IntroPage
          onEnterMain={handleEnterMain}
          onSkip={handleSkipIntro}
          onSkipForever={handleSkipIntroForever}
          onMinimize={handleMinimize}
          onAlwaysOnTop={handleAlwaysOnTop}
          onClose={handleClose}
        />
      </div>
    );
  }

  const isExtended = viewMode === 'extended';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#e8d8c0',
      border: '3px solid #1a3060',
      boxSizing: 'border-box',
    }}>
      {/* Title bar drag area */}
      <div
        data-tauri-drag-region
        style={{
          height: 4,
          backgroundColor: '#3a8ad0',
          cursor: 'move',
          flexShrink: 0,
        }}
      />

      <TopBar
        onPartyClick={handlePartyClick}
        onAnalysisClick={handleAnalysisClick}
        onMinimize={handleMinimize}
        onAlwaysOnTop={handleAlwaysOnTop}
        onClose={handleClose}
      />

      {/* Main content — beige background per mockup */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e8d8c0',
      }}>
        {isExtended && (
          <PieceTray
            color={reversed ? PieceColor.BLACK : PieceColor.WHITE}
            cellSize={cellSize}
            side="left"
          />
        )}

        <div
          data-board-capture
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative',
          }}
        >
          <Board />
          <PromotionDialog cellSize={cellSize} />
        </div>

        {isExtended && (
          <PieceTray
            color={reversed ? PieceColor.WHITE : PieceColor.BLACK}
            cellSize={cellSize}
            side="right"
          />
        )}
      </div>

      {/* Bottom Bar */}
      <BottomBar
        onMenuClick={() => setShowMenu((prev) => !prev)}
        onResetClick={handleReset}
        onOkClick={handleOk}
        onFirstMoveToggle={handleFirstMoveToggle}
      />

      {/* Menu popup */}
      {showMenu && (
        <MenuPopup
          onClose={() => setShowMenu(false)}
          onAbout={() => setShowIntroPage(true)}
          onSavePosition={handleSavePosition}
          onSavePositionAs={handleSavePosition}
          onEndParty={handleEndParty}
          onExit={handleExit}
        />
      )}

      {showFolderDialog && (
        <FolderDialog
          onConfirm={handleFolderConfirm}
          onCancel={handleFolderCancel}
        />
      )}

      {showCloseDialog && (
        <CloseDialog
          hasActiveSession={gameMode !== 'none' && gameStage === 'play'}
          onCloseWithEnd={handleCloseWithEnd}
          onCloseWithoutEnd={handleCloseWithoutEnd}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}

      {saveMessage && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          backgroundColor: 'rgba(0, 100, 200, 0.9)',
          color: '#fff',
          borderRadius: 6,
          fontSize: 14,
          zIndex: 300,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default App;
