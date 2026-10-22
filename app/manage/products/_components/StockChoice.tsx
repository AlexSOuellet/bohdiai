'use client';

/**
 * How a piece is stocked (Alex, 2026-10-22): one of a kind, a count, or made to
 * order, asked in plain words, so a maker never has to know that "1" means one of
 * a kind or that a blank means made to order. `StockChoice` is the product's own;
 * `StockCell` is one combination's, inside the options table.
 */
import type { StockKind } from '@/lib/catalog/stock';

const CHOICES: readonly { kind: StockKind; label: string; note: string }[] = [
  { kind: 'one_of_a_kind', label: 'One of a kind', note: 'Just this one. Once it sells, your site shows it as Sold.' },
  { kind: 'count', label: 'I have some', note: 'Say how many. At 0 your site shows Sold out until you add more.' },
  { kind: 'made_to_order', label: 'Made to order', note: 'You make it when someone asks, so it never sells out.' },
];

/** Moving to one of a kind starts at its one piece, unless it has already sold. */
function stockFor(kind: StockKind, stock: string): string {
  return kind === 'one_of_a_kind' ? (stock.trim() === '0' ? '0' : '1') : stock;
}

export function StockChoice({
  kind,
  stock,
  onChange,
}: {
  kind: StockKind;
  stock: string;
  onChange: (next: { stockKind: StockKind; stock: string }) => void;
}): React.ReactElement {
  return (
    <fieldset className="bk-field bk-fieldset bk-stock">
      <legend className="bk-label">How many do you have?</legend>
      <div className="bk-stock-choices">
        {CHOICES.map((c) => (
          <label key={c.kind} className="bk-stock-choice" data-on={kind === c.kind ? 'true' : 'false'}>
            <input type="radio" name="stock-kind" checked={kind === c.kind} onChange={() => onChange({ stockKind: c.kind, stock: stockFor(c.kind, stock) })} />
            <span className="bk-stock-choice-text">
              <strong>{c.label}</strong>
              <span className="bk-note">{c.note}</span>
            </span>
          </label>
        ))}
      </div>
      {kind === 'one_of_a_kind' && stock.trim() === '0' && (
        <p className="bk-note">This one has sold. If you make another, choose I have some or Made to order.</p>
      )}
      {kind === 'count' && (
        <div className="bk-field">
          <label htmlFor="stock" className="bk-label">
            How many you have
          </label>
          <input id="stock" className="bk-input bk-input-sm" inputMode="numeric" value={stock} onChange={(e) => onChange({ stockKind: kind, stock: e.target.value })} />
        </div>
      )}
      {kind === 'made_to_order' && (
        <div className="bk-field">
          <label htmlFor="stock" className="bk-label">
            Ready now <span className="bk-note">(optional, like the one on your market table)</span>
          </label>
          <input id="stock" className="bk-input bk-input-sm" inputMode="numeric" value={stock} onChange={(e) => onChange({ stockKind: kind, stock: e.target.value })} />
          <p className="bk-note">With none ready, your site shows Order only: it can still be ordered.</p>
        </div>
      )}
    </fieldset>
  );
}

/** One combination's choice and number, in the options table. */
export function StockCell({
  what,
  kind,
  stock,
  onChange,
}: {
  /** The combination in words, for the screen-reader labels. */
  what: string;
  kind: StockKind;
  stock: string;
  onChange: (next: { stockKind: StockKind; stock: string }) => void;
}): React.ReactElement {
  return (
    <span className="bk-stock-cell">
      <select
        className="bk-input bk-input-sm"
        aria-label={`How you stock ${what}`}
        value={kind}
        onChange={(e) => {
          const next = e.target.value as StockKind;
          onChange({ stockKind: next, stock: stockFor(next, stock) });
        }}
      >
        {CHOICES.map((c) => (
          <option key={c.kind} value={c.kind}>
            {c.label}
          </option>
        ))}
      </select>
      {kind === 'one_of_a_kind' ? (
        <span className="bk-note">{stock.trim() === '0' ? 'Sold' : 'Just one'}</span>
      ) : (
        <input
          className="bk-input bk-input-sm"
          inputMode="numeric"
          aria-label={kind === 'count' ? `How many ${what}` : `${what} ready now`}
          placeholder={kind === 'count' ? 'How many' : 'Ready (optional)'}
          value={stock}
          onChange={(e) => onChange({ stockKind: kind, stock: e.target.value })}
        />
      )}
    </span>
  );
}
