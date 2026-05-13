import { NavLink } from 'react-router-dom';
import { DogPicker } from './DogPicker';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/dog-profile', label: 'Dog Profile' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/reminders', label: 'Reminders' },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">DogCareAI</p>
            <h1 className="text-2xl font-bold tracking-normal">Care workspace</h1>
          </div>
          <DogPicker />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Main navigation"
          className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-xl border px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'border-teal-200 bg-teal-50 text-teal-900'
                    : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
