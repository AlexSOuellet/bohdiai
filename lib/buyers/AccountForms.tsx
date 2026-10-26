'use client';
/**
 * The buyer's forms on a shop: sign in or create an account (one screen, a link
 * between them), forgot password, a new password from the emailed link, and
 * Reorder. Every word is the shop's own. Shared by every design; each design
 * styles the `ba-` classes in its own look.
 */
import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { fill } from '@/lib/site-words/words';
import type { ShopWords } from '@/lib/storefront/words';
import { requestBuyerReset, reorderBuyerOrder, resetBuyerPassword, signInBuyer, signUpBuyer, type BuyerResult } from './actions';

type W = ShopWords['account'];

/** Runs an action and keeps its error; a thrown action shows the shop's failure words. */
function useAction(failed: string) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(act: () => Promise<BuyerResult>): Promise<BuyerResult | null> {
    setBusy(true);
    setError('');
    try {
      const result = await act();
      if (!result.ok) setError(result.error === '' ? failed : result.error);
      return result;
    } catch (err) {
      // A successful action redirects by throwing Next's redirect signal; let Next handle it.
      unstable_rethrow(err);
      setError(failed);
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { error, busy, run };
}

function Field({ id, label, hint, ...input }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="ba-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} {...(hint !== undefined ? { 'aria-describedby': `${id}-hint` } : {})} />
      {hint !== undefined && (
        <span id={`${id}-hint`} className="ba-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

/** Sign in, or create an account. */
export function SignInOrCreate({ w, minPassword }: { w: W; minPassword: number }) {
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, busy, run } = useAction(w.errors.failed);
  const creating = mode === 'create';
  const words = creating ? w.create : w.signIn;

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await run(() => (creating ? signUpBuyer({ name, email, password }) : signInBuyer({ email, password })));
  }

  return (
    <section className="ba-card" aria-labelledby="ba-title">
      <h1 id="ba-title" className="ba-title">
        {words.title}
      </h1>
      <p className="ba-lede">{words.lede}</p>
      <form className="ba-form" onSubmit={onSubmit} noValidate>
        {creating && <Field id="ba-name" label={w.create.name} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        <Field id="ba-email" label={words.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          id="ba-password"
          label={words.password}
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...(creating ? { hint: fill(w.create.passwordHint, { n: minPassword }) } : {})}
        />
        {error !== '' && (
          <p role="alert" className="ba-error">
            {error}
          </p>
        )}
        <button type="submit" className="ba-btn" disabled={busy}>
          {busy ? words.submitting : words.submit}
        </button>
      </form>
      <p className="ba-links">
        {!creating && (
          <a className="ba-link" href="/account/forgot">
            {w.signIn.forgot}
          </a>
        )}
        <button type="button" className="ba-link" onClick={() => setMode(creating ? 'signin' : 'create')}>
          {creating ? w.create.toSignIn : w.signIn.toCreate}
        </button>
      </p>
    </section>
  );
}

export function ForgotPassword({ w }: { w: W }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const { error, busy, run } = useAction(w.errors.failed);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const result = await run(() => requestBuyerReset({ email }));
    if (result?.ok === true) setSent(result.message ?? w.forgot.sent);
  }

  return (
    <section className="ba-card" aria-labelledby="ba-title">
      <h1 id="ba-title" className="ba-title">
        {w.forgot.title}
      </h1>
      {sent !== '' ? (
        <p role="status" className="ba-lede">
          {sent}
        </p>
      ) : (
        <>
          <p className="ba-lede">{w.forgot.lede}</p>
          <form className="ba-form" onSubmit={onSubmit} noValidate>
            <Field id="ba-email" label={w.signIn.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error !== '' && (
              <p role="alert" className="ba-error">
                {error}
              </p>
            )}
            <button type="submit" className="ba-btn" disabled={busy}>
              {busy ? w.forgot.submitting : w.forgot.submit}
            </button>
          </form>
        </>
      )}
      <p className="ba-links">
        <a className="ba-link" href="/account">
          {w.forgot.back}
        </a>
      </p>
    </section>
  );
}

export function NewPassword({ w, tokenHash, minPassword }: { w: W; tokenHash: string; minPassword: number }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { error, busy, run } = useAction(w.errors.failed);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await run(() => resetBuyerPassword({ tokenHash, password, confirm }));
  }

  return (
    <section className="ba-card" aria-labelledby="ba-title">
      <h1 id="ba-title" className="ba-title">
        {w.newPassword.title}
      </h1>
      <p className="ba-lede">{w.newPassword.lede}</p>
      <form className="ba-form" onSubmit={onSubmit} noValidate>
        <Field id="ba-password" label={w.newPassword.password} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint={fill(w.create.passwordHint, { n: minPassword })} />
        <Field id="ba-confirm" label={w.newPassword.confirm} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error !== '' && (
          <p role="alert" className="ba-error">
            {error}
          </p>
        )}
        <button type="submit" className="ba-btn" disabled={busy}>
          {busy ? w.newPassword.submitting : w.newPassword.submit}
        </button>
      </form>
    </section>
  );
}

export function ReorderButton({ w, number }: { w: W; number: string }) {
  const { error, busy, run } = useAction(w.errors.failed);
  return (
    <div className="ba-reorder">
      <button type="button" className="ba-btn" disabled={busy} onClick={() => void run(() => reorderBuyerOrder({ number }))}>
        {busy ? w.order.reordering : w.order.reorder}
      </button>
      {error !== '' && (
        <p role="alert" className="ba-error">
          {error}
        </p>
      )}
    </div>
  );
}
