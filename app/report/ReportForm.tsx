'use client';

import { useState, type FormEvent } from 'react';
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from '@/lib/intake/queries';
import {
  DETAILS_MAX,
  REPORT_FIELD,
  REPORT_REASONS,
  type ReportReason,
} from '@/lib/site-reports/report';

type Words = IntakeWords['report'];
type ErrorSpot = keyof Words['errors'];
type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

const LABEL = 'mb-1.5 block text-[13px] font-medium text-text';
const INPUT =
  'w-full rounded-[12px] border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-text placeholder:text-muted focus:border-honey-warm/60 focus:outline-none';

const isSpot = (w: Words, v: unknown): v is ErrorSpot => typeof v === 'string' && v in w.errors;

/** Say what's wrong on a site: which site, why, what happened, and an optional email. */
export function ReportForm({
  words: w,
  site,
}: {
  words: Words;
  site: { subdomain: string; name: string } | null;
}): React.ReactElement {
  const [address, setAddress] = useState(site?.subdomain ?? '');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const show = (spot: ErrorSpot): void => setStatus({ kind: 'error', message: w.errors[spot] });

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (address.trim() === '') return show('site');
    if (reason === null) return show('reason');
    if (details.trim() === '') return show('details');
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/report-site', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          [REPORT_FIELD.site]: address,
          [REPORT_FIELD.reason]: reason,
          [REPORT_FIELD.details]: details,
          [REPORT_FIELD.email]: email,
          [REPORT_FIELD.honeypot]: company,
        }),
      });
      if (res.ok) return setStatus({ kind: 'sent' });
      const body: unknown = await res.json().catch(() => null);
      const b = body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      if (isSpot(w, b['problem'])) return show(b['problem']);
      // The limiter's own message, when someone sends too many.
      if (typeof b['error'] === 'string') return setStatus({ kind: 'error', message: b['error'] });
      show('failed');
    } catch {
      show('failed');
    }
  }

  if (status.kind === 'sent') {
    return (
      <div role="status">
        <h2 className="font-sans text-[22px] font-semibold text-text">{w.sentTitle}</h2>
        <p className="mt-3">{w.sentBody}</p>
      </div>
    );
  }

  const sending = status.kind === 'sending';
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="flex flex-col gap-6">
      <p>{site === null ? w.ledeNoSite : fill(w.lede, { site: site.name })}</p>

      {site === null && (
        <div>
          <label htmlFor="rp-site" className={LABEL}>
            {w.site}
          </label>
          <input
            id="rp-site"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-describedby="rp-site-hint"
            className={INPUT}
            autoComplete="off"
          />
          <p id="rp-site-hint" className="mt-1 text-[12px] text-muted">
            {w.siteHint}
          </p>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className={LABEL}>{w.reason}</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 text-[15px]">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="size-4 accent-honey-warm"
            />
            {w.reasons[r]}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="rp-details" className={LABEL}>
          {w.details}
        </label>
        <textarea
          id="rp-details"
          rows={5}
          maxLength={DETAILS_MAX}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          aria-describedby="rp-details-hint"
          className={INPUT}
        />
        <p id="rp-details-hint" className="mt-1 text-[12px] text-muted">
          {w.detailsHint}
        </p>
      </div>

      <div className="max-w-[24rem]">
        <label htmlFor="rp-email" className={LABEL}>
          {w.email}
        </label>
        <input
          id="rp-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby="rp-email-hint"
          className={INPUT}
        />
        <p id="rp-email-hint" className="mt-1 text-[12px] text-muted">
          {w.emailHint}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <input
          id="rp-company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="text-[14px] text-honey-warm">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-pill bg-text px-8 py-3.5 font-sans text-[15px] font-semibold text-bg transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60 md:w-auto md:self-start"
      >
        {sending ? w.sending : w.send}
      </button>
    </form>
  );
}
