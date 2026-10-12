'use client';

import { useSyncExternalStore, useState } from 'react';

const KEY = 'bk-pos-tip-hidden';

/** Whether the POS is already open from the home screen (or the tip was put away). */
function hidden(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
const noop = (): (() => void) => () => undefined;

/** How to put the Market POS on the phone's home screen. Not shown once it's
 *  opened from there, or after "Got it". */
export function InstallTip(): React.ReactElement | null {
  const away = useSyncExternalStore(noop, hidden, () => true);
  const [gotIt, setGotIt] = useState(false);
  if (away || gotIt) return null;
  return (
    <aside className="bk-day-tip" aria-label="Put Market POS on your home screen">
      <p>
        <strong>Put Market POS on your home screen.</strong> It opens full screen, like an app.
      </p>
      <p>iPhone: tap Share, then Add to Home Screen. Android: tap the menu, then Install app or Add to Home screen.</p>
      <button
        type="button"
        className="bk-day-exit"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, '1');
          } catch {
            // Private browsing: it just shows again next time.
          }
          setGotIt(true);
        }}
      >
        Got it
      </button>
    </aside>
  );
}
