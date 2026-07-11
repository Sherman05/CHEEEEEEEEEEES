import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, getViewMode } from './stores/gameStore';
import { PieceColor } from './logic/pieces';
import Board from './components/Board';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import PieceTray from './components/PieceTray';
import FolderDialog from './components/FolderDialog';
import CloseDialog from './components/CloseDialog';
import MenuPopup from './components/MenuPopup';
import IntroPage from './components/IntroPage';
import { captureScreenshot, saveToDisk } from './utils/screenshot';
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
  const [showEndPartyDialog, setShowEndPartyDialog] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [folderMode, setFolderMode] = useState<'party' | 'analysis'>('party');
  const [saveMessage, setSaveMessage] = useState('');
  const [showIntroPage, setShowIntroPage] = useState(false);
  const [returnFromIntro, setReturnFromIntro] = useState(false);

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

  const handleFolderConfirm = useCallback((folderName: string) => {
    setShowFolderDialog(false);
    if (folderMode === 'party') {
      startParty(folderName);
    } else {
      startAnalysisPlay(folderName);
    }
  }, [folderMode, startParty, startAnalysisPlay]);

  // Skip = proceed WITHOUT folder
  const handleFolderCancel = useCallback(() => {
    setShowFolderDialog(false);
    if (folderMode === 'party') {
      startParty(null);
    } else {
      startAnalysisPlay(null);
    }
  }, [folderMode, startParty, startAnalysisPlay]);

  // Dismiss (X) = cancel action entirely, return to previous state
  const handleFolderDismiss = useCallback(() => {
    setShowFolderDialog(false);
    // If from analysis setup → Ok, return to setup (do nothing, already in setup)
    // If from start → party, return to start (do nothing, already in start)
    // No state change needed — we just close the dialog
  }, []);

  const handleMinimize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {
      // dev mode
    }
  }, []);

  // Поверх всех окон = setAlwaysOnTop per TZ 6.1
  const handleAlwaysOnTop = useCallback(async () => {
    const newValue = !useGameStore.getState().alwaysOnTop;
    toggleAlwaysOnTop();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().setAlwaysOnTop(newValue);
    } catch {
      // dev mode
    }
  }, [toggleAlwaysOnTop]);

  // × button AND Menu→Выход: show dialog if session active, per TZ 10.2
  const handleClose = useCallback(() => {
    if (gameMode !== 'none' && gameStage === 'play') {
      setShowCloseDialog(true);
    } else {
      clearSession();
      tauriClose();
    }
  }, [gameMode, gameStage]);

  // Close dialog: end party + close
  const handleCloseWithEnd = useCallback(async (save: boolean) => {
    if (save) {
      const blob = await captureScreenshot();
      if (blob) await saveToDisk(blob, `${moveIndicator || 'position'}.png`, partyFolder);
    }
    clearSession();
    endSession();
    await tauriClose();
  }, [moveIndicator, partyFolder, endSession]);

  // Close dialog: close WITHOUT ending party → save session for restore
  const handleCloseWithoutEnd = useCallback(async (save: boolean) => {
    if (save) {
      const blob = await captureScreenshot();
      if (blob) await saveToDisk(blob, `${moveIndicator || 'position'}.png`, partyFolder);
    }
    // Save session so next launch restores this position (TZ 10.4)
    saveSession(board, currentTurn, moveNumber, gameMode, gameStage, partyFolder, moveIndicator);
    await tauriClose();
  }, [board, currentTurn, moveNumber, gameMode, gameStage, partyFolder, moveIndicator]);

  // Menu → Сохранить позицию
  const handleSavePosition = useCallback(async () => {
    const blob = await captureScreenshot();
    if (blob) {
      await saveToDisk(blob, `${moveIndicator || 'position'}.png`, partyFolder);
      setSaveMessage('Текущая позиция сохранена');
      setTimeout(() => setSaveMessage(''), 1500);
    }
  }, [moveIndicator, partyFolder]);

  // Menu → Сохранить позицию как
  const handleSavePositionAs = useCallback(() => {
    setSaveAsName(moveIndicator || 'position');
    setShowSaveAsDialog(true);
  }, [moveIndicator]);

  const handleSaveAsConfirm = useCallback(async () => {
    setShowSaveAsDialog(false);
    const blob = await captureScreenshot();
    if (blob) {
      await saveToDisk(blob, `${saveAsName.trim() || 'position'}.png`, partyFolder);
      setSaveMessage('Текущая позиция сохранена');
      setTimeout(() => setSaveMessage(''), 1500);
    }
  }, [saveAsName, partyFolder]);

  // Menu → Завершить партию: show dialog per TZ 10.1
  const handleEndPartyMenu = useCallback(() => {
    setShowEndPartyDialog(true);
  }, []);

  const handleEndPartyConfirm = useCallback(async (save: boolean) => {
    setShowEndPartyDialog(false);
    if (save) {
      const blob = await captureScreenshot();
      if (blob) await saveToDisk(blob, `${moveIndicator || 'position'}.png`, partyFolder);
    }
    clearSession();
    endSession();
  }, [moveIndicator, partyFolder, endSession]);

  // About: open intro, return to current mode after
  const handleAbout = useCallback(() => {
    setReturnFromIntro(true);
    setShowIntroPage(true);
  }, []);

  const handleEnterMain = useCallback(() => {
    setShowIntroPage(false);
    setReturnFromIntro(false);
  }, []);
  const handleSkipIntro = useCallback(() => {
    setShowIntroPage(false);
    setReturnFromIntro(false);
  }, []);
  const handleSkipIntroForever = useCallback(() => {
    setShowIntroPage(false);
    setReturnFromIntro(false);
    if (!returnFromIntro) {
      setIntroSkipped(true);
      storeSetIntroSkipped(true);
    }
  }, [returnFromIntro, storeSetIntroSkipped]);

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
          fromAbout={returnFromIntro}
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
      backgroundColor: '#e8e8e8',
      boxSizing: 'border-box',
    }}>
      <TopBar
        onPartyClick={handlePartyClick}
        onAnalysisClick={handleAnalysisClick}
        onMinimize={handleMinimize}
        onAlwaysOnTop={handleAlwaysOnTop}
        onClose={handleClose}
      />

      {/* Main content */}
      <div style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e8e8e8',
        padding: 0,
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
          onAbout={handleAbout}
          onSavePosition={handleSavePosition}
          onSavePositionAs={handleSavePositionAs}
          onEndParty={handleEndPartyMenu}
          onExit={handleClose}
        />
      )}

      {showFolderDialog && (
        <FolderDialog
          onConfirm={handleFolderConfirm}
          onCancel={handleFolderCancel}
          onDismiss={handleFolderDismiss}
        />
      )}

      {/* Close dialog — TZ 10.2 */}
      {showCloseDialog && (
        <CloseDialog
          hasActiveSession={gameMode !== 'none' && gameStage === 'play'}
          onCloseWithEnd={handleCloseWithEnd}
          onCloseWithoutEnd={handleCloseWithoutEnd}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}

      {/* End party dialog — TZ 10.1 */}
      {showEndPartyDialog && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            backgroundColor: '#f0f0f0', border: '2px solid #0028fa', borderRadius: 8,
            padding: 24, minWidth: 350, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a1a' }}>Завершить партию</h3>
              <button onClick={() => setShowEndPartyDialog(false)} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666', padding: '0 4px',
              }}>✕</button>
            </div>
            <EndPartyContent onConfirm={handleEndPartyConfirm} onCancel={() => setShowEndPartyDialog(false)} />
          </div>
        </div>
      )}

      {/* Save As dialog — TZ 10.1 */}
      {showSaveAsDialog && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            backgroundColor: '#f0f0f0', border: '2px solid #0028fa', borderRadius: 8,
            padding: 24, minWidth: 350, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1a1a1a' }}>Сохранить позицию как</h3>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid #999',
                borderRadius: 4, fontSize: 14, boxSizing: 'border-box', marginBottom: 16,
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAsConfirm(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowSaveAsDialog(false)} style={{
                padding: '6px 16px', border: '1px solid #999', borderRadius: 4,
                backgroundColor: '#e0e0e0', cursor: 'pointer', fontSize: 13,
              }}>Отмена</button>
              <button onClick={handleSaveAsConfirm} style={{
                padding: '6px 16px', border: '1px solid #0028fa', borderRadius: 4,
                backgroundColor: '#0068c8', color: '#fff', cursor: 'pointer', fontSize: 13,
              }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {saveMessage && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 20px', backgroundColor: 'rgba(0, 100, 200, 0.9)',
          color: '#fff', borderRadius: 6, fontSize: 14, zIndex: 300,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {saveMessage}
        </div>
      )}

    </div>
  );
};

// Sub-component for end party dialog
const EndPartyContent: React.FC<{ onConfirm: (save: boolean) => void; onCancel: () => void }> = ({ onConfirm }) => {
  const [save, setSave] = useState(false);
  return (
    <>
      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
        Сохранить позицию
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={() => onConfirm(save)} style={{
          padding: '6px 16px', border: '1px solid #0028fa', borderRadius: 4,
          backgroundColor: '#0068c8', color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>Завершить партию</button>
      </div>
    </>
  );
};

export default App;
