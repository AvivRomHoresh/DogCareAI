import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BreedDidYouKnowCard } from '../components/BreedDidYouKnowCard';
import { DogAvatar } from '../components/DogAvatar';
import { DashboardIcon } from '../components/icons/DashboardIcon';
import { PageCard } from '../components/PageCard';
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
import type { Dog } from '../types/dog';
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
      <section className="space-y-3 bg-transparent py-2 text-center">
        <div>
          <h1 className="inline-flex items-center justify-center gap-3 text-4xl font-extrabold tracking-normal text-slate-950 sm:text-5xl">
            <DashboardIcon className="h-8 w-8 text-teal-700 sm:h-9 sm:w-9" />
            <span>Dashboard</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Today at a glance for the selected dog, with care reminders and helpful dog-aware context.
          </p>
        </div>
        {activeDog ? <BreedDidYouKnowCard breed={activeDog.breed} dogName={activeDog.name} /> : null}
      </section>

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
        <section className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm shadow-teal-950/5 backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <DogAvatar
                  breed={activeDog?.breed}
                  name={activeDog?.name}
                  profileImageUrl={activeDog?.profile_image_url}
                  size="md"
                  weight={activeDog?.weight}
                />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Active profile</p>
                  <h2 className="mt-1 text-3xl font-extrabold text-slate-950">{activeDog?.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getDogSummaryLine(activeDog)}
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex justify-center rounded-2xl border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:border-teal-200 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                to="/dog-profile"
              >
                Edit profile
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ReminderStatCard
                color="blue"
                helper="Active reminders"
                label="Open"
                to="/reminders?filter=open"
                value={dashboardCounts.openCount}
              />
              <ReminderStatCard
                color="red"
                helper="Needs attention"
                label="Missed"
                to="/reminders?filter=missed"
                value={dashboardCounts.missedCount}
              />
              <ReminderStatCard
                color="green"
                helper="Finished"
                label="Completed"
                to="/reminders?filter=completed"
                value={dashboardCounts.completedCount}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4">
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

              <section className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4">
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

            {!isRemindersLoading && !remindersError && !hasReminderData ? (
              <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center shadow-sm">
                <h2 className="text-base font-semibold text-amber-950">
                  No reminders yet.
                </h2>
                <Link
                  className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                  to="/reminders"
                >
                  Add Reminder
                </Link>
              </section>
            ) : null}
        </section>
      ) : null}
    </div>
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
          <article key={reminder.id} className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
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

type StatColor = 'blue' | 'green' | 'red';

type ReminderStatCardProps = {
  color: StatColor;
  helper: string;
  label: string;
  to: string;
  value: number;
};

const statColorClasses: Record<StatColor, string> = {
  blue: 'border-blue-100 bg-blue-50 text-blue-900 hover:border-blue-200 hover:bg-blue-100',
  green: 'border-green-100 bg-green-50 text-green-900 hover:border-green-200 hover:bg-green-100',
  red: 'border-red-100 bg-red-50 text-red-900 hover:border-red-200 hover:bg-red-100',
};

function ReminderStatCard({ color, helper, label, to, value }: ReminderStatCardProps) {
  return (
    <Link
      className={[
        'rounded-2xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
        statColorClasses[color],
      ].join(' ')}
      to={to}
    >
      <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
        <CalendarIcon />
      </span>
      <span className="mt-2 block text-sm font-bold">{label}</span>
      <span className="mt-1 block text-3xl font-extrabold">{value}</span>
      <span className="mt-1 block text-xs font-semibold opacity-75">{helper}</span>
    </Link>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function getDogSummaryLine(dog: Dog | null | undefined) {
  const details = [
    dog?.breed,
    dog?.age !== null && dog?.age !== undefined ? `${dog.age} years old` : null,
  ].filter(Boolean);

  return details.join(' - ') || 'Add breed and age details when you are ready.';
}
