'use client';

/** The admin couldn't load: say so, and offer another try. */
export default function FounderError({ reset }: { error: Error; reset: () => void }): React.ReactElement {
  return (
    <main id="main" className="bk-content">
      <p role="alert">The admin couldn’t load its information. Try again, and if it keeps happening, check the Cloudflare logs.</p>
      <button type="button" className="bk-btn" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
