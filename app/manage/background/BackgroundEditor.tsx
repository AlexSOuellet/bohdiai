'use client';

import { useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { chooseScene, findScenes, removeOwnBackground, setOwnBackground, setOwnScene } from '@/lib/backend/scene/background-actions';
import type { BackgroundView, SceneOption } from '@/lib/backend/scene/background';
import { useNotice } from '../_components/Notice';
import { ConfirmButton } from '../_components/ConfirmButton';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** What sits behind her pages: her own background photo, and the photo behind her
 *  site when it wears Scenic. Each saves the moment it's picked. */
export function BackgroundEditor({ initial, siteUrl }: { initial: BackgroundView; siteUrl: string }): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<'light' | 'dark'>('light');
  const [words, setWords] = useState('');
  /** Search results; null shows the library as it came (hers first). */
  const [found, setFound] = useState<SceneOption[] | null>(null);
  const scenes = found ?? initial.scenes;

  async function search(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (words.trim() === '') {
      setFound(null);
      return;
    }
    setBusy(true);
    notice.clear();
    try {
      const r = await findScenes(words);
      if (r.ok) setFound(r.scenes);
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, said: string): Promise<void> {
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        notice.showSaved(said);
        router.refresh();
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  function upload(action: (d: FormData) => Promise<{ ok: true; url: string } | { ok: false; error: string }>, said: string, extra: Record<string, string> = {}) {
    return (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file === undefined) return;
      const data = new FormData();
      data.set('file', file);
      for (const [k, v] of Object.entries(extra)) data.set(k, v);
      void run(() => action(data), said);
    };
  }

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Background</h1>
        <div className="bk-head-actions">
          <a className="bk-btn bk-btn-quiet" href={siteUrl} target="_blank" rel="noopener noreferrer">
            View your site
          </a>
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-own-bg">
          <h2 id="s-own-bg" className="bk-section-title">
            Your own background
          </h2>
          <p className="bk-note">A photo of your own behind your pages, like the boards your work sits on. The Rustic look shows it; the other looks keep their own.</p>
          {initial.own !== null ? (
            <div className="bk-opening-photo">
              {/* The owner's own upload, already shrunk to WebP by the upload action. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initial.own} alt="Your background" />
            </div>
          ) : (
            <p className="bk-note">No background of your own yet.</p>
          )}
          <p className="bk-row">
            <label className="bk-btn bk-btn-quiet" aria-disabled={busy}>
              {busy ? 'Working…' : initial.own === null ? 'Add a background' : 'Replace'}
              <input type="file" className="bk-sr" accept="image/jpeg,image/png,image/webp" aria-label={initial.own === null ? 'Add a background' : 'Replace your background'} disabled={busy} onChange={upload(setOwnBackground, 'Your background is saved. Your site shows it now.')} />
            </label>
            {initial.own !== null && <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => void run(removeOwnBackground, 'Your background is removed.')} />}
          </p>
          <p className="bk-note">A plain, even texture works best: wood, fabric, paper. JPG, PNG or WebP, up to 20MB.</p>
        </section>

        <section className="bk-section" aria-labelledby="s-scenic">
          <h2 id="s-scenic" className="bk-section-title">
            Behind your site in Scenic
          </h2>
          <p className="bk-note">When your site wears the Scenic look, a full photo sits behind the whole page. Pick any scene from the library (the ones made for your site come first), or use a photo of your own.</p>
          <form className="bk-row" role="search" onSubmit={(e) => void search(e)}>
            <label htmlFor="scene-find" className="bk-sr">
              Search the scenes
            </label>
            <input id="scene-find" className="bk-input" placeholder="Search the scenes: winter, barn, kitchen…" value={words} maxLength={100} onChange={(e) => setWords(e.target.value)} />
            <button type="submit" className="bk-btn bk-btn-quiet" disabled={busy}>
              Search
            </button>
            {found !== null && (
              <button
                type="button"
                className="bk-btn bk-btn-quiet"
                onClick={() => {
                  setFound(null);
                  setWords('');
                }}
              >
                Show all
              </button>
            )}
          </form>
          {scenes.length > 0 ? (
            <div className="bk-scene-grid" role="group" aria-label="Scenes">
              {scenes.map((s) => (
                <button key={s.key} type="button" className="bk-scene" aria-pressed={initial.scenic?.key === s.key} disabled={busy} onClick={() => void run(() => chooseScene(s.key), 'Saved. Scenic shows that scene now.')}>
                  {/* A scene from BohdiAI's own library. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.description} loading="lazy" />
                  <span>
                    {initial.scenic?.key === s.key ? 'Showing now' : 'Use this scene'}
                    {s.mine && ' · Made for your site'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="bk-note">{found !== null ? 'No scenes match those words.' : 'The scene library is empty.'}</p>
          )}
          {initial.scenic !== null && initial.scenic.key === null && (
            <div className="bk-opening-photo">
              {/* The owner's own upload. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={initial.scenic.url} alt="Your own Scenic photo, showing now" />
            </div>
          )}
          <div className="bk-field">
            <p className="bk-label">Or use a photo of your own</p>
            <div className="bk-row" role="radiogroup" aria-label="How light is your photo?">
              <label className="bk-check">
                <input type="radio" name="tone" checked={tone === 'light'} onChange={() => setTone('light')} /> A light photo (dark words over it)
              </label>
              <label className="bk-check">
                <input type="radio" name="tone" checked={tone === 'dark'} onChange={() => setTone('dark')} /> A dark photo (light words over it)
              </label>
            </div>
            <p className="bk-row">
              <label className="bk-btn bk-btn-quiet" aria-disabled={busy}>
                {busy ? 'Working…' : 'Upload a photo'}
                <input type="file" className="bk-sr" accept="image/jpeg,image/png,image/webp" aria-label="Upload your own Scenic photo" disabled={busy} onChange={upload(setOwnScene, 'Saved. Scenic shows your photo now.', { tone })} />
              </label>
            </p>
            <p className="bk-note">A wide landscape photo works best, with no words in it. JPG, PNG or WebP, up to 20MB.</p>
          </div>
        </section>
      </main>
    </>
  );
}
