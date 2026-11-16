import type { Metadata } from 'next';
import { PlainPage, PLAIN_HEADING } from '@/components/legal/PlainPage';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { textBlocks } from '@/lib/intake/plain-text';
import { fill } from '@/lib/site-words/words';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

// The words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).makerTerms;
  return { title: w.metaTitle, description: w.metaDescription };
}

/** bohdiai.com/maker-terms: what a maker agrees to at sign-up (go-live step 3, Alex 2026-11-16). */
export default async function MakerTermsPage(): Promise<React.ReactElement> {
  const w = (await getIntakeWords(supabaseAdmin())).makerTerms;
  return (
    <PlainPage title={w.title} updated={w.updated} back={w.back}>
      {textBlocks(fill(w.body, { email: SITE_CONTACT_EMAIL })).map((b, i) =>
        b.kind === 'heading' ? (
          <h2 key={i} className={PLAIN_HEADING}>
            {b.text}
          </h2>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </PlainPage>
  );
}
