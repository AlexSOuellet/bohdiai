import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LookBrowser } from './LookBrowser';
import { LOOKS, lookUrl } from '@/lib/site/looks';
import { FAMILY_KEYS, FAMILIES } from '@/lib/archetypes/main-street/families';

afterEach(cleanup);

describe('the looks', () => {
  it('one per family, named by its public mood word, in its own main skin', () => {
    expect(LOOKS.map((l) => l.family)).toEqual([...FAMILY_KEYS]);
    const elegant = LOOKS.find((l) => l.family === 'luxury');
    expect(elegant?.mood).toBe('elegant');
    expect(elegant?.label).toBe('Elegant');
    for (const l of LOOKS) expect(l.skin).toBe(FAMILIES[l.family].defaultSkin);
  });

  it('the sample’s address in a mood, live or on this computer', () => {
    const scenic = { mood: 'scenic' as const, skin: 'main-street-saltmarsh' };
    expect(lookUrl(scenic, false)).toBe('https://classic-loafs.bohdiai.com/?previewMood=scenic&previewLook=main-street-saltmarsh');
    expect(lookUrl(scenic, true)).toBe('http://classic-loafs.localhost:3000/?previewMood=scenic&previewLook=main-street-saltmarsh');
  });
});

describe('LookBrowser', () => {
  it('opens on the first mood and redraws the sample in the mood picked', () => {
    const { container } = render(<LookBrowser local={false} />);
    const frame = () => container.querySelector('iframe');
    expect(frame()?.getAttribute('src')).toBe(lookUrl(LOOKS[0]!, false));
    expect(screen.getByRole('button', { name: /Cozy/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Spotlight/ }));
    expect(frame()?.getAttribute('src')).toContain('previewMood=spotlight');
    expect(frame()?.getAttribute('title')).toBe('Classic Loafs in the Spotlight mood');
    expect(screen.getByRole('link', { name: /Open this look/ }).getAttribute('href')).toContain('previewMood=spotlight');
  });

  it('narrows the window to a phone and back', () => {
    const { container } = render(<LookBrowser local />);
    const box = () => container.querySelector('iframe')?.parentElement;
    expect(box()?.className).toContain('max-w-full');
    fireEvent.click(screen.getByRole('button', { name: 'Phone' }));
    expect(box()?.className).toContain('max-w-[400px]');
    fireEvent.click(screen.getByRole('button', { name: 'Computer' }));
    expect(box()?.className).toContain('max-w-full');
  });

  it('writes no inline styles', () => {
    const { container } = render(<LookBrowser local={false} />);
    expect(container.querySelector('[style]')).toBeNull();
  });
});
