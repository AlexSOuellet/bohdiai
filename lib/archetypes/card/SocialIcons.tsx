/**
 * The maker's social links as icons (Saltmarsh & Lace demo spec): Facebook and
 * Instagram from About you, each shown only when set. The icon carries the name
 * for screen readers; the drawing is decorative.
 */
import type { ReactElement } from 'react';

function Facebook(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}

function Instagram(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function SocialIcons({
  facebookUrl,
  instagramUrl,
  className,
  labels,
}: {
  facebookUrl: string;
  instagramUrl: string;
  className: string;
  /** The site's words naming each link for screen readers. */
  labels: { facebook: string; instagram: string };
}): ReactElement | null {
  if (facebookUrl === '' && instagramUrl === '') return null;
  return (
    <span className={className}>
      {facebookUrl !== '' && (
        <a href={facebookUrl} rel="noopener" aria-label={labels.facebook}>
          <Facebook />
        </a>
      )}
      {instagramUrl !== '' && (
        <a href={instagramUrl} rel="noopener" aria-label={labels.instagram}>
          <Instagram />
        </a>
      )}
    </span>
  );
}
