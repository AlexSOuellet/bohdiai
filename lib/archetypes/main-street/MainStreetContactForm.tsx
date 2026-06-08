'use client';

import { useState } from 'react';
import type { ArchetypeTheme } from '../types';
import { typeRoleCss, roles } from './chrome';

/** The Main Street contact form. Posts to /api/contact, which requires the
 *  tenant id alongside name/email/message (see lib/validation contactSchema),
 *  so the page render threads the tenant id down as a prop. Structure only:
 *  colors are skin vars, type values are named roles. */
export function MainStreetContactForm({ skin, tenantId }: { skin: ArchetypeTheme; tenantId: string }) {
  const r = roles(skin);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState('sending');
    const data = new FormData(e.currentTarget);
    try {
      // Field names MUST match lib/validation contactSchema: tenantId/name/email/message.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
        }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  const field: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: 6,
    background: 'var(--ms-bg)',
    color: 'var(--ms-fg)',
    border: '1px solid var(--ms-rule)',
    borderRadius: 2,
    font: 'inherit',
  };
  const label: React.CSSProperties = {
    ...typeRoleCss(r.eyebrow),
    color: 'var(--ms-fg)',
    display: 'block',
    marginTop: 18,
  };

  if (state === 'sent') {
    return (
      <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg)' }}>
        Thanks — your message is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
      <label style={label}>
        Name
        <input name="name" required style={field} />
      </label>
      <label style={label}>
        Email
        <input name="email" type="email" required style={field} />
      </label>
      <label style={label}>
        Message
        <textarea name="message" required rows={5} style={field} />
      </label>
      <button
        type="submit"
        disabled={state === 'sending'}
        data-type="navLabel"
        style={{
          ...typeRoleCss(r.navLabel),
          marginTop: 22,
          background: 'var(--ms-accent)',
          color: 'var(--ms-on-accent)',
          border: 'none',
          borderRadius: 2,
          padding: '14px 28px',
          cursor: state === 'sending' ? 'default' : 'pointer',
        }}
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {state === 'error' && (
        <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-accent)', marginTop: 12 }}>
          Something went wrong — try again.
        </p>
      )}
    </form>
  );
}
