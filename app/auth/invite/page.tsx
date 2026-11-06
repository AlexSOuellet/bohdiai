import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { backendFace } from '../../manage/fonts';
import '../../manage/backend.css';

export const metadata: Metadata = { title: 'Welcome', robots: { index: false, follow: false }, referrer: 'same-origin' };

/** Where an invite's link lands. Only a button: opening the link does nothing, so
 *  an email scanner following it can't use it up. */
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }): Promise<React.ReactElement> {
  const { t } = await searchParams;
  if (typeof t !== 'string' || t === '') redirect('/auth/error?reason=link');
  return (
    <div className={`bk ${backendFace.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <h1 className="bk-title">Welcome</h1>
          <p className="bk-note">Continue to set your password.</p>
          <form method="post" action="/auth/invite/start">
            <input type="hidden" name="t" value={t} />
            <button type="submit" className="bk-btn">
              Continue
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
