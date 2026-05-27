import { NavLink } from 'react-router-dom';
import { DogPicker } from './DogPicker';
import { DogCareLogo } from './DogCareLogo';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const authenticatedNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/dog-profile', label: 'Dog Profile' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/nearby', label: 'Nearby' },
  { to: '/recommendations', label: 'Recommendations' },
];

const publicNavItems = [{ to: '/auth', label: 'Auth / Sign in' }];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  const handleLogout = async () => {
    const { error } = await signOut();

    if (!error) {
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="dogcare-app-background min-h-screen text-slate-950">
      <header>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] lg:items-center">
          <div className="hidden lg:block" aria-hidden="true" />
          <DogCareLogo className="justify-self-center" />
          <div className="flex flex-col gap-3 sm:items-center lg:items-end">
            <DogPicker />
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 lg:justify-end">
                <span className="max-w-full truncate">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
                  isActive
                    ? 'border-teal-200 bg-teal-700 text-white shadow-teal-900/10'
                    : 'border-white/80 bg-white/85 text-slate-700 hover:border-teal-100 hover:bg-teal-50 hover:text-teal-900',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
