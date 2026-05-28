import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AssistantShortcutIcon } from './icons/AssistantShortcutIcon';

const assistantLogoSrc = '/brand/doggy-assistant-logo.jpg';
const shortcutDelayMs = 5000;

export function FloatingAssistantShortcut() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [hasLogoFailed, setHasLogoFailed] = useState(false);
  const isHiddenRoute = location.pathname === '/assistant' || location.pathname === '/auth';

  useEffect(() => {
    setIsVisible(false);
    setHasEntered(false);

    if (isHiddenRoute) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
      window.requestAnimationFrame(() => {
        setHasEntered(true);
      });
    }, shortcutDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHiddenRoute, location.pathname]);

  if (isHiddenRoute || !isVisible) {
    return null;
  }

  return (
    <Link
      to="/assistant"
      aria-label="Open DogCareAI assistant"
      className={[
        'fixed bottom-5 left-5 z-40 inline-flex min-h-16 items-center gap-3 rounded-full border border-white/80 bg-slate-950/95 px-3 py-2 pr-4 text-sm font-extrabold text-white shadow-2xl shadow-teal-950/25 transition duration-500 ease-out hover:-translate-y-0.5 hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:bottom-6 sm:left-6',
        hasEntered ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0',
      ].join(' ')}
    >
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner ring-2 ring-white/70">
        {hasLogoFailed ? (
          <AssistantShortcutIcon className="h-7 w-7 text-teal-700" />
        ) : (
          <img
            src={assistantLogoSrc}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setHasLogoFailed(true)}
          />
        )}
      </span>
      <span className="hidden leading-tight sm:inline">
        <span className="block text-[0.7rem] font-bold uppercase tracking-[0.18em] text-teal-200">Doggy</span>
        <span className="block">Ask Assistant</span>
      </span>
    </Link>
  );
}
