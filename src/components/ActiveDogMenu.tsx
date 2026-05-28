import { Link, useLocation } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { DogAvatar } from './DogAvatar';
import { useDogs } from '../hooks/useDogs';
import { DogProfileIcon } from './icons/DogProfileIcon';

type ActiveDogMenuNavItem = {
  label: string;
  to: string;
};

type ActiveDogMenuProps = {
  email?: string | null;
  isLogoutDisabled?: boolean;
  navItems: ActiveDogMenuNavItem[];
  onLogout: () => void | Promise<void>;
};

type MenuIconName = 'assistant' | 'dashboard' | 'dogProfile' | 'nearby' | 'recommendations' | 'reminders';

const routeIconByPath: Record<string, MenuIconName> = {
  '/': 'dashboard',
  '/assistant': 'assistant',
  '/dog-profile': 'dogProfile',
  '/nearby': 'nearby',
  '/recommendations': 'recommendations',
  '/reminders': 'reminders',
};

export function ActiveDogMenu({ email, isLogoutDisabled = false, navItems, onLogout }: ActiveDogMenuProps) {
  const { activeDog, activeDogId, dogs, error, isLoading, setActiveDogId } = useDogs();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const location = useLocation();

  const activeDogName = activeDog?.name ?? 'DogCare profile';
  const activeDogBreed = activeDog?.breed?.trim() || 'Breed details not set yet';
  const buttonLabel = activeDog ? `Open active dog menu for ${activeDog.name}` : 'Open active dog menu';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const closeMenuAndFocusTrigger = () => {
    setIsOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeMenuAndFocusTrigger();
    }
  };

  const handleDogSelection = (dogId: string) => {
    setActiveDogId(dogId);
    closeMenuAndFocusTrigger();
  };

  const handleLogout = () => {
    closeMenu();
    void onLogout();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={buttonLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="group flex min-h-14 min-w-14 items-center justify-center rounded-full bg-white/85 p-1.5 shadow-md shadow-slate-900/10 ring-1 ring-white/90 transition hover:bg-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <DogAvatar
          breed={activeDog?.breed}
          className="h-12 w-12 shadow-none ring-0 transition group-hover:scale-[1.02]"
          name={activeDog?.name}
          profileImageUrl={activeDog?.profile_image_url}
          size="sm"
          weight={activeDog?.weight}
        />
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          aria-label="Active dog menu"
          className="absolute left-1/2 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/80 bg-white/95 text-left shadow-2xl shadow-slate-900/15 backdrop-blur sm:left-0 sm:translate-x-0"
          onKeyDown={handleMenuKeyDown}
          role="dialog"
        >
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-3">
              <DogAvatar
                breed={activeDog?.breed}
                name={activeDog?.name}
                profileImageUrl={activeDog?.profile_image_url}
                size="sm"
                weight={activeDog?.weight}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Active dog</p>
                <p className="truncate text-base font-extrabold text-slate-950">{activeDogName}</p>
                <p className="truncate text-sm text-slate-600">{activeDogBreed}</p>
              </div>
            </div>

            <section className="mt-4" aria-labelledby={`${menuId}-dogs`}>
              <h2 id={`${menuId}-dogs`} className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Switch profile
              </h2>
              <div className="mt-2 space-y-2">
                {renderDogSwitcher({
                  activeDogId,
                  dogs,
                  error,
                  isLoading,
                  onSelectDog: handleDogSelection,
                })}
              </div>
            </section>

            <section className="mt-4" aria-labelledby={`${menuId}-navigation`}>
              <h2 id={`${menuId}-navigation`} className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Navigate
              </h2>
              <div className="mt-2 grid gap-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={closeMenu}
                      className={[
                        'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
                        isActive
                          ? 'border-teal-200 bg-teal-700 text-white shadow-sm'
                          : 'border-stone-100 bg-white text-slate-700 hover:border-teal-100 hover:bg-teal-50 hover:text-teal-900',
                      ].join(' ')}
                    >
                      <MenuIcon name={routeIconByPath[item.to] ?? 'dashboard'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {email ? (
              <section className="mt-4 rounded-2xl border border-stone-100 bg-stone-50 px-3 py-2.5" aria-label="Signed in account">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Signed in</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700">{email}</p>
              </section>
            ) : null}

            <div className="mt-4 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLogoutDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-200 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogoutIcon />
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderDogSwitcher({
  activeDogId,
  dogs,
  error,
  isLoading,
  onSelectDog,
}: {
  activeDogId: string | null;
  dogs: ReturnType<typeof useDogs>['dogs'];
  error: string | null;
  isLoading: boolean;
  onSelectDog: (dogId: string) => void;
}) {
  if (isLoading) {
    return <MenuStateMessage>Loading dog profiles...</MenuStateMessage>;
  }

  if (error) {
    return <MenuStateMessage tone="error">Dog profiles are unavailable right now.</MenuStateMessage>;
  }

  if (dogs.length === 0) {
    return <MenuStateMessage>No dog profiles yet. Add one from Dog Profile.</MenuStateMessage>;
  }

  return dogs.map((dog) => {
    const isActive = dog.id === activeDogId;

    return (
      <button
        key={dog.id}
        type="button"
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelectDog(dog.id)}
        className={[
          'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
          isActive
            ? 'border-teal-200 bg-teal-50 text-teal-950'
            : 'border-stone-100 bg-white text-slate-700 hover:border-teal-100 hover:bg-teal-50/70',
        ].join(' ')}
      >
        <DogAvatar
          breed={dog.breed}
          name={dog.name}
          profileImageUrl={dog.profile_image_url}
          size="sm"
          weight={dog.weight}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{dog.name}</span>
          <span className="block truncate text-xs text-slate-500">{dog.breed?.trim() || 'Breed details not set'}</span>
        </span>
        {isActive ? <span className="rounded-full bg-teal-700 px-2 py-1 text-xs font-bold text-white">Active</span> : null}
      </button>
    );
  });
}

function MenuStateMessage({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'error' | 'neutral' }) {
  return (
    <p
      className={[
        'rounded-2xl border px-3 py-2 text-sm',
        tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-stone-100 bg-stone-50 text-slate-600',
      ].join(' ')}
    >
      {children}
    </p>
  );
}

function MenuIcon({ name }: { name: MenuIconName }) {
  const commonProps = {
    className: 'h-5 w-5 shrink-0',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'assistant':
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M7 9h10" />
          <path d="M8 14h5" />
          <path d="M6 19 3 21V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3z" />
        </svg>
      );
    case 'dogProfile':
      return <DogProfileIcon className="h-5 w-5 shrink-0" />;
    case 'nearby':
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'recommendations':
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M5 7h14" />
          <path d="M7 7v12h10V7" />
          <path d="M9 7a3 3 0 0 1 6 0" />
          <path d="m9 14 2 2 4-5" />
        </svg>
      );
    case 'reminders':
      return (
        <svg aria-hidden="true" {...commonProps}>
          <path d="M7 3v3" />
          <path d="M17 3v3" />
          <path d="M4 8h16" />
          <rect height="16" rx="3" width="16" x="4" y="5" />
          <path d="m9 14 2 2 4-5" />
        </svg>
      );
    case 'dashboard':
    default:
      return (
        <svg aria-hidden="true" {...commonProps}>
          <rect height="7" rx="2" width="7" x="4" y="4" />
          <rect height="7" rx="2" width="7" x="13" y="4" />
          <rect height="7" rx="2" width="7" x="4" y="13" />
          <rect height="7" rx="2" width="7" x="13" y="13" />
        </svg>
      );
  }
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10 17 15 12l-5-5" />
      <path d="M15 12H3" />
      <path d="M21 5v14a2 2 0 0 1-2 2h-6" />
      <path d="M13 3h6a2 2 0 0 1 2 2" />
    </svg>
  );
}
