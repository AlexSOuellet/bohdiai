interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  return (
    <div className="mb-10" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const s = i + 1;
          const isPast = s < step;
          const isCurrent = s === step;
          return (
            <div
              key={s}
              className={[
                'h-1 rounded-pill transition-all duration-slow',
                isPast ? 'bg-honey' : isCurrent ? 'bg-honey-warm' : 'bg-white/10',
                isCurrent ? 'flex-[2]' : 'flex-1',
              ].join(' ')}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Step {step} of {total}
      </p>
    </div>
  );
}
