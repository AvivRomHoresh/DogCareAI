import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { useDogs } from '../hooks/useDogs';

export function DashboardPage() {
  const { activeDog, dogs, error, isLoading } = useDogs();

  return (
    <div className="space-y-4">
      <PageCard
        title="Dashboard"
        description="Beta home base for the selected dog. Full reminders and AI summaries are intentionally deferred."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{dogs.length === 1 ? '1 dog profile' : `${dogs.length} dog profiles`}</StatusBadge>
          <StatusBadge tone="mock">Mock AI mode documented</StatusBadge>
        </div>
      </PageCard>

      {isLoading ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading dog context...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Could not load dog profiles. {error}
        </section>
      ) : null}

      {!isLoading && !error && !activeDog ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">Create your dog profile to get started.</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Add your first dog so the dashboard, assistant, and reminders can use the right care context.
          </p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            to="/dog-profile"
          >
            Create Dog Profile
          </Link>
        </section>
      ) : null}

      {activeDog ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-700">Selected dog</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{activeDog.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {[activeDog.breed, activeDog.age !== null ? `${activeDog.age} years old` : null]
                  .filter(Boolean)
                  .join(' · ') || 'Add breed and age details when you are ready.'}
              </p>
            </div>
            {activeDog.activity_level ? <StatusBadge>{activeDog.activity_level} activity</StatusBadge> : null}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Link className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-medium text-teal-800 shadow-sm" to="/dog-profile">
          Dog Profile
        </Link>
        <Link className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-medium text-teal-800 shadow-sm" to="/assistant">
          Assistant stub
        </Link>
        <Link className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-medium text-teal-800 shadow-sm" to="/reminders">
          Reminders stub
        </Link>
      </section>
    </div>
  );
}
