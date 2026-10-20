'use client';

/**
 * The home screen's Publish panel, shown while the site is private: the maker
 * opens their site to look it over, then publishes it. Publishing asks once more,
 * because there's no way back to private from here yet.
 */
import { useState, useTransition } from 'react';
import { ConfirmButton } from './ConfirmButton';
import type { DoneResult } from '@/lib/backend/catalog/results';

type Props = {
  siteUrl: string;
  previewUrl: string | null;
  publish: () => Promise<DoneResult>;
};

export function PublishPanel({ siteUrl, previewUrl, publish }: Props): React.ReactElement {
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'done' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const [pending, start] = useTransition();

  if (state.kind === 'done') {
    return (
      <section className="bk-publish is-live" aria-labelledby="bk-publish" role="status">
        <h2 id="bk-publish" className="bk-publish-title">
          Your site is live
        </h2>
        <p className="bk-publish-line">
          Anyone can visit it now at{' '}
          <a className="bk-link" href={siteUrl} target="_blank" rel="noreferrer">
            {siteUrl.replace(/^https:\/\//, '')}
          </a>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="bk-publish" aria-labelledby="bk-publish">
      <div className="bk-publish-text">
        <h2 id="bk-publish" className="bk-publish-title">
          Your site isn’t live yet
        </h2>
        <p className="bk-publish-line">Only you can see it. Look it over, then publish it when you’re happy with it.</p>
        {previewUrl === null && <p className="bk-publish-line">Your site can’t be opened before it’s published right now. Publish it to see it, or ask Alex.</p>}
      </div>
      <div className="bk-publish-actions">
        <ConfirmButton
          label="Publish"
          confirmLabel="Yes, put it live"
          keepLabel="Not yet"
          tone="plain"
          disabled={pending}
          onConfirm={() =>
            start(async () => {
              try {
                const result = await publish();
                setState(result.ok ? { kind: 'done' } : { kind: 'error', message: result.error });
              } catch {
                setState({ kind: 'error', message: 'Your site couldn’t be published. Try again in a moment.' });
              }
            })
          }
        />
        {previewUrl !== null && (
          <a className="bk-link bk-publish-view" href={previewUrl} target="_blank" rel="noreferrer">
            View my site
          </a>
        )}
      </div>
      {state.kind === 'error' && (
        <p role="alert" className="bk-error bk-publish-error">
          {state.message}
        </p>
      )}
    </section>
  );
}
