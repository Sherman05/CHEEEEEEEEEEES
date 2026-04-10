import React, { useState } from 'react';

interface FolderDialogProps {
  onConfirm: (folderName: string) => void;
  onCancel: () => void;
  onDismiss: () => void;
}

async function createFolder(name: string): Promise<string | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const path = await invoke<string>('create_folder_on_desktop', { name });
    return path;
  } catch (e) {
    console.error('Failed to create folder:', e);
    return null;
  }
}

async function checkFolderExists(name: string): Promise<boolean> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('check_folder_exists_on_desktop', { name });
  } catch {
    return false;
  }
}

const FolderDialog: React.FC<FolderDialogProps> = ({ onConfirm, onCancel, onDismiss }) => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showOverwrite, setShowOverwrite] = useState(false);

  const handleCreate = async () => {
    const name = folderName.trim();
    if (!name || creating) return;

    setCreating(true);
    setError('');

    // Check if folder already exists
    const exists = await checkFolderExists(name);
    if (exists && !showOverwrite) {
      setCreating(false);
      setShowOverwrite(true);
      return;
    }
    const result = await createFolder(name);
    setCreating(false);
    if (result) {
      onConfirm(name);
    } else {
      setError('Не удалось создать папку. Проверьте имя.');
    }
  };

  const handleOverwriteNo = () => {
    setShowOverwrite(false);
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
            onClick={onDismiss}
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

        {showOverwrite ? (
          <>
            <div style={{ fontSize: 13, color: '#cc0000', marginBottom: 16 }}>
              Папка с таким именем уже существует. Перезаписать содержимое?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={handleOverwriteNo}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #999',
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Нет
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #0028fa',
                  borderRadius: 4,
                  backgroundColor: '#0068c8',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Да
              </button>
            </div>
          </>
        ) : (
          <>
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
            {error && (
              <div style={{ fontSize: 12, color: '#cc0000', marginBottom: 8 }}>{error}</div>
            )}
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
              Папка будет создана на Рабочем столе. Нажмите «Пропустить», чтобы продолжать без создания папки; скриншоты будут сохраняться в папке «Изображения».
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
                Пропустить
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
          </>
        )}
      </div>
    </div>
  );
};

export default FolderDialog;
