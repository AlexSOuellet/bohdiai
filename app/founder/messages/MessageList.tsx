import type { FounderMessage } from '@/lib/founder/messages';
import { shortDate } from '../format';

export function MessageList({ messages }: { messages: readonly FounderMessage[] }): React.ReactElement {
  if (messages.length === 0) return <p className="bk-note">No messages yet. When a maker uses Contact support, it shows here.</p>;
  return (
    <ul className="fd-messages">
      {messages.map((m) => (
        <li key={m.id} className="fd-message">
          <p className="fd-message-from">
            <span>
              <strong>{m.site}</strong> {m.email}
            </span>
            <span>{shortDate(m.sent)}</span>
          </p>
          <p className="fd-message-text">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
