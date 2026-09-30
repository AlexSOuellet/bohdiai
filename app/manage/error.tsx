'use client';

import Link from 'next/link';

export default function ManageError({ retry }: { error: Error & { digest?: string }; retry: () => void }): React.ReactElement {
  return (
    <div className="bk-content">
      <div className="bk-attention" role="alert">
        <h1 className="bk-title">Something went wrong</h1>
        <p className="bk-note">Your site’s backend couldn’t load. Try again, or sign out and back in.</p>
        <p>
          <button type="button" className="bk-btn" onClick={() => retry()}>
            Try again
          </button>{' '}
          <Link href="/signin" className="bk-link">
            Sign in again
          </Link>
        </p>
      </div>
    </div>
  );
}
