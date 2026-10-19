/** A backend screen's heading row: its title, View your site, the unsaved note and Save. */
export function ScreenHead({ title, siteUrl, unsaved, busy, onSave }: { title: string; siteUrl: string; unsaved: boolean; busy: boolean; onSave: () => void }): React.ReactElement {
  return (
    <div className="bk-head">
      <h1 className="bk-title">{title}</h1>
      <div className="bk-head-actions">
        <a className="bk-btn bk-btn-quiet" href={siteUrl} target="_blank" rel="noopener noreferrer">
          View your site
        </a>
        {unsaved && <span className="bk-note">Unsaved changes</span>}
        <button type="button" className="bk-btn" disabled={busy || !unsaved} onClick={onSave}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
