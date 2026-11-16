import { requireFounder } from '@/lib/founder/access';
import { loadToolFeedback } from '@/lib/tool-feedback/load';
import { supabaseAdmin } from '@/lib/supabase';
import { markSeenQuietly } from '@/lib/founder/seen-page';
import { FeedbackList } from './FeedbackList';

export const dynamic = 'force-dynamic';

/** Feedback: what people sent from the share-only try-the-tools page (Alex, 2026-11-15). */
export default async function FounderFeedbackPage(): Promise<React.ReactElement> {
  await requireFounder();
  await markSeenQuietly('feedback');
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Feedback</h1>
      </div>
      <main id="main" className="bk-content">
        <FeedbackList view={await loadToolFeedback(supabaseAdmin())} />
      </main>
    </>
  );
}
