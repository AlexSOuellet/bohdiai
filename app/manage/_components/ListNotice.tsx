/** The editors send the maker back to the list after a save or an archive, with the
 *  item's name in the address (?saved=… or ?archived=…). The list says what happened,
 *  so a save never looks like it didn't take. The name is display-only text. */

type Params = Record<string, string | string[] | undefined>;

const MAX_NAME = 120;

function first(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? '').trim().slice(0, MAX_NAME);
}

export function listNotice(params: Params): string | null {
  const archived = first(params['archived']);
  if (archived !== '') return `Archived “${archived}”.`;
  const saved = first(params['saved']);
  if (saved !== '') return `Saved “${saved}”.`;
  return null;
}

export function ListNotice({ message }: { message: string | null }): React.ReactElement | null {
  if (message === null) return null;
  return (
    <div className="bk-notices">
      <div role="status">
        <p className="bk-notice" data-tone="ok">{message}</p>
      </div>
    </div>
  );
}
