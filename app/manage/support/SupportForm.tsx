'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { sendSupportMessage } from '@/lib/backend/support/actions';
import { checkSupportMessage, SUPPORT_MESSAGE_MAX } from '@/lib/backend/support/support-form';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** One box and Send. The site and the maker's email go with it; replies come to their email. */
export function SupportForm({ siteName, email }: { siteName: string; email: string }): React.ReactElement {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();

  async function send(): Promise<void> {
    if (inFlight.current) return;
    const checked = checkSupportMessage(message);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await sendSupportMessage(message);
      if (r.ok) {
        setMessage('');
        notice.showSaved(email === '' ? 'Sent. We’ll get back to you soon.' : `Sent. We’ll reply to ${email}.`);
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      {notice.area}
      <section className="bk-section" aria-labelledby="s-support">
        <h2 id="s-support" className="bk-section-title">Ask a question or tell us what’s wrong</h2>
        <div className="bk-field">
          <label htmlFor="support-message" className="bk-label">
            Your message
          </label>
          <textarea
            id="support-message"
            className="bk-input bk-textarea"
            aria-describedby="support-hint"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              notice.clearSaved();
            }}
          />
          <p id="support-hint" className="bk-note">
            {`Sent with your site (${siteName})${email === '' ? '' : ` and your email (${email})`}, so we know who it’s from. ${message.length}/${SUPPORT_MESSAGE_MAX}`}
          </p>
        </div>
        <button type="button" className="bk-btn" disabled={busy} onClick={() => void send()}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </section>
    </>
  );
}
