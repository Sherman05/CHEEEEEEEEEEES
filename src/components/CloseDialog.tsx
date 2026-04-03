import React, { useState } from 'react';

interface CloseDialogProps {
  hasActiveSession: boolean;
  onCloseWithEnd: (savePosition: boolean) => void;
  onCloseWithoutEnd: (savePosition: boolean) => void;
  onCancel: () => void;
}

const CloseDialog: React.FC<CloseDialogProps> = ({ hasActiveSession, onCloseWithEnd, onCloseWithoutEnd, onCancel }) => {
  const [saveWithEnd, setSaveWithEnd] = useState(true);
  const [saveWithoutEnd, setSaveWithoutEnd] = useState(true);

  if (!hasActiveSession) {
    // No active session - just close
    onCloseWithEnd(false);
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        backgroundColor: '#f0f0f0',
        border: '2px solid #0028fa',
        borderRadius: 8,
        padding: 24,
        minWidth: 380,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a1a' }}>Закрытие программы</h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#666',
              padding: '0 4px',
            }}
            title="Отмена"
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            backgroundColor: '#fff',
          }}>
            <button
              onClick={() => onCloseWithEnd(saveWithEnd)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 0',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                color: '#1a1a1a',
                fontWeight: 'bold',
              }}
            >
              Завершить партию и закрыть программу
            </button>
            <label style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveWithEnd}
                onChange={(e) => setSaveWithEnd(e.target.checked)}
              />
              Сохранить позицию
            </label>
          </div>

          <div style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            backgroundColor: '#fff',
          }}>
            <button
              onClick={() => onCloseWithoutEnd(saveWithoutEnd)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 0',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                color: '#1a1a1a',
                fontWeight: 'bold',
              }}
            >
              Закрыть программу — не завершая партию
            </button>
            <label style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveWithoutEnd}
                onChange={(e) => setSaveWithoutEnd(e.target.checked)}
              />
              Сохранить позицию
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseDialog;
