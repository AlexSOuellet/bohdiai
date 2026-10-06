'use client';

import { useState, type ReactElement } from 'react';
import type { z } from 'zod';
import type { EstimatorSchema } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';

type Estimator = z.infer<typeof EstimatorSchema>;

/**
 * The atelier design's live ballpark estimator: tap the job, the size and the
 * finish, and the authored range for that combination shows at once. The
 * choices start on the first of each; nothing is computed, every range is
 * written in the content.
 */
export function Estimator({ estimator: e, estimateHref }: { estimator: Estimator; estimateHref: string }): ReactElement {
  const [scope, setScope] = useState(e.scopes[0]?.key ?? '');
  const [size, setSize] = useState(e.sizes[0]?.key ?? '');
  const [grade, setGrade] = useState(e.grades[0]?.key ?? '');
  const range = e.ranges[`${scope}|${size}|${grade}`] ?? '';
  const scopeName = e.scopes.find((s) => s.key === scope)?.name ?? '';

  return (
    <div className="at-est" role="group" aria-label={S.estimator.groupLabel}>
      <div className="at-est__choices">
        <fieldset className="at-est__step">
          <legend className="at-label">{S.estimator.scope}</legend>
          <div className="at-est__scopes">
            {e.scopes.map((s) => (
              <button key={s.key} type="button" className="at-scope" aria-pressed={s.key === scope} onClick={() => setScope(s.key)}>
                {s.icon !== undefined && <span className="at-icon" aria-hidden="true">{s.icon}</span>}
                <span className="at-scope__name">{s.name}</span>
                <span className="at-scope__detail">{s.detail}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="at-est__step">
          <legend className="at-label">{S.estimator.size}</legend>
          <div className="at-est__sizes">
            {e.sizes.map((s) => (
              <button key={s.key} type="button" className="at-size" aria-pressed={s.key === size} onClick={() => setSize(s.key)}>{s.name}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="at-est__step">
          <legend className="at-label">{S.estimator.grade}</legend>
          <div className="at-est__grades">
            {e.grades.map((g) => (
              <label key={g.key} className="at-grade" data-on={g.key === grade}>
                <input type="radio" name="at-grade" value={g.key} checked={g.key === grade} onChange={() => setGrade(g.key)} />
                <span className="at-grade__text">
                  <span className="at-grade__name">{g.name}</span>
                  <span className="at-grade__detail">{g.detail}</span>
                </span>
                <span className="at-grade__note">{g.note}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="at-est__result">
        <p className="at-label">{S.estimator.range}</p>
        <p className="at-est__scope">{scopeName}</p>
        <p className="at-est__range" aria-live="polite">{range}</p>
        <p className="at-est__note">{e.rangeNote}</p>
        <a className="at-btn at-btn--dark at-btn--wide" href={estimateHref}>{S.estimator.send}</a>
      </div>
    </div>
  );
}
