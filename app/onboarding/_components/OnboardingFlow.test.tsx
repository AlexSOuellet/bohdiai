import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

describe('OnboardingFlow — no catalog-size step', () => {
  it('the OnboardingFlow source does not import StepCatalogSize', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'app/onboarding/_components/OnboardingFlow.tsx'),
      'utf-8',
    );
    expect(source).not.toMatch(/StepCatalogSize/);
  });
});
