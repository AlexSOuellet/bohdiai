'use client';

import { useEffect, useRef, useState } from 'react';

/** Two-step confirm in the page: native confirm() is suppressed by embedded
 *  browsers, so the button swaps to "Yes / Keep it". Focus follows the swap:
 *  onto "Yes…" when it asks, back to the button after "Keep it". */
export function ConfirmButton({
  label,
  confirmLabel,
  keepLabel = 'Keep it',
  onConfirm,
  disabled = false,
  describedBy,
}: {
  label: string;
  confirmLabel: string;
  keepLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  /** Id of a note that explains why the button is off. */
  describedBy?: string | undefined;
}): React.ReactElement {
  const [asking, setAsking] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (asking) yes.current?.focus();
    else if (refocus.current) {
      refocus.current = false;
      trigger.current?.focus();
    }
  }, [asking]);

  if (!asking) {
    return (
      <button ref={trigger} type="button" className="bk-btn bk-btn-danger" disabled={disabled} aria-describedby={describedBy} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="bk-row">
      <button
        ref={yes}
        type="button"
        className="bk-btn bk-btn-danger"
        disabled={disabled}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        className="bk-btn bk-btn-quiet"
        disabled={disabled}
        onClick={() => {
          refocus.current = true;
          setAsking(false);
        }}
      >
        {keepLabel}
      </button>
    </span>
  );
}
