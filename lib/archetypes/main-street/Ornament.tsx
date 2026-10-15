/**
 * Main Street — the Victorian ornaments the scrapbook pieces share (the Vintage
 * family's trade card, cabinet card and close). Drawn as SVG in `currentColor`,
 * so whichever skin the site wears colors them; decoration only, hidden from
 * screen readers. No words.
 */

/** A corner flourish: a scrolled bracket that sits in one corner of a frame. The
 *  frame's CSS turns each copy to its corner. */
export function CornerFlourish({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true" focusable="false">
      <path d="M4 56 V22 C4 12 12 4 22 4 H56" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 56 V26 C10 17 17 10 26 10 H56" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M22 4 C22 14 14 22 4 22" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="17" cy="17" r="3.2" fill="currentColor" />
      <path d="M26 17 C32 12 40 13 44 18 C40 17 34 18 30 22" fill="currentColor" />
      <path d="M17 26 C12 32 13 40 18 44 C17 40 18 34 22 30" fill="currentColor" />
    </svg>
  );
}

/** A rosette: the round printer's flower that punctuates a playbill rule. */
export function Rosette({ className }: { className: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {petals.map((a) => (
        <ellipse key={a} cx="20" cy="10" rx="3.4" ry="7" fill="currentColor" transform={`rotate(${a} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** A horizontal scroll ornament for between lines of a card or a section. */
export function Flourish({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 240 24" aria-hidden="true" focusable="false">
      <path d="M4 12 H96" stroke="currentColor" strokeWidth="1" />
      <path d="M144 12 H236" stroke="currentColor" strokeWidth="1" />
      <path d="M96 12 C104 2 114 2 120 12 C126 22 136 22 144 12" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M96 12 C104 22 114 22 120 12 C126 2 136 2 144 12" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="120" cy="12" r="3" fill="currentColor" />
      <circle cx="4" cy="12" r="2" fill="currentColor" />
      <circle cx="236" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
