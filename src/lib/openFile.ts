// Converts a data URI to a temporary blob URL and opens it in a new tab.
// Needed because Safari blocks navigation to data: URIs in new tabs.
export function openFile(url: string): void {
  if (!url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const [header, base64] = url.split(',');
  const mime = header.replace('data:', '').replace(';base64', '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const blob = new Blob([bytes], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  // Revoke after the tab has had time to load
  if (win) win.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true });
}
