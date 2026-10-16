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
      <section className="bk-now" aria-labelledby="bk-publish" role="status">
        <p id="bk-publish" className="bk-kicker">
          Your site is live
        </p>
        <p className="bk-note">
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
    <section className="bk-now" aria-labelledby="bk-publish">
      <p id="bk-publish" className="bk-kicker">
        Your site is private
      </p>
      <div>
        <p className="bk-note">Only you can see it. Look it over, and publish it when you’re happy with it.</p>
        <div className="bk-row">
          {previewUrl === null ? (
            <p className="bk-note">Your site can’t be opened before it’s published right now. Publish it to see it, or ask Alex.</p>
          ) : (
            <a className="bk-btn bk-btn-quiet" href={previewUrl} target="_blank" rel="noreferrer">
              View my site
            </a>
          )}
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
        </div>
        {state.kind === 'error' && (
          <p role="alert" className="bk-error">
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
