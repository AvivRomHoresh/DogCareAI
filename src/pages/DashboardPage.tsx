import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import {
  compareReminderSchedule,
  formatReminderDateTime,
  getEffectiveReminderState,
  isMissedReminder,
  isOpenReminder,
  isScheduledInFuture,
  isScheduledToday,
  reminderFrequencyLabels,
  reminderStateLabels,
  reminderTypeLabels,
} from '../lib/reminderHelpers';
import { supabase } from '../lib/supabaseClient';
import type { Reminder } from '../types/reminder';

const upcomingLimit = 5;

export function DashboardPage() {
  const { hasSupabaseConfig } = useAuth();
  const { activeDog, activeDogId, dogs, error: dogsError, isLoading: isDogsLoading } = useDogs();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);
  const [remindersError, setRemindersError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !activeDogId) {
      setReminders([]);
      setRemindersError(null);
      setIsRemindersLoading(false);
      return undefined;
    }

    let isCurrent = true;
    const supabaseClient = supabase;

    async function loadDashboardReminders() {
      setIsRemindersLoading(true);
      setRemindersError(null);

      const { data, error } = await supabaseClient
        .from('reminders')
        .select('*')
        .eq('dog_id', activeDogId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (!isCurrent) {
        return;
      }

      if (error) {
        setReminders([]);
        setRemindersError(error.message);
      } else {
        setReminders((data ?? []) as Reminder[]);
      }

      setIsRemindersLoading(false);
    }

    void loadDashboardReminders();

    return () => {
      isCurrent = false;
    };
  }, [activeDogId, hasSupabaseConfig]);

  const dashboardCounts = useMemo(() => {
    const missedReminders = reminders.filter(isMissedReminder);
    const openReminders = reminders.filter((reminder) => isOpenReminder(reminder) && !isMissedReminder(reminder));
    const todayOpenReminders = openReminders.filter((reminder) => isScheduledToday(reminder.scheduled_at));
    const upcomingOpenReminders = openReminders
      .filter(
        (reminder) =>
          reminder.scheduled_at === null
          || (isScheduledInFuture(reminder.scheduled_at) && !isScheduledToday(reminder.scheduled_at)),
      )
      .sort(compareReminderSchedule)
      .slice(0, upcomingLimit);
    const completedReminders = reminders.filter((reminder) => reminder.state === 'completed');

    return {
      completedCount: completedReminders.length,
      missedCount: missedReminders.length,
      openCount: openReminders.length,
      todayOpenCount: todayOpenReminders.length,
      todayOpenReminders,
      upcomingOpenReminders,
    };
  }, [reminders]);

  const hasActiveDog = Boolean(activeDog && activeDogId);
  const hasReminderData = reminders.length > 0;

  return (
    <div className="space-y-4">
      <PageCard
        title="Dashboard"
        description="Today at a glance for the selected dog, using profile and reminder data only."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{dogs.length === 1 ? '1 dog profile' : `${dogs.length} dog profiles`}</StatusBadge>
          {activeDog ? <StatusBadge>Active dog: {activeDog.name}</StatusBadge> : null}
          <StatusBadge tone="mock">No AI calls on dashboard</StatusBadge>
        </div>
      </PageCard>

      {!hasSupabaseConfig ? (
        <PageCard
          title="Supabase setup needed"
          description="Add the frontend-safe Supabase URL and anon key in .env.local to load dashboard data."
        />
      ) : null}

      {isDogsLoading ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading dog context...
        </section>
      ) : null}

      {dogsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
          Could not load dog profiles. {dogsError}
        </section>
      ) : null}

      {!isDogsLoading && !dogsError && dogs.length === 0 ? (
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

      {!isDogsLoading && !dogsError && dogs.length > 0 && !activeDog ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
          Select a dog from the header to load that dog's dashboard.
        </section>
      ) : null}

      {hasActiveDog ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Active dog" value={activeDog?.name ?? 'Select a dog'} helper="Current dashboard context" />
            <SummaryCard label="Open reminders" value={dashboardCounts.openCount} helper="Active and not missed" />
            <SummaryCard label="Today open" value={dashboardCounts.todayOpenCount} helper="Due today, not missed" />
            <SummaryCard label="Missed" value={dashboardCounts.missedCount} helper="Past due or marked missed" />
            <SummaryCard label="Completed" value={dashboardCounts.completedCount} helper="Completed for this dog" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">Selected dog</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">{activeDog?.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {[activeDog?.breed, activeDog?.age !== null ? `${activeDog?.age} years old` : null]
                        .filter(Boolean)
                        .join(' - ') || 'Add breed and age details when you are ready.'}
                    </p>
                  </div>
                  {activeDog?.activity_level ? <StatusBadge>{activeDog.activity_level} activity</StatusBadge> : null}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Today open reminders"
                  action={<Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" to="/reminders">Manage</Link>}
                />

                {isRemindersLoading ? <LoadingLine>Loading reminders...</LoadingLine> : null}
                {remindersError ? <ErrorLine>Could not load reminders. {remindersError}</ErrorLine> : null}

                {!isRemindersLoading && !remindersError && dashboardCounts.todayOpenReminders.length === 0 ? (
                  <EmptyLine>No open reminders for today.</EmptyLine>
                ) : null}

                <ReminderList reminders={dashboardCounts.todayOpenReminders} />
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Later & unscheduled open reminders"
                  action={<Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" to="/reminders">Add reminder</Link>}
                />

                {isRemindersLoading ? <LoadingLine>Loading reminders...</LoadingLine> : null}
                {remindersError ? <ErrorLine>Could not load reminders. {remindersError}</ErrorLine> : null}

                {!isRemindersLoading && !remindersError && dashboardCounts.upcomingOpenReminders.length === 0 ? (
                  <EmptyLine>No later or unscheduled open reminders.</EmptyLine>
                ) : null}

                <ReminderList reminders={dashboardCounts.upcomingOpenReminders} />
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
                <div className="mt-4 grid gap-3">
                  <QuickAction to="/dog-profile" title="Edit Dog Profile" description="Update care details for the selected dog." />
                  <QuickAction to="/reminders" title="Add Reminder" description="Create or complete a dog-care reminder." />
                  <QuickAction to="/assistant" title="Ask Assistant" description="Open the assistant stub for the next beta step." />
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Completed reminders</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {dashboardCounts.completedCount === 0
                    ? 'No completed reminders yet for this dog.'
                    : `${dashboardCounts.completedCount} completed ${
                        dashboardCounts.completedCount === 1 ? 'reminder' : 'reminders'
                      } for ${activeDog?.name}.`}
                </p>
              </section>

              {!isRemindersLoading && !remindersError && !hasReminderData ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-amber-950">
                    No reminders yet. Add your first dog-care reminder.
                  </h2>
                  <Link
                    className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    to="/reminders"
                  >
                    Add Reminder
                  </Link>
                </section>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

type SummaryCardProps = {
  helper: string;
  label: string;
  value: ReactNode;
};

function SummaryCard({ helper, label, value }: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </section>
  );
}

type SectionHeaderProps = {
  action?: ReactNode;
  title: string;
};

function SectionHeader({ action, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {action}
    </div>
  );
}

function ReminderList({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {reminders.map((reminder) => {
        const effectiveState = getEffectiveReminderState(reminder);

        return (
          <article key={reminder.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">{reminder.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{formatReminderDateTime(reminder.scheduled_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MiniBadge>{reminderTypeLabels[reminder.type] ?? reminder.type}</MiniBadge>
                <MiniBadge>{reminderStateLabels[effectiveState] ?? effectiveState}</MiniBadge>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Repeats: {reminderFrequencyLabels[reminder.recurring_frequency] ?? reminder.recurring_frequency}
            </p>
          </article>
        );
      })}
    </div>
  );
}

type QuickActionProps = {
  description: string;
  title: string;
  to: string;
};

function QuickAction({ description, title, to }: QuickActionProps) {
  return (
    <Link className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-teal-200 hover:bg-teal-50" to={to}>
      <span className="font-semibold text-teal-800">{title}</span>
      <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
    </Link>
  );
}

function LoadingLine({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm text-slate-600">{children}</p>;
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-600">{children}</p>;
}

function ErrorLine({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{children}</p>;
}

function MiniBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
