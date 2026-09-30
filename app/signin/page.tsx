import type { Metadata } from 'next';
import SignInForm from './SignInForm';
import { plex } from '../manage/fonts';
import '../manage/backend.css';
import { endedReason } from '@/lib/backend/session-limits';
import { SIGNED_OUT_IDLE, SIGNED_OUT_MAX } from '@/lib/backend/auth-messages';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignInPage({ searchParams }: Props): Promise<React.ReactElement> {
  const ended = endedReason((await searchParams)['ended']);
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">Sign in</h1>
          {ended !== null && <p role="status" className="bk-note">{ended === 'idle' ? SIGNED_OUT_IDLE : SIGNED_OUT_MAX}</p>}
          <SignInForm />
        </div>
      </main>
    </div>
  );
}
