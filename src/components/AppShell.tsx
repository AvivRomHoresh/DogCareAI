import { DogCareLogo } from './DogCareLogo';
import { ActiveDogMenu } from './ActiveDogMenu';
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
    <div className="dogcare-app-background min-h-screen text-slate-950">
      <header>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            {isAuthenticated ? (
              <ActiveDogMenu
                email={user?.email}
                navItems={authenticatedNavItems}
                onLogout={handleLogout}
                isLogoutDisabled={isLoading}
              />
            ) : null}
          </div>
          <DogCareLogo className="justify-self-center" />
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
