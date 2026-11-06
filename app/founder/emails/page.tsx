import { headers } from 'next/headers';
import { headersOrigin } from '@/lib/backend/request-origin';
import { requireFounder } from '@/lib/founder/access';
import { emailSamples } from '@/lib/founder/email-samples';
import { getIntakeWords } from '@/lib/intake/queries';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Emails: every email a maker can get, shown as they'll see it. */
export default async function FounderEmailsPage(): Promise<React.ReactElement> {
  await requireFounder();
  const samples = emailSamples(await getIntakeWords(supabaseAdmin()), headersOrigin(await headers()));
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Emails</h1>
      </div>
      <main id="main" className="bk-content">
        <div className="fd-emails">
          {samples.map((s) => (
            <section key={s.title} className="bk-section">
              <h2 className="bk-section-title">{s.title}</h2>
              <p className="bk-note">Subject: {s.subject}</p>
              <iframe title={s.title} srcDoc={s.html} sandbox="" className="fd-email" />
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
