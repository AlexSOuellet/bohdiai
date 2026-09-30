/** Penny's labelled figure (admin-stat-tile.tsx), one copy for every backend page. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }): React.ReactElement {
  return (
    <div className="bk-tile">
      <p className="bk-tile-label">{label}</p>
      <p className="bk-tile-value">{value}</p>
      {note !== undefined && <p className="bk-tile-note">{note}</p>}
    </div>
  );
}
