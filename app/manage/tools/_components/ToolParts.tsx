'use client';

/** The pieces every tool is built from: a number box with its unit, the hang tag the
 *  answer sits on, and a mark placed along a bar. */
import { useLayoutEffect, useRef } from 'react';

export function NumberField({
  id,
  label,
  value,
  onChange,
  before,
  after,
  note,
  wide,
  decimal = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  before?: string;
  after?: string;
  note?: string;
  wide?: boolean;
  decimal?: boolean;
}): React.ReactElement {
  return (
    <div className="bk-field bk-tool-field" data-wide={wide === true ? 'true' : undefined}>
      <label className="bk-label" htmlFor={id}>
        {label}
      </label>
      <span className="bk-tool-inp">
        {before !== undefined && <span className="bk-tool-unit">{before}</span>}
        <input id={id} className="bk-tool-num" type="text" inputMode={decimal ? 'decimal' : 'numeric'} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
        {after !== undefined && <span className="bk-tool-unit">{after}</span>}
      </span>
      {note !== undefined && <span className="bk-note">{note}</span>}
    </div>
  );
}

export function TextField({ id, label, value, onChange, wide }: { id: string; label: string; value: string; onChange: (v: string) => void; wide?: boolean }): React.ReactElement {
  return (
    <div className="bk-field bk-tool-field" data-wide={wide === true ? 'true' : undefined}>
      <label className="bk-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="bk-input" type="text" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** The answer, on a kraft hang tag tied on with brass string. */
export function HangTag({ label, title, children }: { label: string; title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <aside className="bk-hangtag" aria-live="polite" aria-label={label}>
      <span className="bk-hangtag-hole" aria-hidden="true" />
      <p className="bk-hangtag-for">{label}</p>
      <p className="bk-hangtag-name">{title}</p>
      {children}
    </aside>
  );
}

/** A position or width along a bar, 0–100, set as a CSS custom property (no inline styles). */
export function Placed({ className, at, width, title }: { className: string; at?: number; width?: number; title?: string }): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (at !== undefined) el.style.setProperty('--at', `${Math.max(0, Math.min(100, at))}%`);
    if (width !== undefined) el.style.setProperty('--w', `${Math.max(0, Math.min(100, width))}%`);
  }, [at, width]);
  return <span ref={ref} className={className} title={title} />;
}
