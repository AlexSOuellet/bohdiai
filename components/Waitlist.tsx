'use client';

import { useMemo, useState } from 'react';
import { waitlistSchema } from '@/lib/validation';

type Props = {
  founderTakenCount: number;
  founderCap: number;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; message: string }
  | { kind: 'already' }
  | { kind: 'error'; message: string };

export function Waitlist({ founderTakenCount, founderCap }: Props) {
  const founderFull = founderTakenCount >= founderCap;
  const founderRemaining = Math.max(0, founderCap - founderTakenCount);

  const [email, setEmail] = useState('');
  const [type, setType] = useState<'founder' | 'notify'>(founderFull ? 'notify' : 'founder');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const emailValid = useMemo(() => {
    const parsed = waitlistSchema.shape.email.safeParse(email);
    return parsed.success;
  }, [email]);

  const canSubmit = emailValid && status.kind !== 'submitting';

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        already?: boolean;
        message?: string;
        type?: 'founder' | 'notify';
      };
      if (!res.ok || !data.ok) {
        if (res.status === 409 && type === 'founder') {
          setType('notify');
          setStatus({
            kind: 'error',
            message: 'Founder spots just filled. You can join the regular waitlist instead.',
          });
          return;
        }
        setStatus({
          kind: 'error',
          message: data.message ?? 'Something went wrong. Please try again.',
        });
        return;
      }
      if (data.already) {
        setStatus({ kind: 'already' });
        return;
      }
      setStatus({
        kind: 'success',
        message: 'Check your email to confirm. We just sent you a link.',
      });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Network hiccup. Please try again in a moment.',
      });
    }
  }

  if (status.kind === 'success' || status.kind === 'already') {
    return (
      <section id="waitlist" className="relative">
        <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
          <SuccessCard
            heading={status.kind === 'success' ? 'Almost there.' : 'You’re already on the list.'}
            body={
              status.kind === 'success'
                ? 'Check your email to confirm. We just sent you a link — click it to lock in your spot.'
                : 'We have your email already. If you didn’t get a confirmation link, we can send another.'
            }
            showResend={status.kind === 'already'}
            email={email}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="relative">
      <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid items-start gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
              / waitlist
            </div>
            <h2 className="font-serif text-[40px] font-light leading-[1.05] tracking-[-0.02em] text-ink-900 md:text-[52px]">
              Get on the list.
            </h2>
            <p className="mt-5 max-w-[40ch] text-[16.5px] leading-relaxed text-ink-600">
              Two ways in. <strong className="font-medium text-ink-900">Founder Beta</strong> is for
              the first {founderCap} owners who want hands-on access and a forever discount.{' '}
              <strong className="font-medium text-ink-900">Notify me</strong> is one quiet email
              when we launch.
            </p>
            <p className="mt-5 max-w-[40ch] text-[14px] text-ink-500">
              We&rsquo;ll never share your email. Unsubscribe in one click, always.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="card rounded-3xl border border-cream-300 bg-cream-50 p-7 md:col-span-7 md:p-9"
          >
            <fieldset>
              <legend className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-600">
                Choose your level
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioCard
                  name="type"
                  value="founder"
                  checked={type === 'founder'}
                  disabled={founderFull}
                  onChange={() => setType('founder')}
                  title={
                    founderFull
                      ? 'Founder Beta — Full'
                      : `Founder Beta (${founderRemaining} of ${founderCap} left)`
                  }
                  body="Hands-on access during beta. Founding-member pricing for life."
                />
                <RadioCard
                  name="type"
                  value="notify"
                  checked={type === 'notify'}
                  onChange={() => setType('notify')}
                  title="Notify me at launch"
                  body="One email when public access opens. No promo blasts."
                />
              </div>
            </fieldset>

            <label className="block pt-7">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-600">
                Email
              </span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="input focus-ring"
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !emailValid}
              />
            </label>

            {status.kind === 'error' && (
              <p role="alert" className="mt-3 text-[13px] text-honey-700">
                {status.message}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-[34ch] text-[12px] text-ink-500">
                You&rsquo;ll get a confirmation link by email. Click it to lock in your spot.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-primary focus-ring rounded-full px-6 py-3.5 text-[14px] font-medium"
              >
                {status.kind === 'submitting'
                  ? 'Sending…'
                  : type === 'founder'
                    ? 'Reserve my founder spot'
                    : 'Notify me at launch'}{' '}
                {status.kind !== 'submitting' && <>&nbsp;→</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function RadioCard({
  name,
  value,
  checked,
  disabled,
  onChange,
  title,
  body,
}: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={[
        'block cursor-pointer rounded-2xl border p-4 transition-colors',
        checked ? 'border-ink-900 bg-cream-100' : 'border-cream-300 bg-cream-50 hover:bg-cream-100',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={[
            'mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border',
            checked ? 'border-ink-900 bg-ink-900' : 'border-ink-400 bg-transparent',
          ].join(' ')}
        />
        <div>
          <div className="font-serif text-[16px] leading-tight text-ink-900">{title}</div>
          <div className="mt-1 text-[13px] text-ink-600">{body}</div>
        </div>
      </div>
    </label>
  );
}

function SuccessCard({
  heading,
  body,
  showResend,
  email,
}: {
  heading: string;
  body: string;
  showResend: boolean;
  email: string;
}) {
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function onResend() {
    if (resending) return;
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      setResendMsg(
        data.ok
          ? 'Sent. Check your inbox.'
          : (data.message ?? 'Couldn’t resend. Try again in a moment.'),
      );
    } catch {
      setResendMsg('Network hiccup. Try again in a moment.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="animate-rise mx-auto max-w-[640px] rounded-3xl border border-honey-400/40 bg-honey-300/15 p-8 text-center md:p-10">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
        / waitlist
      </div>
      <h2 className="mt-3 font-serif text-[32px] font-light leading-[1.1] tracking-[-0.015em] text-ink-900 md:text-[40px]">
        {heading}
      </h2>
      <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink-700">{body}</p>
      {showResend && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="btn-primary focus-ring rounded-full px-5 py-3 text-[13px] font-medium"
          >
            {resending ? 'Sending…' : 'Resend the confirmation link'}
          </button>
          {resendMsg && <p className="mt-3 text-[13px] text-ink-600">{resendMsg}</p>}
        </div>
      )}
    </div>
  );
}
