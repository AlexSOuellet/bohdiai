import type { Metadata } from 'next';
import { PlainPage } from '@/components/legal/PlainPage';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { textLines } from '@/lib/intake/plain-text';
import { fill } from '@/lib/site-words/words';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

// The words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).cantSell;
  return { title: w.metaTitle, description: w.metaDescription };
}

/** bohdiai.com/what-cant-be-sold: the list every site is checked against (go-live step 3). */
export default async function CantSellPage(): Promise<React.ReactElement> {
  const w = (await getIntakeWords(supabaseAdmin())).cantSell;
  return (
    <PlainPage title={w.title} back={w.back}>
      <p>{w.intro}</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-honey-warm">
        {textLines(w.items).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{fill(w.closing, { email: SITE_CONTACT_EMAIL })}</p>
    </PlainPage>
  );
}
