/** The deal, the same wherever it's set: months free, or a percent off for a while or for
 *  good. An invite can also be a free site, so `freeSite` adds that and starts on it. */
export function DiscountFields({ freeSite = false }: { freeSite?: boolean }): React.ReactElement {
  return (
    <>
      <div className="bk-field">
        <label htmlFor="fd-kind" className="bk-label">
          {freeSite ? 'What you’re offering' : 'Kind'}
        </label>
        <select id="fd-kind" name="kind" className="bk-input" defaultValue={freeSite ? 'site' : 'percent'}>
          {freeSite && <option value="site">Free site, no payment</option>}
          <option value="free">Months free</option>
          <option value="percent">Percent off</option>
        </select>
      </div>
      <div className="bk-field">
        <label htmlFor="fd-percent" className="bk-label">
          Percent off
        </label>
        <input id="fd-percent" name="percent" inputMode="numeric" className="bk-input" />
        <p className="bk-note">Only for a percent off.</p>
      </div>
      <div className="bk-field">
        <label htmlFor="fd-months" className="bk-label">
          For how many months
        </label>
        <input id="fd-months" name="months" inputMode="numeric" className="bk-input" />
        <p className="bk-note">Leave blank for a percent off that never ends.</p>
      </div>
    </>
  );
}
