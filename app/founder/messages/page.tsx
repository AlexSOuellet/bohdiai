import { requireFounder } from '@/lib/founder/access';
import { loadFounderMessages } from '@/lib/founder/messages';
import { supabaseAdmin } from '@/lib/supabase';
import { MessageList } from './MessageList';

export const dynamic = 'force-dynamic';

/** Messages: what makers sent through Contact support. */
export default async function FounderMessagesPage(): Promise<React.ReactElement> {
  await requireFounder();
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Messages</h1>
      </div>
      <main id="main" className="bk-content">
        <MessageList messages={await loadFounderMessages(supabaseAdmin())} />
      </main>
    </>
  );
}
