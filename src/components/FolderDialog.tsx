import React, { useState } from 'react';

interface FolderDialogProps {
  onConfirm: (folderName: string) => void;
  onCancel: () => void;
}

async function createFolder(name: string): Promise<string | null> {
  try {
    const { mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const folderPath = name;
    const folderExists = await exists(folderPath, { baseDir: BaseDirectory.Desktop });
    if (!folderExists) {
      await mkdir(folderPath, { baseDir: BaseDirectory.Desktop, recursive: true });
    }
    return folderPath;
  } catch (e) {
    console.error('Failed to create folder:', e);
    return null;
  }
}

const FolderDialog: React.FC<FolderDialogProps> = ({ onConfirm, onCancel }) => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = folderName.trim();
    if (!name) return;
    setCreating(true);
    await createFolder(name);
    setCreating(false);
    onConfirm(name);
  };

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
              if (e.key === 'Enter' && folderName.trim()) handleCreate();
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          Папка будет создана на Рабочем столе. Нажмите «Отмена» чтобы продолжить без папки.
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
            onClick={handleCreate}
            disabled={!folderName.trim() || creating}
            style={{
              padding: '6px 16px',
              border: '1px solid #0028fa',
              borderRadius: 4,
              backgroundColor: '#0068c8',
              color: '#fff',
              cursor: folderName.trim() && !creating ? 'pointer' : 'default',
              fontSize: 13,
              opacity: folderName.trim() && !creating ? 1 : 0.5,
            }}
          >
            {creating ? 'Создаю...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDialog;
