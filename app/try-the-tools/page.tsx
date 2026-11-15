import type { Metadata } from 'next';
import { backendFace } from '@/app/manage/fonts';
import '@/app/manage/backend.css';
import { TryTools } from './TryTools';
import { FeedbackForm } from './FeedbackForm';

/** Share-only (Alex, 2026-11-15): not in any menu or the sitemap, and search engines
 *  are told to skip it. It comes down when Alex has his feedback. */
export const metadata: Metadata = {
  title: 'Try the tools · BohdiAI',
  description: 'Tools for makers, from BohdiAI. Try them and tell us what you think.',
  robots: { index: false, follow: false },
};

export default function TryTheToolsPage(): React.ReactElement {
  return (
    <div className={`bk bk-try ${backendFace.variable}`}>
      <main id="main" className="bk-try-main">
        <header className="bk-try-head">
          <p className="bk-brand-name">
            <span className="bk-ember" aria-hidden="true" />
            BohdiAI
          </p>
          <h1 className="bk-tool-title">Tools for makers. Try them, then tell us what you think.</h1>
          <p className="bk-tool-lede">
            BohdiAI builds websites for makers, and every maker gets a set of tools with theirs: what a piece costs you to make, what to charge, whether a market is worth the trip, and printing your designs at the exact size you need. They’re here for you to try, no account needed, and nothing you type is saved. When you’ve had a go, tell us what worked, what didn’t, and which tool you’d want next.
          </p>
          <p className="bk-try-jump">
            <a className="bk-link" href="#feedback">
              Go to the feedback form
            </a>
          </p>
        </header>
        <TryTools />
        <section id="feedback" className="bk-try-feedback" aria-labelledby="try-feedback">
          <h2 id="try-feedback" className="bk-tool-title">
            What should we build next?
          </h2>
          <FeedbackForm />
        </section>
      </main>
    </div>
  );
}
