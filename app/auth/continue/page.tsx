import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { plex } from '../../manage/fonts';
import '../../manage/backend.css';

export const metadata: Metadata = { title: 'Continue', robots: { index: false, follow: false }, referrer: 'no-referrer' };

const KINDS = new Set(['invite', 'recovery']);

type Params = { token_hash?: string | string[]; type?: string | string[] };

/**
 * Landing page for emailed invite/reset links (they point at /auth/confirm, which
 * redirects here). It only shows a button: email scanners prefetch links, and
 * verifying a one-time token on GET would let them burn it before the person clicks.
 * The token is spent by the POST to /auth/confirm.
 */
export default async function ContinuePage({ searchParams }: { searchParams: Promise<Params> }): Promise<React.ReactElement> {
  const { token_hash: tokenHash, type } = await searchParams;
  if (typeof tokenHash !== 'string' || tokenHash === '' || typeof type !== 'string' || !KINDS.has(type)) {
    redirect('/auth/error?reason=link');
  }
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">{type === 'invite' ? 'Welcome' : 'Reset your password'}</h1>
          <p className="bk-note">{type === 'invite' ? 'Continue to set your password.' : 'Continue to choose a new password.'}</p>
          <form method="post" action="/auth/confirm">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <button type="submit" className="bk-btn">Continue</button>
          </form>
        </div>
      </main>
    </div>
  );
}
