'use client';

import { useState } from 'react';

/** A password box with Show / Hide inside it, so an owner can see what she typed. */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & { id: string }): React.ReactElement {
  const [shown, setShown] = useState(false);
  return (
    <div className="bk-pw">
      <input {...props} type={shown ? 'text' : 'password'} className="bk-input" />
      <button type="button" className="bk-pw-toggle" aria-pressed={shown} aria-controls={props.id} onClick={() => setShown((s) => !s)}>
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
