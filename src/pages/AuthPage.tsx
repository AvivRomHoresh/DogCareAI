import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

type AuthMode = 'forgot-password' | 'sign-in' | 'sign-up';

const REALISTIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'object' &&
    location.state.from !== null &&
    'pathname' in location.state.from &&
    typeof location.state.from.pathname === 'string'
      ? location.state.from.pathname
      : '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim();

    if (!REALISTIC_EMAIL_PATTERN.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address, for example name@example.com.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase is not configured yet. Add the frontend env variables and restart the dev server.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'forgot-password') {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      setIsSubmitting(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage('Check your email for a password reset link.');
      return;
    }

    const credentials = {
      email: normalizedEmail,
      password,
    };

    const { data, error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (mode === 'sign-in') {
      setSuccessMessage('Signed in successfully.');
      navigate(fromPath, { replace: true });
      return;
    }

    if (data.session) {
      setSuccessMessage('Account created and signed in. Redirecting to your dashboard.');
      navigate('/', { replace: true });
      return;
    }

    setSuccessMessage('Account created. Please check your email and confirm your account before signing in.');
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (!supabase) {
      setErrorMessage('Supabase is not configured yet. Add the frontend env variables and restart the dev server.');
      return;
    }

    setIsGoogleSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setIsGoogleSubmitting(false);
      setErrorMessage('Google sign in could not be started. Please try email/password or try again later.');
      return;
    }

    setSuccessMessage('Redirecting to Google sign in...');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!hasSupabaseConfig) {
    return (
      <PageCard
        title="Supabase configuration needed"
        description="Authentication is ready, but this environment is missing the frontend Supabase URL or anon key. Add them to .env.local and restart the dev server."
      />
    );
  }

  return (
    <PageCard
      title={mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Reset password'}
      description={
        mode === 'forgot-password'
          ? 'Enter your email and DogCareAI will send a Supabase password reset link.'
          : 'Use Supabase email/password authentication to access the DogCareAI beta routes.'
      }
    >
      <div className="mb-5 flex rounded-2xl border border-stone-200 bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => switchMode('sign-in')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-medium transition',
            mode === 'sign-in' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600',
          ].join(' ')}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode('sign-up')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-medium transition',
            mode === 'sign-up' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600',
          ].join(' ')}
        >
          Sign up
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {mode !== 'forgot-password' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-400"
        >
          {isSubmitting
            ? 'Please wait...'
            : mode === 'sign-in'
              ? 'Sign in'
              : mode === 'sign-up'
                ? 'Create account'
                : 'Send reset link'}
        </button>

        {mode === 'sign-in' ? (
          <button
            type="button"
            onClick={() => switchMode('forgot-password')}
            className="w-full text-sm font-semibold text-teal-800 underline-offset-4 transition hover:text-teal-950 hover:underline"
          >
            Forgot password?
          </button>
        ) : null}

        {mode === 'forgot-password' ? (
          <button
            type="button"
            onClick={() => switchMode('sign-in')}
            className="w-full text-sm font-semibold text-teal-800 underline-offset-4 transition hover:text-teal-950 hover:underline"
          >
            Return to sign in
          </button>
        ) : null}
      </form>

      {mode !== 'forgot-password' ? (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-medium uppercase tracking-normal text-slate-500">or</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {isGoogleSubmitting ? 'Opening Google sign in...' : 'Continue with Google'}
            </button>
            <p className="text-xs leading-5 text-slate-500">
              Email and password sign in remains available for demo and fallback access.
            </p>
          </div>
        </>
      ) : null}
    </PageCard>
  );
}
