'use client';

/**
 * Runs a try-on conversion for one tenant and reveals the preview link.
 * Founder/dev tool — no auth yet.
 */
import { useState } from 'react';

export function TryOnButton({
  subdomain,
  target,
  label,
  previewUrl,
}: {
  subdomain: string;
  target: string;
  label: string;
  /** Where to open the conversion once it's saved, e.g. http://shop.localhost:3000/?v=mainstreet */
  previewUrl: string;
}) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function run() {
    setState('running');
    setMessage('');
    try {
      const res = await fetch('/api/admin/tryon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subdomain, target, label }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; result?: { lookKey: string } };
      if (!data.ok) {
        setState('error');
        setMessage(data.error ?? 'failed');
        return;
      }
      setState('done');
      setMessage(data.result?.lookKey ?? '');
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  if (state === 'done') {
    return (
      <span>
        <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: '#4f7cff' }}>
          open /?v={label}
        </a>
        {message ? <span style={{ color: '#888', marginLeft: 8 }}>({message})</span> : null}
      </span>
    );
  }

  return (
    <span>
      <button
        onClick={run}
        disabled={state === 'running'}
        style={{
          background: state === 'running' ? '#333' : '#4f7cff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: state === 'running' ? 'wait' : 'pointer',
          fontSize: 13,
        }}
      >
        {state === 'running' ? 'Building…' : `Try on Main Street`}
      </button>
      {state === 'error' ? <span style={{ color: '#e5533c', marginLeft: 8, fontSize: 12 }}>{message}</span> : null}
    </span>
  );
}
