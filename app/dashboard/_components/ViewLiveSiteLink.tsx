'use client';

/**
 * The "View live site" button in the dashboard header. Named target `live-site`
 * so clicking it a second (or third) time reuses the same tab instead of piling
 * up new ones. When the editor page has written a preview state to localStorage,
 * this button navigates the tab to the SAVED live URL + preview params, so the
 * open live-site tab shows the current try-on rather than the persisted state.
 */

interface Props {
  siteUrl: string;
  className: string;
}

interface EditorPreviewState {
  skinKey?: string;
  textureUrl?: string;
  textureOpacity?: number;
}

function readPreview(): EditorPreviewState | null {
  try {
    const raw = window.localStorage.getItem('bohdiai-editor-preview');
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object') return null;
    return parsed as EditorPreviewState;
  } catch {
    return null;
  }
}

function urlWithPreview(base: string, preview: EditorPreviewState): string {
  const params = new URLSearchParams();
  if (typeof preview.skinKey === 'string' && preview.skinKey !== '') {
    params.set('previewLook', preview.skinKey);
  }
  if (typeof preview.textureUrl === 'string' && preview.textureUrl !== '') {
    params.set('previewTexture', preview.textureUrl);
  }
  if (typeof preview.textureOpacity === 'number' && Number.isFinite(preview.textureOpacity)) {
    params.set('previewTextureOpacity', preview.textureOpacity.toFixed(2));
  }
  const query = params.toString();
  if (query === '') return base;
  return `${base}${base.includes('?') ? '&' : '?'}${query}`;
}

export default function ViewLiveSiteLink({ siteUrl, className }: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const preview = readPreview();
    if (preview !== null) {
      e.preventDefault();
      window.open(urlWithPreview(siteUrl, preview), 'live-site');
    }
    // No preview state — let the default href + target navigate the tab normally.
  }

  return (
    <a
      href={siteUrl}
      target="live-site"
      rel="noreferrer"
      onClick={handleClick}
      className={className}
    >
      View live site ↗
    </a>
  );
}
