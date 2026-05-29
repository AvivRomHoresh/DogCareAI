import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

const MIN_PASSWORD_LENGTH = 6;

export function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Password updated successfully. You can continue to your dashboard or sign in again.');
  };

  if (!hasSupabaseConfig) {
    return (
      <PageCard
        title="Supabase configuration needed"
        description="Password reset is ready, but this environment is missing the frontend Supabase URL or anon key. Add them to .env.local and restart the dev server."
      />
    );
  }

  return (
    <PageCard
      title="Update password"
      description="Enter a new password from your Supabase password reset link."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
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
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>
      </form>

      {successMessage ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/"
            className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue to dashboard
          </Link>
          <Link
            to="/auth"
            className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-stone-400 hover:bg-stone-50"
          >
            Go to sign in
          </Link>
        </div>
      ) : null}
    </PageCard>
  );
}
