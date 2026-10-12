import { describe, it, expect } from 'vitest';
import { POS_START, posLanding, posManifest, posMetadata } from './pos-app';

const m = (id: string, date: string, over: Partial<{ endDate: string; canceled: boolean }> = {}) => ({ id, date, endDate: '', canceled: false, ...over });

describe('where the Market POS icon lands', () => {
  it('goes straight to today’s market, including a weekend market on its second day', () => {
    expect(posLanding([m('a', '2026-10-10'), m('b', '2026-10-12'), m('c', '2026-10-20')], '2026-10-12')).toBe('/manage/markets/b/day');
    expect(posLanding([m('w', '2026-10-11', { endDate: '2026-10-12' })], '2026-10-12')).toBe('/manage/markets/w/day');
  });
  it('shows the list when nothing is on today, or today’s market was canceled', () => {
    expect(posLanding([m('a', '2026-10-10'), m('c', '2026-10-20')], '2026-10-12')).toBeNull();
    expect(posLanding([m('b', '2026-10-12', { canceled: true })], '2026-10-12')).toBeNull();
  });
});

describe('the home-screen app', () => {
  it('opens full screen at the POS, under the shop’s name', () => {
    const app = posManifest('Saltmarsh & Lace');
    expect(app).toMatchObject({ name: 'Saltmarsh & Lace Market POS', short_name: 'Market POS', start_url: POS_START, scope: '/manage/', display: 'standalone' });
    expect(app['icons']).toHaveLength(2);
    expect(posManifest(null)['name']).toBe('Market POS');
  });
  it('points each page at its own shop’s manifest and the phone icon', () => {
    expect(posMetadata('saltmarsh-and-lace')).toMatchObject({ manifest: '/pos-manifest/saltmarsh-and-lace', appleWebApp: { capable: true, title: 'Market POS' } });
  });
});
