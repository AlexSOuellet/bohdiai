'use client';

import { useState } from 'react';
import { Type } from './Type';
import type { FamilyWords } from './words';

/** The Main Street contact form. Posts to /api/contact, which requires the
 *  tenant id alongside name/email/message (see lib/validation contactSchema),
 *  so the page render threads the tenant id down as a prop, with the site's
 *  words for the form. Class-only — every declaration lives in skinVarsCss
 *  under .ms-contactform-*. */
export function MainStreetContactForm({ tenantId, words }: { tenantId: string; words: FamilyWords }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState('sending');
    const data = new FormData(e.currentTarget);
    try {
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

  if (state === 'sent') {
    return (
      <Type as="p" role="body" className="ms-contactform-body">
        {words.contactFormSent}
      </Type>
    );
  }

  return (
    <form onSubmit={onSubmit} className="ms-contactform-form">
      <Type as="label" role="eyebrow" className="ms-contactform-field">
        {words.contactFormName}
        <input name="name" required className="ms-contactform-input" />
      </Type>
      <Type as="label" role="eyebrow" className="ms-contactform-field">
        {words.contactFormEmail}
        <input name="email" type="email" required className="ms-contactform-input" />
      </Type>
      <Type as="label" role="eyebrow" className="ms-contactform-field">
        {words.contactFormMessage}
        <textarea name="message" required rows={5} className="ms-contactform-textarea" />
      </Type>
      <Type
        as="button"
        role="navLabel"
        type="submit"
        disabled={state === 'sending'}
        className="ms-contactform-submit"
      >
        {state === 'sending' ? words.contactFormSending : words.contactFormSend}
      </Type>
      {state === 'error' && (
        <Type as="p" role="caption" className="ms-contactform-status">
          {words.contactFormError}
        </Type>
      )}
    </form>
  );
}
