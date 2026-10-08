import { useId } from 'react';

/** The ember: one flame with the round of a b burned through it. Also the tab icon (app/icon.svg). */
export function Ember({ className, hollow = true }: { className?: string; hollow?: boolean }): React.ReactElement {
  const gradient = useId();
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="var(--honey-warm)" />
          <stop offset="1" stopColor="var(--honey-deep)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradient})`}
        fillRule="evenodd"
        d={hollow ? `${FLAME} ${COUNTER}` : FLAME}
      />
    </svg>
  );
}

const FLAME = 'M50 4C58 22 80 36 80 62C80 80 66 95 50 95C34 95 20 80 20 62C20 46 30 36 36 24C38 34 42 40 48 42C46 30 46 16 50 4Z';
const COUNTER = 'M63 65A13 13 0 1 0 37 65A13 13 0 1 0 63 65Z';

/**
 * The BohdiAI wordmark: the name, with the dot of the i swapped for a small solid
 * ember. The i is a dotless i (Manrope's latin-ext subset), so no dot sits under it.
 * Size it with a text-size class.
 */
export function Wordmark({ className = '' }: { className?: string }): React.ReactElement {
  return (
    <span
      role="img"
      aria-label="BohdiAI"
      className={`whitespace-nowrap font-[family-name:var(--font-display)] font-extrabold leading-none tracking-[-0.035em] text-text ${className}`}
    >
      <span aria-hidden="true">
        Bohd
        <span className="relative">
          ı
          <Ember hollow={false} className="absolute left-1/2 top-[0.05em] size-[0.4em] -translate-x-1/2" />
        </span>
        <span className="font-medium tracking-[-0.01em] text-text-soft">AI</span>
      </span>
    </span>
  );
}
