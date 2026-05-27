'use client';

import { useState } from 'react';
import meta from './meta';

export { meta };

interface ContactFormContent {
  heading: string;
  subheading: string;
  buttonLabel?: string;
}

interface ContactFormProps {
  content: ContactFormContent;
  tenantId?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm({ content, tenantId }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const buttonLabel = content.buttonLabel ?? 'Send Message';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (tenantId === undefined) {
      setStatus('error');
      setErrorMessage('Form is not connected — please refresh.');
      return;
    }
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, name, email, message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-s-surface border border-s-border text-s-text placeholder:text-s-text/40 font-s-body focus:outline-none focus:border-s-accent transition-colors';

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6">
        <header className="mb-10 text-center">
          <h1 className="font-s-heading text-4xl md:text-5xl text-s-text mb-4">
            {content.heading}
          </h1>
          <p className="font-s-body text-lg text-s-text/70 leading-relaxed">
            {content.subheading}
          </p>
        </header>

        {status === 'success' ? (
          <div className="bg-s-surface border border-s-accent/40 p-8 text-center">
            <p className="font-s-heading text-2xl text-s-text mb-2">Thanks for reaching out.</p>
            <p className="font-s-body text-s-text/70">
              Your message is on its way. We&apos;ll be in touch soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="contact-name" className="block font-s-body text-sm text-s-text/70 mb-2 uppercase tracking-[0.1em]">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                disabled={status === 'submitting'}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block font-s-body text-sm text-s-text/70 mb-2 uppercase tracking-[0.1em]">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                disabled={status === 'submitting'}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block font-s-body text-sm text-s-text/70 mb-2 uppercase tracking-[0.1em]">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={5000}
                rows={6}
                disabled={status === 'submitting'}
                className={inputClass}
              />
            </div>

            {status === 'error' && (
              <p className="font-s-body text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full md:w-auto px-8 py-3 bg-s-accent text-white font-s-body uppercase tracking-[0.15em] text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {status === 'submitting' ? 'Sending…' : buttonLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
