type Props = {
  size?: number;
  tone?: 'ink' | 'cream';
};

export function BohdiLogo({ size = 28, tone = 'ink' }: Props) {
  const ink = tone === 'cream' ? '#fbf8f2' : '#1f1a14';
  return (
    <span className="inline-flex select-none items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="none" stroke={ink} strokeWidth="1.25" />
        <path
          d="M11 9 v14 h7 a4 4 0 0 0 0 -8 h-7 m0 0 h6 a3.5 3.5 0 0 0 0 -7 h-6"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="24" cy="9" r="2.4" fill="#d99634" />
      </svg>
      <span
        className="font-serif text-[20px] leading-none tracking-[-0.01em]"
        style={{ color: ink }}
      >
        Bohdi<span style={{ color: '#d99634' }}>AI</span>
      </span>
    </span>
  );
}
