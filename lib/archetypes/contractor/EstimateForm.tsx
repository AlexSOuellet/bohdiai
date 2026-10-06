'use client';

/**
 * The estimate request — name, a way to reach them, town/state, what they need,
 * the job in their words, and up to 5 photos of the space. Posts multipart to
 * /api/estimate, which shrinks the photos and emails the whole request to the
 * business. Every failure path shows the visitor something; nothing is silent.
 */
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CONTRACTOR_STRINGS } from './strings';

const S = CONTRACTOR_STRINGS.form;
export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

/** Client-side checks that mirror the server's, so most mistakes never leave the page. */
export function checkEstimate(fields: { name: string; phone: string; email: string }, photos: File[]): string | null {
  if (fields.name.trim() === '') return S.errorName;
  if (fields.phone.trim() === '' && fields.email.trim() === '') return S.errorNeedContact;
  if (photos.length > MAX_PHOTOS) return S.errorTooManyPhotos;
  if (photos.some((f) => !(PHOTO_TYPES as readonly string[]).includes(f.type))) return S.errorPhotoType;
  if (photos.some((f) => f.size > MAX_PHOTO_BYTES)) return S.errorPhotoTooBig;
  return null;
}

export function EstimateForm({ tenantId, services, states, detailsHint }: { tenantId: string; services: string[]; states: string[]; detailsHint?: string | undefined }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [photos, setPhotos] = useState<File[]>([]);

  function onPhotos(e: ChangeEvent<HTMLInputElement>): void {
    const list = Array.from(e.target.files ?? []);
    setPhotos(list);
    const problem = checkEstimate({ name: 'x', phone: 'x', email: '' }, list);
    setStatus(problem === null ? { kind: 'idle' } : { kind: 'error', message: problem });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const problem = checkEstimate(
      { name: String(data.get('name') ?? ''), phone: String(data.get('phone') ?? ''), email: String(data.get('email') ?? '') },
      photos,
    );
    if (problem !== null) {
      setStatus({ kind: 'error', message: problem });
      return;
    }
    data.delete('photos');
    for (const p of photos) data.append('photos', p);
    data.set('tenantId', tenantId);
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/estimate', { method: 'POST', body: data });
      if (res.ok) {
        form.reset();
        setPhotos([]);
        setStatus({ kind: 'sent' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      const message =
        body !== null && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
          ? (body as { error: string }).error
          : S.errorGeneric;
      setStatus({ kind: 'error', message });
    } catch {
      setStatus({ kind: 'error', message: S.errorNetwork });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="cp-done" role="status">
        <h3>{S.successTitle}</h3>
        <p>{S.successBody}</p>
        <button type="button" className="cp-btn cp-btn--line" onClick={() => setStatus({ kind: 'idle' })}>
          {S.sendAnother}
        </button>
      </div>
    );
  }

  const sending = status.kind === 'sending';
  return (
    <form className="cp-form" onSubmit={onSubmit} noValidate aria-busy={sending}>
      <div className="cp-field">
        <label htmlFor="cp-name">{S.name}</label>
        <input id="cp-name" name="name" className="cp-input" autoComplete="name" required />
      </div>
      <div className="cp-field cp-field--half">
        <label htmlFor="cp-phone">{S.phone}</label>
        <input id="cp-phone" name="phone" type="tel" className="cp-input" autoComplete="tel" inputMode="tel" />
      </div>
      <div className="cp-field cp-field--half">
        <label htmlFor="cp-email">{S.email}</label>
        <input id="cp-email" name="email" type="email" className="cp-input" autoComplete="email" />
      </div>
      <p className="cp-hint cp-field">{S.contactHint}</p>
      <div className="cp-field cp-field--half">
        <label htmlFor="cp-town">{S.town}</label>
        <input id="cp-town" name="town" className="cp-input" autoComplete="address-level2" />
      </div>
      <div className="cp-field cp-field--half">
        <label htmlFor="cp-state">{S.state}</label>
        <select id="cp-state" name="state" className="cp-input" defaultValue="">
          <option value="" disabled>{S.statePlaceholder}</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <fieldset className="cp-chips">
        <legend>{S.services}</legend>
        <div className="cp-chips__row">
          {services.map((s) => (
            <label key={s} className="cp-chip">
              <input type="checkbox" name="services" value={s} />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="cp-field">
        <label htmlFor="cp-details">{S.details} <small>{S.optional}</small></label>
        <textarea id="cp-details" name="details" className="cp-input" placeholder={detailsHint ?? S.detailsHint} />
      </div>
      <div className="cp-field">
        <label htmlFor="cp-photos">{S.photos} <small>{S.optional}</small></label>
        <div className="cp-drop">
          <input id="cp-photos" name="photos" type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={onPhotos} />
          <p className="cp-hint">{S.photosHint}</p>
          {photos.length > 0 && <p className="cp-drop__count">{S.photosChosen(photos.length)}</p>}
        </div>
      </div>
      <div className="cp-hp" aria-hidden="true">
        <label htmlFor="cp-company">{S.honeypot}</label>
        <input id="cp-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      {status.kind === 'error' && <p className="cp-alert" role="alert">{status.message}</p>}
      <div className="cp-form__foot">
        <button type="submit" className="cp-btn cp-btn--solid" disabled={sending}>
          {sending ? S.sending : S.submit}
        </button>
      </div>
    </form>
  );
}
