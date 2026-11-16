import type { Metadata } from 'next';
import { requireFounder } from '@/lib/founder/access';
import { signOut } from '@/lib/backend/auth-actions';
import { backendFace } from '../manage/fonts';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { newCounts, type NewCounts } from '@/lib/founder/seen';
import { FounderTabs } from './FounderTabs';
import '../manage/backend.css';
import './founder.css';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

/** Alex's admin: the backend's look, locked to Alex. */
export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await requireFounder();
  // The new-item counts on the tabs; if they can't be read the tabs still work, without numbers.
  let counts: NewCounts | null = null;
  try {
    counts = await newCounts(supabaseAdmin());
  } catch (err) {
    logger.error('admin: new counts failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return (
    <div className={`bk fd ${backendFace.variable}`}>
      <header className="fd-bar">
        <FounderTabs counts={counts} />
        <form action={signOut} className="fd-who">
          <span>{user.email}</span>
          <button type="submit" className="fd-out">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
