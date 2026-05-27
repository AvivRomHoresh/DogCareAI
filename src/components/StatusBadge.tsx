import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'mock';
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  const toneClass =
    tone === 'mock'
      ? 'border-amber-200 bg-amber-50/90 text-amber-800'
      : 'border-teal-100 bg-teal-50/80 text-teal-900';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${toneClass}`}>
      {children}
    </span>
  );
}
