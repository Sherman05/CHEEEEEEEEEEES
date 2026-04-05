export async function captureScreenshot(): Promise<Blob | null> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const boardEl = document.querySelector('[data-board-capture]') as HTMLElement;
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

// Save screenshot to disk: party folder (on Desktop) or Pictures directory
export async function saveToDisk(blob: Blob, filename: string, partyFolder: string | null): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const arrayBuf = await blob.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuf));
    await invoke('save_screenshot', {
      folder: partyFolder,
      filename,
      data: bytes,
    });
  } catch (e) {
    console.error('Save to disk failed, falling back to download:', e);
    // Fallback: browser download
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
