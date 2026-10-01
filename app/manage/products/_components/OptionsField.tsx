'use client';

import { useState } from 'react';
import { MAX_OPTIONS, MAX_CHOICES } from '@/lib/catalog/combinations';
import type { OptionForm, VariantForm, ChoiceForm, Kind } from '@/lib/backend/catalog/product-form';
import { FileField } from './FileField';

const label = (v: VariantForm): string => Object.values(v.choices).join(' / ');

/** The maker's own options and the combinations they make (spec §4; Etsy-style per D4). */
export function OptionsField({
  options,
  variants,
  basePrice,
  digital,
  onOptions,
  onVariants,
  onError,
}: {
  options: OptionForm[];
  variants: VariantForm[];
  basePrice: string;
  digital: boolean;
  onOptions: (options: OptionForm[]) => void;
  onVariants: (variants: VariantForm[]) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const setOption = (i: number, next: OptionForm) => onOptions(options.map((o, j) => (j === i ? next : o)));
  const setChoice = (i: number, c: number, next: ChoiceForm) =>
    setOption(i, { ...options[i]!, choices: options[i]!.choices.map((x, k) => (k === c ? next : x)) });
  const addChoice = (i: number) => {
    const value = (drafts[i] ?? '').trim();
    if (value === '') return;
    setOption(i, { ...options[i]!, choices: [...options[i]!.choices, { value, kind: 'physical', fileUploadId: null, fileName: null }] });
    setDrafts((d) => ({ ...d, [i]: '' }));
  };
  const removeOption = (i: number) => {
    onOptions(options.filter((_, j) => j !== i));
    setDrafts({}); // drafts are keyed by position, which just shifted
  };
  const setVariant = (i: number, next: VariantForm) => onVariants(variants.map((v, j) => (j === i ? next : v)));

  return (
    <div>
      <p className="bk-note">Options are things a shopper picks, like size or scent. Each combination can have its own price and stock.</p>
      {options.map((o, i) => {
        const name = o.name.trim() === '' ? `option ${i + 1}` : o.name.trim();
        return (
          <div key={i} className="bk-option">
            <div className="bk-row">
              <div className="bk-field">
                <label htmlFor={`opt-${i}`} className="bk-label">{`Option ${i + 1} name`}</label>
                <input id={`opt-${i}`} className="bk-input" value={o.name} placeholder="Size, Scent, Colour…" onChange={(e) => setOption(i, { ...o, name: e.target.value })} />
              </div>
              <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove the ${name} option`} onClick={() => removeOption(i)}>
                Remove option
              </button>
            </div>
            <ul className="bk-chips" aria-label={`Choices for ${name}`}>
              {o.choices.map((c, k) => (
                <li key={`${k}-${c.value}`} className="bk-chip">
                  <span>{c.value}</span>
                  {digital && (
                    <select aria-label={`${c.value} is sold as`} className="bk-input bk-input-sm" value={c.kind} onChange={(e) => setChoice(i, k, { ...c, kind: e.target.value as Kind })}>
                      <option value="physical">Ships</option>
                      <option value="digital">Download</option>
                    </select>
                  )}
                  {digital && c.kind === 'digital' && (
                    <FileField
                      fileName={c.fileName}
                      label={`Upload the file for ${c.value}`}
                      onUploaded={(id, fn) => setChoice(i, k, { ...c, fileUploadId: id, fileName: fn })}
                      onError={onError}
                    />
                  )}
                  <button type="button" className="bk-chip-x" aria-label={`Remove ${c.value}`} onClick={() => setOption(i, { ...o, choices: o.choices.filter((_, x) => x !== k) })}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="bk-row">
              <input
                className="bk-input bk-input-sm"
                aria-label={`New choice for ${name}`}
                placeholder={o.choices.length >= MAX_CHOICES ? `Up to ${MAX_CHOICES} choices` : 'New choice'}
                value={drafts[i] ?? ''}
                disabled={o.choices.length >= MAX_CHOICES}
                onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChoice(i);
                  }
                }}
              />
              <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`Add choice to ${name}`} disabled={o.choices.length >= MAX_CHOICES} onClick={() => addChoice(i)}>
                Add
              </button>
            </div>
          </div>
        );
      })}
      <p className="bk-row">
        <button type="button" className="bk-btn bk-btn-quiet" disabled={options.length >= MAX_OPTIONS} onClick={() => onOptions([...options, { name: '', choices: [] }])}>
          Add an option
        </button>
        {options.length >= MAX_OPTIONS && <span className="bk-note">{`Up to ${MAX_OPTIONS} options.`}</span>}
      </p>
      {variants.length > 0 && (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col">Combination</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Available</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={label(v)}>
                  <td>{label(v)}</td>
                  <td>
                    <input className="bk-input bk-input-sm" inputMode="decimal" aria-label={`Price for ${label(v)}`} placeholder={basePrice} value={v.price} onChange={(e) => setVariant(i, { ...v, price: e.target.value })} />
                  </td>
                  <td>
                    <input className="bk-input bk-input-sm" inputMode="numeric" aria-label={`Stock for ${label(v)}`} placeholder="Made to order" value={v.stock} onChange={(e) => setVariant(i, { ...v, stock: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" aria-label={`${label(v)} is available`} checked={v.available} onChange={(e) => setVariant(i, { ...v, available: e.target.checked })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bk-note">A blank price uses the product price. A blank stock means made to order. Stock at 0 shows as sold out.</p>
        </div>
      )}
    </div>
  );
}
