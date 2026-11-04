import type { Metadata } from 'next';
import { requireFounder } from '@/lib/founder/access';
import { signOut } from '@/lib/backend/auth-actions';
import { backendFace } from '../manage/fonts';
import { FounderTabs } from './FounderTabs';
import '../manage/backend.css';
import './founder.css';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

/** Alex's admin: the backend's look, locked to Alex. */
export default async function FounderLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const user = await requireFounder();
  return (
    <div className={`bk fd ${backendFace.variable}`}>
      <header className="fd-bar">
        <FounderTabs />
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
