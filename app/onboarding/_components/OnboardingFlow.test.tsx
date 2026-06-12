import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';

describe('OnboardingFlow — no catalog-size step', () => {
  it('the OnboardingFlow source does not import StepCatalogSize', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'app/onboarding/_components/OnboardingFlow.tsx'),
      'utf-8',
    );
    expect(source).not.toMatch(/StepCatalogSize/);
  });
});

describe('OnboardingFlow — photo step placement', () => {
  it('total steps is 7 (Name, Niche, Logo, Photos, Mood, Trial, Build)', () => {
    const { container } = render(
      <OnboardingFlow niches={[{ slug: 'candles', display_name: 'Candle maker' }]} />,
    );
    const progress = container.querySelector('[data-progress-total]');
    expect(progress?.getAttribute('data-progress-total')).toBe('7');
  });

  it('the source imports StepProductPhotos', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'app/onboarding/_components/OnboardingFlow.tsx'),
      'utf-8',
    );
    expect(source).toMatch(/StepProductPhotos/);
  });
});
