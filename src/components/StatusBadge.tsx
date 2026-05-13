import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'mock';
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  const toneClass =
    tone === 'mock'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-stone-200 bg-stone-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}
