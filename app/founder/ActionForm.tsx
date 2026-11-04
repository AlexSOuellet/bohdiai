'use client';

import { useActionState } from 'react';
import type { FormResult } from '@/lib/founder/promo-actions';

type Props = {
  action: (prev: FormResult | null, form: FormData) => Promise<FormResult>;
  button: string;
  /** A site the form acts on. */
  tenantId?: string;
  quiet?: boolean;
  children?: React.ReactNode;
};

/** An admin form that says what happened, whichever way it went. */
export function ActionForm({ action, button, tenantId, quiet = false, children }: Props): React.ReactElement {
  const [result, run, busy] = useActionState(action, null);
  return (
    <form action={run} className="fd-form">
      {tenantId !== undefined && <input type="hidden" name="tenantId" value={tenantId} />}
      {children}
      <button type="submit" className={quiet ? 'fd-out' : 'bk-btn'} disabled={busy}>
        {button}
      </button>
      {result !== null && (
        <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'bk-note' : 'bk-error'}>
          {result.message}
        </p>
      )}
    </form>
  );
}
