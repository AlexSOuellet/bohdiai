/**
 * Wordmark — the shop's identity element in the nav.
 *
 * If a logoUrl is provided, renders the uploaded brand mark as an <img>.
 * Otherwise, splits the shop name into first-word / rest spans and lets the
 * storefront's CSS rules apply the wordmark treatment (solid / gradient /
 * outline / two-tone). Treatment is selected by the data-wordmark-treatment
 * attribute on the storefront root, set by app/storefront/layout.tsx.
 *
 * Color, font, and letter-spacing for the typographic wordmark come from CSS
 * custom properties emitted by tokensToCssVars.
 *
 * Sizing/weight stay with the parent so each nav block can tune its own scale.
 */

interface WordmarkProps {
  shopName: string;
  logoUrl?: string | undefined;
  className?: string | undefined;
}

export default function Wordmark({ shopName, logoUrl, className = '' }: WordmarkProps) {
  if (logoUrl !== undefined && logoUrl !== '') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={shopName}
        className={`sf-logo ${className}`}
      />
    );
  }

  const trimmed = shopName.trim();
  const spaceAt = trimmed.indexOf(' ');
  const hasSecondPart = spaceAt > 0;
  const firstPart = hasSecondPart ? trimmed.slice(0, spaceAt) : trimmed;
  const secondPart = hasSecondPart ? trimmed.slice(spaceAt) : '';

  return (
    <span className={`sf-wordmark ${className}`}>
      <span className="sf-wordmark-1">{firstPart}</span>
      {hasSecondPart && <span className="sf-wordmark-2">{secondPart}</span>}
    </span>
  );
}
