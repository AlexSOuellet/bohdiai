/** The small line drawing beside each menu entry, keyed by the entry's name. */
const PATHS: Readonly<Record<string, string>> = {
  Home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z',
  Products: 'M5 8.5 12 5l7 3.5v7L12 19l-7-3.5zM5 8.5l7 3.5 7-3.5M12 12v7',
  Events: 'M5 7h14v12H5zM5 11h14M9 4.5v4M15 4.5v4',
  Tools: 'M7 4h10v16H7zM9.5 7h5v3h-5zM9.5 13h.01M12 13h.01M14.5 13h.01M9.5 16h.01M12 16h.01M14.5 16h.01',
  Orders:'M6 7h12l-1 12H7zM9.5 7a2.5 2.5 0 0 1 5 0',
  Customers: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.3a3 3 0 0 1 0 5.4M17.5 13.6a5.5 5.5 0 0 1 3 5.4',
  'My site': 'M4 6h16v12H4zM4 9.5h16M7 7.75h.01M9.5 7.75h.01',
  Account: 'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.5 20a6.5 6.5 0 0 1 13 0',
  Help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01',
  Menu: 'M5 7h14M5 12h14M5 17h14',
};

export function NavIcon({ name }: { name: string }): React.ReactElement {
  return (
    <svg className="bk-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name] ?? PATHS['Home']} />
    </svg>
  );
}
