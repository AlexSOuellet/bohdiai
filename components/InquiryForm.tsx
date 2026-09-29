'use client';

/**
 * bohdiai.com's "tell me about your project" form. Posts JSON to /api/inquiry,
 * which emails Alex with the visitor as Reply-To. Every failure path shows the
 * visitor something, and the ones Alex can't fix from here name his address so
 * nobody is lost to a bad send.
 */
import { useState, type FormEvent } from 'react';
import {
  CONTACT_METHODS,
  CONTACT_METHOD_LABELS,
  INQUIRY_KINDS,
  INQUIRY_KIND_LABELS,
  PHONE_NEEDED_ERROR,
  type ContactMethod,
  type InquiryKind,
} from '@/lib/inquiry/request';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

type Fields = {
  name: string;
  email: string;
  phone: string;
  contactBy: ContactMethod;
  kind: InquiryKind | '';
  message: string;
  link: string;
  company: string;
};
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

const EMPTY: Fields = { name: '', email: '', phone: '', contactBy: 'email', kind: '', message: '', link: '', company: '' };
const FALLBACK = `Something went wrong. Please try again, or email me at ${SITE_CONTACT_EMAIL}.`;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the server's required fields and messages, so most mistakes never leave the page. */
export function checkInquiry(f: Fields): string | null {
  if (f.name.trim() === '') return 'Please add your name.';
  if (!EMAIL_SHAPE.test(f.email.trim())) return 'That email doesn’t look right.';
  if (f.contactBy !== 'email' && f.phone.trim() === '') return PHONE_NEEDED_ERROR;
  if (f.kind === '') return 'Pick what kind of business you are.';
  if (f.message.trim() === '') return 'Tell me a little about what you need.';
  return null;
}

const INPUT =
  'w-full appearance-none rounded-[10px] border border-white/[0.1] bg-black/40 px-3.5 py-3 font-sans text-[15px] text-text placeholder:text-text-soft/35 focus:border-honey-warm/50 focus:shadow-[0_0_0_3px_rgba(243,201,122,0.12)] focus:outline-none md:px-4';
const CHIP =
  'cursor-pointer rounded-pill border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[13px] text-text-soft transition-colors has-[:checked]:border-honey-warm/50 has-[:checked]:bg-honey-warm/15 has-[:checked]:text-honey-warm has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.25)]';
const LABEL = 'mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-muted';

export function InquiryForm(): React.ReactElement {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function set<K extends keyof Fields>(key: K, value: Fields[K]): void {
    setFields((f) => ({ ...f, [key]: value }));
    if (status.kind === 'error') setStatus({ kind: 'idle' });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const problem = checkInquiry(fields);
    if (problem !== null) {
      setStatus({ kind: 'error', message: problem });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setFields(EMPTY);
        setStatus({ kind: 'sent' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      const message =
        body !== null && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
          ? (body as { error: string }).error
          : FALLBACK;
      setStatus({ kind: 'error', message });
    } catch {
      setStatus({ kind: 'error', message: FALLBACK });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" className="py-6 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-honey-warm/40 bg-honey-warm/10 text-[20px] text-honey-warm shadow-[0_0_30px_-6px_rgba(243,201,122,0.6)]">
          ✓
        </div>
        <p className="font-sans text-[22px] font-medium tracking-[-0.02em] text-text">Thanks, it’s on its way</p>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-[1.55] text-muted">
          I read every message myself and I’ll get back to you within a couple of days.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-5 rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-text-soft"
        >
          Send another
        </button>
      </div>
    );
  }

  const sending = status.kind === 'sending';
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="flex flex-col gap-4 text-left">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="iq-name" className={LABEL}>
            Your name
          </label>
          <input
            id="iq-name"
            autoComplete="name"
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="iq-email" className={LABEL}>
            Email
          </label>
          <input
            id="iq-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => set('email', e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="iq-phone" className={LABEL}>
            Phone{' '}
            <span className="normal-case tracking-normal">
              {fields.contactBy === 'email' ? '(optional)' : '(needed to call or text)'}
            </span>
          </label>
          <input
            id="iq-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={fields.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={INPUT}
          />
        </div>
        <fieldset>
          <legend className={LABEL}>Best way to reach you</legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_METHODS.map((m) => (
              <label key={m} className={CHIP}>
                <input
                  type="radio"
                  name="contactBy"
                  value={m}
                  checked={fields.contactBy === m}
                  onChange={() => set('contactBy', m)}
                  className="sr-only"
                />
                {CONTACT_METHOD_LABELS[m]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className={LABEL}>What kind of business?</legend>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_KINDS.map((k) => (
            <label key={k} className={CHIP}>
              <input
                type="radio"
                name="kind"
                value={k}
                checked={fields.kind === k}
                onChange={() => set('kind', k)}
                className="sr-only"
              />
              {INQUIRY_KIND_LABELS[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="iq-message" className={LABEL}>
          What do you need?
        </label>
        <textarea
          id="iq-message"
          rows={5}
          value={fields.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="What you make or do, who buys from you, and what you want the site to do."
          className={`${INPUT} resize-y leading-[1.5]`}
        />
      </div>

      <div>
        <label htmlFor="iq-link" className={LABEL}>
          Your Facebook, Instagram or current site <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="iq-link"
          inputMode="url"
          autoComplete="url"
          value={fields.link}
          onChange={(e) => set('link', e.target.value)}
          placeholder="facebook.com/yourbusiness"
          className={INPUT}
        />
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="iq-company">Company</label>
        <input
          id="iq-company"
          tabIndex={-1}
          autoComplete="off"
          value={fields.company}
          onChange={(e) => set('company', e.target.value)}
        />
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="text-center text-[13px] text-honey-warm">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="rounded-pill bg-text px-6 py-3.5 font-sans text-[14px] font-semibold text-bg transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {sending ? 'Sending…' : 'Send it to me →'}
      </button>
    </form>
  );
}
