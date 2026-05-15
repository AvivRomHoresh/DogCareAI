import { NavLink } from 'react-router-dom';
import { DogPicker } from './DogPicker';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/auth', label: 'Auth / Sign in' },
  { to: '/dog-profile', label: 'Dog Profile' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/reminders', label: 'Reminders' },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();

    if (!error) {
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-teal-700">DogCareAI</p>
              <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-medium text-slate-600">
                Phase 6 beta
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-normal">Care workspace</h1>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <DogPicker />
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>{user?.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
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
