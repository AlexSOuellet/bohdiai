'use client';

/**
 * Taking a live site offline, and putting it back (Alex, Session 119). Offline,
 * visitors see that it's temporarily offline and to check back later, while the
 * maker can still open it and change anything; putting it back shows it exactly
 * as it is then. Each asks once more.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmButton } from './ConfirmButton';
import type { DoneResult } from '@/lib/backend/catalog/results';

type Props =
  | { offline: false; takeOffline: () => Promise<DoneResult> }
  | { offline: true; previewUrl: string | null; putOnline: () => Promise<DoneResult> };

export function OfflinePanel(props: Props): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (action: () => Promise<DoneResult>, failed: string): void =>
    start(async () => {
      try {
        const result = await action();
        if (result.ok) router.refresh();
        else setError(result.error);
      } catch {
        setError(failed);
      }
    });

  if (!props.offline) {
    return (
      <section className="bk-offline" aria-labelledby="bk-offline">
        <div className="bk-publish-text">
          <h2 id="bk-offline" className="bk-offline-title">
            Need a break?
          </h2>
          <p className="bk-publish-line">Take your site offline and visitors see it’s temporarily offline until you put it back. You can still look at it and change anything.</p>
        </div>
        <div className="bk-publish-actions">
          <ConfirmButton
            label="Take my site offline"
            confirmLabel="Yes, take it offline"
            keepLabel="Keep it live"
            tone="plain"
            disabled={pending}
            onConfirm={() => run(props.takeOffline, 'Your site couldn’t be taken offline. Try again in a moment.')}
          />
        </div>
        {error !== null && (
          <p role="alert" className="bk-error bk-publish-error">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="bk-publish" aria-labelledby="bk-offline">
      <div className="bk-publish-text">
        <h2 id="bk-offline" className="bk-publish-title">
          Your site is offline
        </h2>
        <p className="bk-publish-line">Visitors see that it’s temporarily offline and to check back later. You can still look at it and change anything, then put it back when you’re ready.</p>
      </div>
      <div className="bk-publish-actions">
        <ConfirmButton
          label="Put it back online"
          confirmLabel="Yes, put it back"
          keepLabel="Not yet"
          tone="plain"
          disabled={pending}
          onConfirm={() => run(props.putOnline, 'Your site couldn’t be put back online. Try again in a moment.')}
        />
        {props.previewUrl !== null && (
          <a className="bk-link bk-publish-view" href={props.previewUrl} target="_blank" rel="noreferrer">
            View my site
          </a>
        )}
      </div>
      {error !== null && (
        <p role="alert" className="bk-error bk-publish-error">
          {error}
        </p>
      )}
    </section>
  );
}
