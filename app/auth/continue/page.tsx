import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AUTH_LINK_KINDS } from '@/lib/backend/auth-kinds';
import { backendFace } from '../../manage/fonts';
import '../../manage/backend.css';

export const metadata: Metadata = { title: 'Continue', robots: { index: false, follow: false }, referrer: 'same-origin' };


type Params = { token_hash?: string | string[]; type?: string | string[] };

/** What each kind of emailed link says before its button. */
const SCREEN: Record<string, { kicker: string; title: string; note: string }> = {
  invite: { kicker: 'Site owner', title: 'Welcome', note: 'Continue to set your password.' },
  recovery: { kicker: 'Site owner', title: 'Reset your password', note: 'Continue to choose a new password.' },
  signup: { kicker: 'BohdiAI', title: 'Confirm your email', note: 'One click and you’re in.' },
};

/**
 * Landing page for emailed invite/reset links (they point at /auth/confirm, which
 * redirects here). It only shows a button: email scanners prefetch links, and
 * verifying a one-time token on GET would let them burn it before the person clicks.
 * The token is spent by the POST to /auth/confirm.
 */
export default async function ContinuePage({ searchParams }: { searchParams: Promise<Params> }): Promise<React.ReactElement> {
  const { token_hash: tokenHash, type } = await searchParams;
  const screen = typeof type === 'string' && AUTH_LINK_KINDS.has(type) ? SCREEN[type] : undefined;
  if (typeof tokenHash !== 'string' || tokenHash === '' || typeof type !== 'string' || screen === undefined) {
    redirect('/auth/error?reason=link');
  }
  return (
    <div className={`bk ${backendFace.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">{screen.kicker}</p>
          <h1 className="bk-title">{screen.title}</h1>
          <p className="bk-note">{screen.note}</p>
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
