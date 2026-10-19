'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import type { DoneResult } from '@/lib/backend/catalog/results';
import { useNotice } from './Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** One form, one Save: the form, whether it has unsaved changes, and a save that
 *  checks first, can't fire twice, and lands every failure in the notice. */
export function useSaveForm<T>(initial: T, save: (form: T) => Promise<DoneResult>, check: (form: T) => string | null = () => null) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = JSON.stringify(form) !== JSON.stringify(saved);

  const update = (patch: Partial<T>): void => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  async function submit(): Promise<void> {
    if (inFlight.current) return;
    const problem = check(form);
    if (problem !== null) {
      notice.showError(problem);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await save(form);
      if (r.ok) {
        setSaved(form);
        notice.showSaved('Saved. Your site shows the changes now.');
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { form, update, unsaved, busy, submit, notice };
}
