'use client';

import { useState } from 'react';
import type { NicheOption, OnboardingData } from './types';
import { INITIAL_DATA } from './types';
import ProgressBar from './ProgressBar';
import StepName from './StepName';
import StepNiche from './StepNiche';
import StepLogo from './StepLogo';
import StepMood from './StepMood';
import StepTrial from './StepTrial';
import StepBuild from './StepBuild';

const TOTAL_STEPS = 6;

interface OnboardingFlowProps {
  niches: NicheOption[];
}

export default function OnboardingFlow({ niches }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  function advance(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div>
      <ProgressBar step={step} total={TOTAL_STEPS} />
      {step === 1 && <StepName data={data} onAdvance={advance} />}
      {step === 2 && <StepNiche data={data} niches={niches} onAdvance={advance} onBack={back} />}
      {step === 3 && <StepLogo data={data} onAdvance={advance} onBack={back} />}
      {step === 4 && <StepMood data={data} onAdvance={advance} onBack={back} />}
      {step === 5 && <StepTrial data={data} onAdvance={advance} onBack={back} />}
      {step === 6 && <StepBuild data={data} onBack={back} />}
    </div>
  );
}
