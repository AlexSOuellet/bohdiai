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

describe('OnboardingFlow — step count', () => {
  it('total steps is 5 (Name, Niche, Mood, Trial, Build) — logo upload moved to the dashboard', () => {
    const { container } = render(
      <OnboardingFlow niches={[{ slug: 'candles', display_name: 'Candle maker' }]} />,
    );
    const progress = container.querySelector('[data-progress-total]');
    expect(progress?.getAttribute('data-progress-total')).toBe('5');
  });

  it('the source does not import StepProductPhotos (photo upload moved to post-onboarding)', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'app/onboarding/_components/OnboardingFlow.tsx'),
      'utf-8',
    );
    expect(source).not.toMatch(/StepProductPhotos/);
  });

  it('the source does not import StepLogo (logo upload moved to the dashboard)', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'app/onboarding/_components/OnboardingFlow.tsx'),
      'utf-8',
    );
    expect(source).not.toMatch(/StepLogo/);
  });
});
