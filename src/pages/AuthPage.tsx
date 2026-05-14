import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

type AuthMode = 'sign-in' | 'sign-up';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (isSubmitting) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (!supabase) {
      setErrorMessage('Supabase is not configured yet. Add the frontend env variables and restart the dev server.');
      return;
    }

    setIsSubmitting(true);

    const credentials = {
      email: email.trim(),
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
      setSuccessMessage('Account created. Redirecting to your dashboard.');
      navigate('/', { replace: true });
      return;
    }

    setSuccessMessage('Account created. Check your email if Supabase requires confirmation before sign in.');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
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
      title={mode === 'sign-in' ? 'Sign in' : 'Create account'}
      description="Use Supabase email/password authentication to access the DogCareAI beta routes."
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
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-400"
        >
          {isSubmitting ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </PageCard>
  );
}
