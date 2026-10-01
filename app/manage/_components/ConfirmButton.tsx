'use client';

import { useState } from 'react';

/** Two-step confirm in the page: native confirm() is suppressed by embedded
 *  browsers, so the button swaps to "Yes / Keep it". */
export function ConfirmButton({
  label,
  confirmLabel,
  keepLabel = 'Keep it',
  onConfirm,
  disabled = false,
}: {
  label: string;
  confirmLabel: string;
  keepLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="bk-btn bk-btn-danger" disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="bk-row">
      <button
        type="button"
        className="bk-btn bk-btn-danger"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="bk-btn bk-btn-quiet" onClick={() => setAsking(false)}>
        {keepLabel}
      </button>
    </span>
  );
}
