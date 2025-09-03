import React from 'react';

type LogoProps = {
  size?: number; // height in px
  color?: string;
  withText?: boolean;
  textColor?: string;
};

export default function Logo({ size = 32, color = '#0F5132', withText = false, textColor = '#1f2937' }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-2 select-none" style={{ lineHeight: 0 }}>
      <LogoMark size={size} color={color} />
      {withText && (
        <div className="leading-none">
          <span style={{ color: textColor }} className="font-semibold" aria-label="Rami">
            Rami
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 32, color = '#0F5132' }: { size?: number; color?: string }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 128 128"
      role="img"
      aria-label="Rami mark"
      style={{ display: 'block' }}
    >
      {/* solo (arco) */}
      <path d="M24 108c24-10 56-10 80 0" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      {/* semente */}
      <ellipse cx="64" cy="76" rx="18" ry="26" fill={color} />
      {/* broto interno branco */}
      <path d="M64 94c0-20-8-20-8-36" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      {/* caule */}
      <path d="M64 68c0-10 2-18 6-24" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
      {/* folhas */}
      <path d="M70 44c10-14 30-12 36-12-4 18-18 26-36 24" fill={color} />
      <path d="M58 44c-10-14-30-12-36-12 4 18 18 26 36 24" fill={color} />
      {/* veios das folhas */}
      <path d="M74 44c8-4 16-6 22-6" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 44c-8-4-16-6-22-6" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

