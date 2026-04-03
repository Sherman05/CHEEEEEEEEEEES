import React, { useState } from 'react';

interface FolderDialogProps {
  onConfirm: (folderName: string) => void;
  onCancel: () => void;
}

const FolderDialog: React.FC<FolderDialogProps> = ({ onConfirm, onCancel }) => {
  const [folderName, setFolderName] = useState('');

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
        minWidth: 350,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a1a' }}>Создать папку для партии</h3>
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
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#444', display: 'block', marginBottom: 4 }}>
            Название папки (партии):
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Моя партия"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #999',
              borderRadius: 4,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && folderName.trim()) onConfirm(folderName.trim());
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          Папка будет создана на Рабочем столе
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 16px',
              border: '1px solid #999',
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Отмена
          </button>
          <button
            onClick={() => folderName.trim() && onConfirm(folderName.trim())}
            disabled={!folderName.trim()}
            style={{
              padding: '6px 16px',
              border: '1px solid #0028fa',
              borderRadius: 4,
              backgroundColor: '#0068c8',
              color: '#fff',
              cursor: folderName.trim() ? 'pointer' : 'default',
              fontSize: 13,
              opacity: folderName.trim() ? 1 : 0.5,
            }}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDialog;
