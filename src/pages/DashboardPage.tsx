import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageCard
        title="Dashboard"
        description="Initial route stub for the future dog-care overview. No dashboard data is loaded yet."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge>Skeleton only</StatusBadge>
          <StatusBadge tone="mock">Mock AI mode documented</StatusBadge>
        </div>
      </PageCard>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-medium text-teal-800 shadow-sm" to="/dog-profile">
          Dog profile stub
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
