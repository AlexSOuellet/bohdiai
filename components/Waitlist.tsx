'use client';

import { useMemo, useState } from 'react';
import { waitlistSchema } from '@/lib/validation';
import { SectionKicker } from './SectionKicker';

type Props = {
  founderTakenCount: number;
  founderCap: number;
};

type Mode = 'founder' | 'notify';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'already' }
  | { kind: 'error'; message: string };

export function Waitlist({ founderTakenCount, founderCap }: Props): React.ReactElement {
  const founderFull = founderTakenCount >= founderCap;

  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<Mode>(founderFull ? 'notify' : 'founder');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const emailValid = useMemo(
    () => waitlistSchema.shape.email.safeParse(email).success,
    [email],
  );
  const canSubmit = emailValid && status.kind !== 'submitting';

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>): Promise<void> {
    ev.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, type: mode }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        already?: boolean;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        if (res.status === 409 && mode === 'founder') {
          setMode('notify');
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
      setStatus({ kind: data.already ? 'already' : 'success' });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Network hiccup. Please try again in a moment.',
      });
    }
  }

  return (
    <section id="waitlist" className="relative z-content px-3 py-14 md:py-24">
      <SectionKicker>Reserve your shop</SectionKicker>

      <h2 className="mx-auto max-w-[680px] px-3 text-center font-sans text-[28px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[42px] md:tracking-[-0.03em]">
        Be one of the{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
          first {founderCap}
        </em>
        .
      </h2>
      <p className="mx-auto mt-3.5 max-w-[520px] px-3.5 text-center text-[14px] leading-[1.55] text-muted md:mt-4 md:text-[15px]">
        Founder Beta opens this summer. Pick one of {founderCap} spots and get your storefront —
        and locked-in founder pricing — before everyone else.
      </p>

      <div className="mx-auto mt-8 max-w-[520px] rounded-[16px] border border-honey-warm/[0.18] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(243,201,122,0.15)] backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(26,20,16,0.85),rgba(10,8,5,0.75))] md:mt-10 md:rounded-[18px] md:p-7">
        {status.kind === 'success' || status.kind === 'already' ? (
          <SuccessState kind={status.kind} email={email} />
        ) : (
          <>
            <ToggleGroup
              mode={mode}
              founderFull={founderFull}
              onChange={(m) => {
                setMode(m);
                if (status.kind === 'error') setStatus({ kind: 'idle' });
              }}
            />

            <Counter mode={mode} founderTakenCount={founderTakenCount} founderCap={founderCap} />

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5">
              <label htmlFor="wl-email" className="sr-only">
                Email address
              </label>
              <input
                id="wl-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !emailValid}
                className="w-full appearance-none rounded-[10px] border border-white/[0.1] bg-black/40 px-3.5 py-3 font-sans text-[14px] text-text placeholder:text-text-soft/35 focus:border-honey-warm/50 focus:shadow-[0_0_0_3px_rgba(243,201,122,0.12)] focus:outline-none md:px-4 md:py-3.5 md:text-[15px]"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-[10px] bg-gradient-to-b from-honey-warm to-honey-deep px-4 py-3 font-sans text-[13px] font-bold tracking-[0.01em] text-bg-2 shadow-[0_10px_28px_-8px_rgba(243,201,122,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:px-4.5 md:py-3.5 md:text-[14px]"
              >
                {status.kind === 'submitting'
                  ? 'Sending…'
                  : mode === 'founder'
                    ? 'Claim my founder spot →'
                    : 'Notify me at launch →'}
              </button>
            </form>

            {status.kind === 'error' && (
              <p
                role="alert"
                aria-live="polite"
                className="mt-2.5 text-center text-[12px] text-honey-warm"
              >
                {status.message}
              </p>
            )}

            <p className="mt-2.5 text-center text-[10px] tracking-[0.01em] text-muted md:mt-3 md:text-[11px]">
              No spam. We&apos;ll email you the moment your spot&apos;s ready.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function ToggleGroup({
  mode,
  founderFull,
  onChange,
}: {
  mode: Mode;
  founderFull: boolean;
  onChange: (m: Mode) => void;
}): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Waitlist option"
      className="mb-3.5 grid grid-cols-2 gap-1.5 rounded-[12px] border border-white/[0.06] bg-black/35 p-1 md:gap-2 md:p-1.5"
    >
      <ToggleButton
        active={mode === 'founder'}
        disabled={founderFull}
        onClick={() => onChange('founder')}
        title="Founder Beta"
        small={founderFull ? 'Spots filled' : '25 spots · locked-in pricing'}
      />
      <ToggleButton
        active={mode === 'notify'}
        onClick={() => onChange('notify')}
        title="Notify me"
        small="When we launch publicly"
      />
    </div>
  );
}

function ToggleButton({
  active,
  disabled,
  onClick,
  title,
  small,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  small: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex cursor-pointer flex-col items-center gap-0.5 rounded-[8px] border-0 bg-transparent px-2 py-2.5 font-sans text-[12px] font-semibold leading-[1.1] tracking-[-0.005em] transition-[background,color,box-shadow] duration-base md:px-2.5 md:py-3 md:text-[13px]',
        active
          ? 'text-honey-warm shadow-[inset_0_0_0_1px_rgba(243,201,122,0.4),0_0_24px_-6px_rgba(243,201,122,0.4)] [background:linear-gradient(180deg,rgba(243,201,122,0.18),rgba(233,161,61,0.08))]'
          : 'text-muted',
        disabled
          ? 'cursor-not-allowed text-text-soft/25 [&_.small]:text-text-soft/25'
          : '',
      ].join(' ')}
    >
      {title}
      <span
        className={[
          'small text-[9px] font-medium uppercase tracking-[0.06em] opacity-85 md:text-[10px]',
          active ? 'text-honey-warm' : 'text-muted',
        ].join(' ')}
      >
        {small}
      </span>
    </button>
  );
}

function Counter({
  mode,
  founderTakenCount,
  founderCap,
}: {
  mode: Mode;
  founderTakenCount: number;
  founderCap: number;
}): React.ReactElement {
  const isNotify = mode === 'notify';
  const pct = isNotify ? 100 : Math.min(100, Math.round((founderTakenCount / founderCap) * 100));
  return (
    <div className="mb-3.5 flex items-center gap-2 text-[11px] tracking-[0.01em] text-text-soft md:gap-2.5 md:text-[12px]">
      <span className="shrink-0">
        {isNotify ? (
          <>
            <b className="font-semibold text-honey-warm">You&apos;re early.</b> We&apos;ll email the
            moment we open.
          </>
        ) : (
          <>
            <b className="font-semibold text-honey-warm">{founderTakenCount}</b> of {founderCap}{' '}
            founder spots claimed
          </>
        )}
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-pill bg-white/[0.06]">
        <span
          className={[
            'block h-full rounded-pill transition-[width] duration-base',
            isNotify
              ? '[background:linear-gradient(to_right,rgba(243,201,122,0.4),rgba(243,201,122,0.4))]'
              : 'shadow-[0_0_12px_rgba(243,201,122,0.5)] [background:linear-gradient(to_right,var(--honey-deep),var(--honey-warm))]',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

function SuccessState({ kind, email }: { kind: 'success' | 'already'; email: string }): React.ReactElement {
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function onResend(): Promise<void> {
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
        data.ok ? 'Sent. Check your inbox.' : (data.message ?? 'Couldn’t resend. Try again.'),
      );
    } catch {
      setResendMsg('Network hiccup. Try again in a moment.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="px-2 py-3 text-center md:px-2">
      <div className="mx-auto mb-3.5 grid size-12 place-items-center rounded-full text-[22px] font-extrabold text-bg-2 shadow-[0_0_32px_rgba(243,201,122,0.5)] [background:radial-gradient(circle,var(--honey-warm),var(--honey-deep))]">
        ✓
      </div>
      <h4 className="mb-2 font-sans text-[19px] font-medium tracking-[-0.015em] text-text md:text-[22px]">
        {kind === 'success' ? 'Almost there.' : 'You’re already on the list.'}
      </h4>
      <p className="mx-auto max-w-[380px] text-[13px] leading-[1.5] text-muted md:text-[14px]">
        {kind === 'success' ? (
          <>
            Check your email to confirm. We just sent you a{' '}
            <b className="font-medium text-text-soft">link</b> — click it to lock in your spot.
          </>
        ) : (
          <>
            We have <b className="font-medium text-text-soft">{email}</b> already. If you didn’t
            get a confirmation link, we can send another.
          </>
        )}
      </p>
      {kind === 'already' && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="rounded-[10px] bg-gradient-to-b from-honey-warm to-honey-deep px-5 py-2.5 font-sans text-[13px] font-bold tracking-[0.01em] text-bg-2 shadow-[0_10px_28px_-8px_rgba(243,201,122,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {resending ? 'Sending…' : 'Resend the confirmation link'}
          </button>
          {resendMsg && (
            <p className="mt-3 text-[12px] text-text-soft" aria-live="polite">
              {resendMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
