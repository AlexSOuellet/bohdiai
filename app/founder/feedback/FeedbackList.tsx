import type { FeedbackView } from '@/lib/tool-feedback/load';
import { ideaName } from '@/lib/tool-feedback/load';
import { shortDate } from '../format';

/** Feedback from the try-the-tools page: how many want each idea, then every response. */
export function FeedbackList({ view }: { view: FeedbackView }): React.ReactElement {
  if (view.total === 0)
    return (
      <p className="bk-note">
        No feedback yet. When someone sends the form on bohdiai.com/try-the-tools, it shows here.
      </p>
    );
  return (
    <>
      <section className="bk-section" aria-labelledby="fd-wanted">
        <h2 id="fd-wanted" className="bk-section-title">
          What people want built
        </h2>
        <p className="bk-note">{`${view.total} ${view.total === 1 ? 'response' : 'responses'} so far.`}</p>
        <ul className="fd-wanted">
          {view.counts.map((c) => (
            <li key={c.key} className="fd-wanted-row">
              <span>{c.name}</span>
              <strong>{`${c.count} ${c.count === 1 ? 'person' : 'people'}`}</strong>
            </li>
          ))}
        </ul>
      </section>
      <ul className="fd-messages">
        {view.entries.map((e) => (
          <li key={e.id} className="fd-message">
            <p className="fd-message-from">
              <span>
                <strong>{e.name === '' ? 'No name given' : e.name}</strong> {e.email}
                {e.makes !== '' && ` · makes ${e.makes}`}
              </span>
              <span>{shortDate(e.sent)}</span>
            </p>
            {e.message !== '' && <p className="fd-message-text">{e.message}</p>}
            {e.wants.length > 0 && (
              <p className="bk-note">{`Would use: ${e.wants.map(ideaName).join(', ')}`}</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
