/**
 * The maker's social links as icons (Saltmarsh & Lace demo spec): Facebook and
 * Instagram from About you, each shown only when set. The icon carries the name
 * for screen readers; the drawing is decorative.
 */
import type { ReactElement } from 'react';

function Facebook(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9.1 23.7v-8H6.6V12h2.5v-1.6c0-4.1 1.8-6 5.9-6 .8 0 2.1.2 2.6.3v3.3l-1.4-.1c-2 0-2.7.8-2.7 2.8V12h3.9l-.7 3.7h-3.2V24c5.9-.7 10.5-5.8 10.5-11.9C24 5.4 18.6 0 12 0S0 5.4 0 12c0 5.6 3.9 10.4 9.1 11.7Z" />
    </svg>
  );
}

function Instagram(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="17.6" cy="6.4" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function SocialIcons({
  facebookUrl,
  instagramUrl,
  className,
  labels,
  showNames = false,
  nameType,
}: {
  facebookUrl: string;
  instagramUrl: string;
  className: string;
  /** The site's words naming each link: read aloud, or written out with `showNames`. */
  labels: { facebook: string; instagram: string };
  /** Write each network's name beside its icon (the mood sites' footer buttons). */
  showNames?: boolean;
  /** The type role the written names take (stamped as `data-type`), so they letter like the site's own buttons. */
  nameType?: string;
}): ReactElement | null {
  if (facebookUrl === '' && instagramUrl === '') return null;
  return (
    <span className={showNames ? `social-btns ${className}` : className}>
      {facebookUrl !== '' && (
        <a href={facebookUrl} rel="noopener" className="is-facebook" aria-label={showNames ? undefined : labels.facebook}>
          <Facebook />
          {showNames && <span data-type={nameType}>{labels.facebook}</span>}
        </a>
      )}
      {instagramUrl !== '' && (
        <a href={instagramUrl} rel="noopener" className="is-instagram" aria-label={showNames ? undefined : labels.instagram}>
          <Instagram />
          {showNames && <span data-type={nameType}>{labels.instagram}</span>}
        </a>
      )}
    </span>
  );
}
