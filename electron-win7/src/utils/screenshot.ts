// Electron (Win7) build — screenshots saved through electronAPI, no Tauri.

declare global {
  interface Window {
    electronAPI?: {
      saveScreenshot: (folder: string | null, filename: string, data: ArrayBuffer) =>
        Promise<{ ok: boolean; path?: string; error?: string }>;
    };
  }
}

export async function captureScreenshot(): Promise<Blob | null> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const boardEl =
      (document.querySelector('[data-board-root]') as HTMLElement) ||
      (document.querySelector('[data-board-capture]') as HTMLElement);
    if (!boardEl) return null;

    const canvas = await html2canvas(boardEl, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } catch (e) {
    console.error('Screenshot failed:', e);
    return null;
  }
}

export async function saveToDisk(blob: Blob, filename: string, partyFolder: string | null): Promise<void> {
  try {
    const arrayBuf = await blob.arrayBuffer();
    if (window.electronAPI && window.electronAPI.saveScreenshot) {
      const res = await window.electronAPI.saveScreenshot(partyFolder, filename, arrayBuf);
      if (!res.ok) {
        console.error('Save failed:', res.error);
        downloadBlob(blob, filename);
      }
      return;
    }
    // Browser fallback (should not happen inside Electron)
    downloadBlob(blob, filename);
  } catch (e) {
    console.error('Save to disk failed, falling back to download:', e);
    downloadBlob(blob, filename);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
