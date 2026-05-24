'use client';

import { useState } from 'react';
import type { NicheOption, OnboardingData } from './types';
import { INITIAL_DATA } from './types';
import ProgressBar from './ProgressBar';
import StepName from './StepName';
import StepNiche from './StepNiche';
import StepMood from './StepMood';
import StepTrial from './StepTrial';
import StepBuild from './StepBuild';

interface OnboardingFlowProps {
  niches: NicheOption[];
}

export default function OnboardingFlow({ niches }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  function advance(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div>
      <ProgressBar step={step} total={5} />
      {step === 1 && <StepName data={data} onAdvance={advance} />}
      {step === 2 && <StepNiche data={data} niches={niches} onAdvance={advance} onBack={back} />}
      {step === 3 && <StepMood data={data} onAdvance={advance} onBack={back} />}
      {step === 4 && <StepTrial data={data} onAdvance={advance} onBack={back} />}
      {step === 5 && <StepBuild data={data} onBack={back} />}
    </div>
  );
}
