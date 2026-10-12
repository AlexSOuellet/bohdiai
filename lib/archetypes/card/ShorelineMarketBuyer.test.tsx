import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ProductView } from '@/lib/archetypes/content';
import { ShorelineMarketBuyer } from './ShorelineMarketBuyer';
import { CARD_STRINGS as S } from './strings';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

const piece: ProductView = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'lighthouse-ring-dish',
  name: 'Lighthouse ring dish',
  price: '$28',
  description: '',
  status: 'active',
  media: [],
  variations: [],
};

describe('ShorelineMarketBuyer', () => {
  // The server page hands over only plain data; the words (some are functions)
  // are read here on the client. Passing them from the server crashed the page.
  it('takes only plain data and shows the shoreline words', () => {
    render(<ShorelineMarketBuyer marketId="00000000-0000-4000-8000-0000000000e1" pieces={[piece]} methods={['venmo', 'cash']} codes={false} />);
    expect(screen.getByText(S.shoreline.market.pick)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lighthouse ring dish/ })).toBeTruthy();
  });
});
