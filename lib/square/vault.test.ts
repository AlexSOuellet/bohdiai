import { describe, it, expect } from 'vitest';
import { readNote, seal, signNote, unseal } from './vault';

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 1)));
const OTHER = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => 200 - i)));

describe('seal / unseal', () => {
  it('scrambles a key and gets it back, differently each time', async () => {
    const a = await seal('EAAAl-secret-token', KEY);
    const b = await seal('EAAAl-secret-token', KEY);
    expect(a).not.toContain('secret');
    expect(a).not.toBe(b);
    expect(await unseal(a, KEY)).toBe('EAAAl-secret-token');
  });

  it('refuses another secret and any change', async () => {
    const a = await seal('token', KEY);
    await expect(unseal(a, OTHER)).rejects.toThrow();
    const bytes = atob(a);
    const flipped = btoa(bytes.slice(0, -1) + String.fromCharCode(bytes.charCodeAt(bytes.length - 1) ^ 1));
    await expect(unseal(flipped, KEY)).rejects.toThrow();
  });

  it('needs a 32-byte secret', async () => {
    await expect(seal('token', btoa('short'))).rejects.toThrow(/32 bytes/);
  });
});

describe('signNote / readNote', () => {
  it('reads back its own note', async () => {
    const note = await signNote('square-connect', { tenantId: 't1', n: 2 }, KEY);
    expect(await readNote('square-connect', note, KEY)).toEqual({ tenantId: 't1', n: 2 });
  });

  it('refuses a changed note, another purpose or another secret', async () => {
    const note = await signNote('square-card-sale', { totalCents: 2500 }, KEY);
    const [, mac] = note.split('.');
    const forged = `${btoa(JSON.stringify({ totalCents: 100 })).replace(/=+$/, '')}.${mac}`;
    expect(await readNote('square-card-sale', forged, KEY)).toBeNull();
    expect(await readNote('square-connect', note, KEY)).toBeNull();
    expect(await readNote('square-card-sale', note, OTHER)).toBeNull();
    expect(await readNote('square-card-sale', 'nonsense', KEY)).toBeNull();
    expect(await readNote('square-card-sale', `${note}.extra`, KEY)).toBeNull();
  });
});
