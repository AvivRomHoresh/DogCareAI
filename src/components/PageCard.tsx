import type { ReactNode } from 'react';

type PageCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageCard({ title, description, children }: PageCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-normal text-slate-950">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
