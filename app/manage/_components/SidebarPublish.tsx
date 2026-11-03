'use client';

/**
 * Publish beside "Open my site" in the menu, while the site isn't live (Alex,
 * Session 119: a publish link wherever the site is shown). Asks once more, as the
 * Home panel does, then the whole backend refreshes as live.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmButton } from './ConfirmButton';
import type { DoneResult } from '@/lib/backend/catalog/results';

export function SidebarPublish({ publish }: { publish: () => Promise<DoneResult> }): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="bk-side-publish">
      <p className="bk-side-publish-note">Only you can see your site</p>
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
              if (result.ok) router.refresh();
              else setError(result.error);
            } catch {
              setError('Your site couldn’t be published. Try again in a moment.');
            }
          })
        }
      />
      {error !== null && (
        <p role="alert" className="bk-error">
          {error}
        </p>
      )}
    </div>
  );
}
