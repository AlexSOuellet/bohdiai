'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NoticeState = { error: string; saved: string; tick: number };

export type NoticeControls = {
  /** Show an error: clears "Saved.", moves focus to the notice, then scrolls to it. */
  showError: (message: string) => void;
  showSaved: (message: string) => void;
  clearError: () => void;
  clearSaved: () => void;
  clear: () => void;
};

/** The notice at the top of an editor. Both live regions stay in the page (empty when
 *  there is nothing to say) so screen readers announce what lands in them; each new
 *  message is a fresh node, so the same message twice is announced twice. */
export function useNotice(): NoticeControls & { area: React.ReactElement } {
  const [state, setState] = useState<NoticeState>({ error: '', saved: '', tick: 0 });
  const box = useRef<HTMLDivElement>(null);
  const focusTick = state.error === '' ? 0 : state.tick;

  useEffect(() => {
    if (focusTick === 0) return;
    box.current?.focus({ preventScroll: true });
    box.current?.scrollIntoView({ block: 'nearest' });
  }, [focusTick]);

  const showError = useCallback((error: string) => setState((s) => ({ error, saved: '', tick: s.tick + 1 })), []);
  const showSaved = useCallback((saved: string) => setState((s) => ({ error: '', saved, tick: s.tick + 1 })), []);
  const clearError = useCallback(() => setState((s) => (s.error === '' ? s : { ...s, error: '' })), []);
  const clearSaved = useCallback(() => setState((s) => (s.saved === '' ? s : { ...s, saved: '' })), []);
  const clear = useCallback(() => setState((s) => (s.error === '' && s.saved === '' ? s : { ...s, error: '', saved: '' })), []);

  const area = (
    <div ref={box} tabIndex={-1} className="bk-notices">
      <div role="alert">{state.error !== '' && <p key={state.tick} className="bk-notice">{state.error}</p>}</div>
      <div role="status">{state.saved !== '' && <p key={state.tick} className="bk-notice" data-tone="ok">{state.saved}</p>}</div>
    </div>
  );
  return { showError, showSaved, clearError, clearSaved, clear, area };
}
