import type { Metadata } from 'next';
import Link from 'next/link';
import { plex } from '../../manage/fonts';
import '../../manage/backend.css';

export const metadata: Metadata = { title: 'Something went wrong', robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  link: 'That link has expired or was already used. Ask Alex for a new invite, or use Forgot password on the sign-in page.',
  nosite: 'This account isn’t linked to a site yet. Ask Alex to finish setting it up.',
};
const DEFAULT_MESSAGE = 'Your sign-in link may have expired. Please try again.';

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }): Promise<React.ReactElement> {
  const { reason } = await searchParams;
  const key = typeof reason === 'string' ? reason : '';
  const message = Object.hasOwn(MESSAGES, key) ? MESSAGES[key] : DEFAULT_MESSAGE;
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">Something went wrong</h1>
          <p className="bk-note">{message}</p>
          <p className="bk-note"><Link href="/signin" className="bk-link">Back to sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
