'use client';

/** What people think, and which tool ideas they'd use (Alex, 2026-11-15). Every
 *  failure says what happened; a sent form says thanks and can send another. */
import { useState, type FormEvent } from 'react';
import { IDEAS, type IdeaKey } from '@/lib/tool-feedback/feedback';

type Sent = 'idle' | 'sending' | 'sent';

export function FeedbackForm(): React.ReactElement {
  const [wants, setWants] = useState<IdeaKey[]>([]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [makes, setMakes] = useState('');
  const [company, setCompany] = useState('');
  const [sent, setSent] = useState<Sent>('idle');
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: IdeaKey, on: boolean): void => setWants((all) => (on ? [...all, k] : all.filter((x) => x !== k)));

  async function send(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (sent === 'sending') return;
    setError(null);
    setSent('sending');
    try {
      const res = await fetch('/api/tool-feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, wants, name, email, makes, company }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || body.ok !== true) {
        setError(body.error ?? 'That didn’t send. Please try again in a moment.');
        setSent('idle');
        return;
      }
      setSent('sent');
    } catch {
      setError('That didn’t send. Check your connection and try again.');
      setSent('idle');
    }
  }

  if (sent === 'sent') {
    return (
      <div className="bk-section bk-try-thanks" role="status">
        <h3 className="bk-section-title">Thank you</h3>
        <p>Your thoughts help decide what gets built next.</p>
        <button
          type="button"
          className="bk-btn bk-btn-quiet"
          onClick={() => {
            setWants([]);
            setMessage('');
            setSent('idle');
          }}
        >
          Send something else
        </button>
      </div>
    );
  }

  return (
    <form className="bk-try-form" onSubmit={(e) => void send(e)} noValidate>
      <section className="bk-section" aria-labelledby="try-ideas">
        <h3 id="try-ideas" className="bk-section-title">
          Tools we’re thinking about building
        </h3>
        <p className="bk-note bk-print-lead">Tick any you’d use. The ones people want most get built first.</p>
        <div className="bk-checks bk-try-ideas">
          {IDEAS.map((i) => (
            <label key={i.key} className="bk-check">
              <input type="checkbox" checked={wants.includes(i.key)} onChange={(e) => toggle(i.key, e.target.checked)} />
              <span>
                {i.name}
                <span className="bk-note bk-print-why">{i.about}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="bk-section" aria-labelledby="try-say">
        <h3 id="try-say" className="bk-section-title">
          Tell us what you think
        </h3>
        <div className="bk-field">
          <label className="bk-label" htmlFor="try-message">
            What worked, what didn’t, what you wish a tool did
          </label>
          <textarea id="try-message" className="bk-input bk-try-message" rows={5} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="bk-tool-grid bk-try-about">
          <div className="bk-field">
            <label className="bk-label" htmlFor="try-name">
              Your name, if you like
            </label>
            <input id="try-name" className="bk-input" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="bk-field">
            <label className="bk-label" htmlFor="try-email">
              Your email, if we may write back
            </label>
            <input id="try-email" className="bk-input" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="bk-field">
            <label className="bk-label" htmlFor="try-makes">
              What you make, if you like
            </label>
            <input id="try-makes" className="bk-input" type="text" maxLength={120} value={makes} onChange={(e) => setMakes(e.target.value)} />
          </div>
        </div>
        <div className="bk-sr" aria-hidden="true">
          <label htmlFor="try-company">Company</label>
          <input id="try-company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="bk-print-save">
          <button type="submit" className="bk-btn bk-print-go" disabled={sent === 'sending'}>
            {sent === 'sending' ? 'Sending…' : 'Send'}
          </button>
          {error !== null && (
            <p className="bk-print-say bk-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </form>
  );
}
