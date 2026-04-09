import React, { useState, useEffect } from 'react';

interface CloseDialogProps {
  hasActiveSession: boolean;
  onCloseWithEnd: (savePosition: boolean) => void;
  onCloseWithoutEnd: (savePosition: boolean) => void;
  onCancel: () => void;
}

const CloseDialog: React.FC<CloseDialogProps> = ({ hasActiveSession, onCloseWithEnd, onCloseWithoutEnd, onCancel }) => {
  const [saveWithEnd, setSaveWithEnd] = useState(false);
  const [saveWithoutEnd, setSaveWithoutEnd] = useState(false);

  // Auto-close if no active session
  useEffect(() => {
    if (!hasActiveSession) {
      onCloseWithEnd(false);
    }
  }, [hasActiveSession, onCloseWithEnd]);

  if (!hasActiveSession) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        // Click on backdrop closes
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: '#f0f0f0',
          border: '2px solid #0028fa',
          borderRadius: 8,
          padding: 24,
          minWidth: 380,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a1a' }}>Закрытие программы</h3>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#666',
              padding: '0 4px',
              pointerEvents: 'auto',
            }}
            title="Отмена"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Option 1: End party and close */}
          <div style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            backgroundColor: '#fff',
          }}>
            <button
              type="button"
              onClick={() => onCloseWithEnd(saveWithEnd)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #0028fa',
                borderRadius: 4,
                backgroundColor: '#e8f0ff',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                color: '#1a1a1a',
                fontWeight: 'bold',
                marginBottom: 8,
                pointerEvents: 'auto',
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

          {/* Option 2: Close without ending */}
          <div style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            backgroundColor: '#fff',
          }}>
            <button
              type="button"
              onClick={() => onCloseWithoutEnd(saveWithoutEnd)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #0028fa',
                borderRadius: 4,
                backgroundColor: '#e8f0ff',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                color: '#1a1a1a',
                fontWeight: 'bold',
                marginBottom: 8,
                pointerEvents: 'auto',
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
