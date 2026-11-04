/** The discount, the same wherever it's set: months free, or a percent off for a while or for good. */
export function DiscountFields(): React.ReactElement {
  return (
    <>
      <div className="bk-field">
        <label htmlFor="fd-kind" className="bk-label">
          Kind
        </label>
        <select id="fd-kind" name="kind" className="bk-input" defaultValue="percent">
          <option value="percent">Percent off</option>
          <option value="free">Months free</option>
        </select>
      </div>
      <div className="bk-field">
        <label htmlFor="fd-percent" className="bk-label">
          Percent off
        </label>
        <input id="fd-percent" name="percent" inputMode="numeric" className="bk-input" />
        <p className="bk-note">Leave blank for months free.</p>
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
