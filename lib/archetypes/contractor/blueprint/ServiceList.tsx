'use client';

import { useState, type ReactElement } from 'react';
import type { ContractorContent } from '../schemas';

type Service = ContractorContent['services']['items'][number];

/**
 * The blueprint design's services: one big list of names. Pointing at a name
 * (or focusing or tapping it) shows its photo and detail in the frame beside the
 * list. Starts on the first service that has a photo. Services without a photo
 * keep the last photo shown.
 */
export function ServiceList({ items }: { items: readonly Service[] }): ReactElement {
  const firstWithPhoto = Math.max(0, items.findIndex((s) => s.photo !== undefined));
  const [active, setActive] = useState(firstWithPhoto);
  const [shown, setShown] = useState(firstWithPhoto);
  const current = items[active];
  const photo = items[shown]?.photo;

  function pick(i: number): void {
    setActive(i);
    if (items[i]?.photo !== undefined) setShown(i);
  }

  return (
    <div className="bp-services">
      <ul className="bp-services__list">
        {items.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              className="bp-services__name"
              aria-pressed={i === active}
              onMouseEnter={() => pick(i)}
              onFocus={() => pick(i)}
              onClick={() => pick(i)}
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="bp-services__frame" aria-live="polite">
        {photo !== undefined && (
          <div className="bp-frame">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote storage URLs, rendered as authored */}
            <img key={photo.url} src={photo.url} alt={photo.alt} loading="lazy" decoding="async" className="bp-services__photo" />
          </div>
        )}
        {current !== undefined && (
          <div className="bp-services__detail">
            <p className="bp-services__current">{current.name}</p>
            <p className="bp-services__text">{current.detail}</p>
            {current.tags !== undefined && <ul className="bp-tags">{current.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
          </div>
        )}
      </div>
    </div>
  );
}
