import { requireActingSite } from '@/lib/backend/current-site';
import { SupportForm } from './SupportForm';

export const dynamic = 'force-dynamic';

/** Contact support (every backend): a short form that emails Alex. Later an AI chatbot. */
export default async function SupportPage(): Promise<React.ReactElement> {
  const { user, site } = await requireActingSite();
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Contact support</h1>
      </div>
      <main id="main" className="bk-content">
        <SupportForm siteName={site.businessName} email={user.email ?? ''} />
      </main>
    </>
  );
}
