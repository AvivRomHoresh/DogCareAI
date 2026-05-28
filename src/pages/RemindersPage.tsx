import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ReminderIcon } from '../components/icons/ReminderIcon';
import { PageCard } from '../components/PageCard';
import { TelegramReminderSettingsCard } from '../components/TelegramReminderSettingsCard';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import {
  formatReminderDateTime,
  getEffectiveReminderState,
  isScheduledToday,
  isMissedReminder,
  reminderFrequencyLabels,
  reminderStateLabels,
  reminderTypeLabels,
} from '../lib/reminderHelpers';
import { supabase } from '../lib/supabaseClient';
import type { Reminder, ReminderFrequency, ReminderState, ReminderType } from '../types/reminder';
import { REMINDER_FREQUENCIES, REMINDER_TYPES } from '../types/reminder';

type ReminderFormState = {
  title: string;
  type: ReminderType;
  scheduled_at: string;
  recurring_frequency: ReminderFrequency;
  notes: string;
  state: ReminderState;
};

type ReminderFilter = 'open' | 'today_open' | 'missed' | 'completed' | 'all';

const emptyForm: ReminderFormState = {
  title: '',
  type: 'feeding',
  scheduled_at: '',
  recurring_frequency: 'none',
  notes: '',
  state: 'upcoming',
};

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100';

const textareaClassName =
  'min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100';
const notesTextareaClassName =
  'min-h-28 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-4 py-3 text-sm text-slate-900 shadow-inner transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100';

const reminderFilters: Array<{ value: ReminderFilter; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'today_open', label: 'Today open' },
  { value: 'missed', label: 'Missed' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const reminderFilterValues = new Set<ReminderFilter>(reminderFilters.map((filter) => filter.value));

function getReminderFilterFromQuery(value: string | null): ReminderFilter {
  return value && reminderFilterValues.has(value as ReminderFilter) ? (value as ReminderFilter) : 'open';
}

function isLessThanOneMinuteInFuture(value: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return true;
  }

  return date.getTime() < Date.now() + 60 * 1000;
}

function getOneMinuteFutureDateTimeLocalValue() {
  const date = new Date(Date.now() + 60 * 1000);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function validateReminderForm(form: ReminderFormState, isCreatingReminder: boolean) {
  const errors: Partial<Record<keyof ReminderFormState, string>> = {};
  const title = form.title.trim();

  if (!title) {
    errors.title = 'Please enter a reminder title.';
  } else if (title.length < 2) {
    errors.title = 'Reminder title must be at least 2 characters.';
  }

  if (!REMINDER_TYPES.some((type) => type.value === form.type)) {
    errors.type = 'Choose a valid reminder type.';
  }

  if (!REMINDER_FREQUENCIES.some((frequency) => frequency.value === form.recurring_frequency)) {
    errors.recurring_frequency = 'Choose a valid repeat option.';
  }

  if (isCreatingReminder && form.state !== 'upcoming') {
    errors.state = 'New reminders must start as open/upcoming.';
  }

  if (isCreatingReminder && isLessThanOneMinuteInFuture(form.scheduled_at)) {
    errors.scheduled_at = 'Choose a time at least one minute in the future.';
  }

  return errors;
}

function reminderToForm(reminder: Reminder): ReminderFormState {
  return {
    title: reminder.title,
    type: reminder.type,
    scheduled_at: reminder.scheduled_at ? toDateTimeLocalValue(reminder.scheduled_at) : '',
    recurring_frequency: reminder.recurring_frequency,
    notes: reminder.notes ?? '',
    state: reminder.state,
  };
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function shouldResetMissedReminderState(state: ReminderState, scheduledAt: string | null) {
  if (state !== 'missed' || !scheduledAt) {
    return false;
  }

  const date = new Date(scheduledAt);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

function formatDateTime(value: string | null) {
  return formatReminderDateTime(value);
}

function isRecurringReminder(reminder: Reminder) {
  return reminder.recurring_frequency !== 'none';
}

function addInterval(date: Date, frequency: ReminderFrequency) {
  const nextDate = new Date(date);

  if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate;
}

function getNextOccurrence(value: string, frequency: ReminderFrequency) {
  let nextDate = addInterval(new Date(value), frequency);
  const now = new Date();

  while (nextDate <= now) {
    nextDate = addInterval(nextDate, frequency);
  }

  return nextDate.toISOString();
}

export function RemindersPage() {
  const { hasSupabaseConfig, user } = useAuth();
  const { activeDog, activeDogId, dogs, isLoading: isDogsLoading } = useDogs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminderId, setSelectedReminderId] = useState<string>('new');
  const [form, setForm] = useState<ReminderFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ReminderFormState, string>>>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReminderFilter>(() =>
    getReminderFilterFromQuery(searchParams.get('filter')),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === selectedReminderId) ?? null,
    [reminders, selectedReminderId],
  );
  const isCreatingReminder = selectedReminderId === 'new';
  const minimumReminderDateTime = useMemo(() => getOneMinuteFutureDateTimeLocalValue(), []);

  const filteredReminders = useMemo(() => {
    if (activeFilter === 'open') {
      return reminders.filter((reminder) => reminder.state !== 'completed' && !isMissedReminder(reminder));
    }

    if (activeFilter === 'today_open') {
      return reminders.filter(
        (reminder) =>
          reminder.state !== 'completed'
          && !isMissedReminder(reminder)
          && isScheduledToday(reminder.scheduled_at),
      );
    }

    if (activeFilter === 'missed') {
      return reminders.filter(isMissedReminder);
    }

    if (activeFilter === 'completed') {
      return reminders.filter((reminder) => reminder.state === 'completed');
    }

    return reminders;
  }, [activeFilter, reminders]);

  const emptyFilterMessage =
    activeFilter === 'open'
      ? 'No open reminders.'
      : activeFilter === 'today_open'
      ? 'No open reminders for today.'
      : activeFilter === 'missed'
      ? 'No missed reminders.'
      : activeFilter === 'completed'
        ? 'No completed reminders yet.'
        : 'No reminders yet. Add your first dog-care reminder.';

  const loadReminders = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !activeDogId) {
      setReminders([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('dog_id', activeDogId)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      setLoadError(error.message);
      setReminders([]);
    } else {
      setReminders((data ?? []) as Reminder[]);
    }

    setIsLoading(false);
  }, [activeDogId, hasSupabaseConfig]);

  useEffect(() => {
    setSelectedReminderId('new');
    setForm(emptyForm);
    setFieldErrors({});
    setFeedback(null);
    void loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    setActiveFilter(getReminderFilterFromQuery(searchParams.get('filter')));
  }, [searchParams]);

  const handleFilterChange = (nextFilter: ReminderFilter) => {
    setActiveFilter(nextFilter);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('filter', nextFilter);
      return nextParams;
    });
  };

  const updateField = (field: keyof ReminderFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const startNewReminder = () => {
    setSelectedReminderId('new');
    setForm({ ...emptyForm, state: 'upcoming' });
    setFieldErrors({});
    setFeedback(null);
  };

  const startEditing = (reminder: Reminder) => {
    setSelectedReminderId(reminder.id);
    setForm(reminderToForm(reminder));
    setFieldErrors({});
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!hasSupabaseConfig || !supabase || !user) {
      setFeedback({ tone: 'error', message: 'Supabase is not configured or you are not signed in.' });
      return;
    }

    if (!activeDogId) {
      setFeedback({ tone: 'error', message: 'Select a dog before saving a reminder.' });
      return;
    }

    const nextErrors = validateReminderForm(form, isCreatingReminder);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ tone: 'error', message: 'Please fix the highlighted fields before saving.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const scheduledAt = toIsoOrNull(form.scheduled_at);
    const nextState = shouldResetMissedReminderState(form.state, scheduledAt) ? 'upcoming' : form.state;
    const payload = {
      title: form.title.trim(),
      type: form.type,
      scheduled_at: scheduledAt,
      recurring_frequency: form.recurring_frequency,
      notes: form.notes.trim() || null,
      state: nextState,
    };

    const result =
      isCreatingReminder
        ? await supabase
            .from('reminders')
            .insert({ ...payload, user_id: user.id, dog_id: activeDogId })
            .select('*')
            .single()
        : await supabase
            .from('reminders')
            .update(payload)
            .eq('id', selectedReminderId)
            .eq('dog_id', activeDogId)
            .select('*')
            .single();

    if (result.error) {
      setFeedback({ tone: 'error', message: result.error.message });
      setIsSaving(false);
      return;
    }

    await loadReminders();
    setSelectedReminderId('new');
    setForm(emptyForm);
    setFieldErrors({});
    setFeedback({
      tone: 'success',
      message: isCreatingReminder ? 'Reminder saved successfully.' : 'Reminder updated successfully.',
    });
    setIsSaving(false);
  };

  const markCompleted = async (reminder: Reminder) => {
    if (isSaving || !supabase || !activeDogId) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const shouldCreateNextOccurrence = isRecurringReminder(reminder) && Boolean(reminder.scheduled_at);

    const { error } = await supabase
      .from('reminders')
      .update({ state: 'completed' })
      .eq('id', reminder.id)
      .eq('dog_id', activeDogId);

    if (error) {
      setFeedback({ tone: 'error', message: error.message });
    } else {
      if (shouldCreateNextOccurrence) {
        const { error: insertError } = await supabase.from('reminders').insert({
          user_id: reminder.user_id,
          dog_id: reminder.dog_id,
          title: reminder.title,
          type: reminder.type,
          scheduled_at: getNextOccurrence(reminder.scheduled_at as string, reminder.recurring_frequency),
          recurring_frequency: reminder.recurring_frequency,
          notes: reminder.notes,
          state: 'upcoming',
        });

        if (insertError) {
          setFeedback({ tone: 'error', message: insertError.message });
          setIsSaving(false);
          return;
        }
      }

      await loadReminders();
      setFeedback({
        tone: 'success',
        message: shouldCreateNextOccurrence
          ? 'Recurring reminder completed and the next occurrence was created.'
          : 'Reminder marked completed.',
      });
      if (selectedReminderId === reminder.id) {
        setForm((current) => ({ ...current, state: 'completed' }));
      }
    }

    setIsSaving(false);
  };

  const deleteReminder = async (reminder: Reminder) => {
    if (isSaving || !supabase || !activeDogId) {
      return;
    }

    const confirmed = window.confirm(`Delete "${reminder.title}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminder.id)
      .eq('dog_id', activeDogId);

    if (error) {
      setFeedback({ tone: 'error', message: error.message });
    } else {
      await loadReminders();
      if (selectedReminderId === reminder.id) {
        startNewReminder();
      }
      setFeedback({ tone: 'success', message: 'Reminder deleted.' });
    }

    setIsSaving(false);
  };

  const canUseReminders = Boolean(activeDogId && activeDog);

  return (
    <div className="space-y-4">
      <section className="space-y-3 bg-transparent py-2 text-center">
        <h1 className="inline-flex items-center justify-center gap-3 text-4xl font-extrabold tracking-normal text-slate-950 sm:text-5xl">
          <ReminderIcon className="h-8 w-8 text-teal-700 sm:h-9 sm:w-9" />
          <span>Reminders</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600">
          Keep care routines visible for the selected dog without changing Telegram scheduling behavior.
        </p>
      </section>

      {!hasSupabaseConfig ? (
        <PageCard
          title="Supabase setup needed"
          description="Add the frontend-safe Supabase URL and anon key in .env.local to use reminders."
        />
      ) : null}

      {!isDogsLoading && dogs.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">Create a dog profile before adding reminders.</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Reminders are always connected to a dog profile so the app can keep the right care context.
          </p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            to="/dog-profile"
          >
            Create Dog Profile
          </Link>
        </section>
      ) : null}

      {!isDogsLoading && dogs.length > 0 && !activeDog ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
          Select a dog from the header before adding reminders.
        </section>
      ) : null}

      {hasSupabaseConfig && user ? <TelegramReminderSettingsCard /> : null}

      {canUseReminders ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm shadow-teal-950/5 backdrop-blur">
            <div className="border-b border-stone-100 pb-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <h2 className="text-2xl font-extrabold text-slate-950">
                  {selectedReminder ? 'Edit reminder' : 'Add reminder'}
                </h2>
                <p className="text-sm font-semibold text-teal-800">Active Profile: {activeDog?.name}</p>
                <button
                  type="button"
                  onClick={startNewReminder}
                  disabled={isSaving}
                  className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  New reminder
                </button>
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <Field label="Title" error={fieldErrors.title} required>
                <input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className={inputClassName}
                  maxLength={120}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" error={fieldErrors.type} required>
                  <select
                  value={form.type}
                  onChange={(event) => updateField('type', event.target.value)}
                  className={inputClassName}
                >
                    {REMINDER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Date and time"
                  error={fieldErrors.scheduled_at}
                  helperText={isCreatingReminder ? 'Optional, but new reminders with a time must be at least one minute in the future.' : undefined}
                >
                  <input
                    type="datetime-local"
                    min={isCreatingReminder ? minimumReminderDateTime : undefined}
                    value={form.scheduled_at}
                    onChange={(event) => updateField('scheduled_at', event.target.value)}
                    className={inputClassName}
                  />
                </Field>

                {fieldErrors.state ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {fieldErrors.state}
                  </p>
                ) : null}
              </div>

              <div className="mx-auto max-w-md">
                <Field
                  label="Repeats"
                  error={fieldErrors.recurring_frequency}
                  helperText="In beta, completing a repeating reminder creates the next occurrence as a separate reminder."
                >
                  <select
                    value={form.recurring_frequency}
                    onChange={(event) => updateField('recurring_frequency', event.target.value)}
                    className={inputClassName}
                  >
                    {REMINDER_FREQUENCIES.map((frequency) => (
                      <option key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  className={notesTextareaClassName}
                  maxLength={1000}
                  placeholder="Add optional notes here..."
                />
              </Field>

              {feedback ? (
                <div
                  className={[
                    'rounded-2xl border px-4 py-3 text-sm',
                    feedback.tone === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-800',
                  ].join(' ')}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSaving || !hasSupabaseConfig}
                  className="w-full rounded-2xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
                >
                  {isSaving ? 'Saving...' : selectedReminder ? 'Update reminder' : 'Save reminder'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="tablist" aria-label="Reminder filters">
                {reminderFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleFilterChange(filter.value)}
                    className={[
                      'rounded-xl border px-3 py-2 text-sm font-medium transition',
                      activeFilter === filter.value
                        ? 'border-teal-200 bg-teal-50 text-teal-900'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
                    ].join(' ')}
                    aria-pressed={activeFilter === filter.value}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Completed recurring reminders stay in history. Use Open to focus on active reminders.
              </p>
            </section>

            {isLoading ? (
              <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Loading reminders...
              </section>
            ) : null}

            {loadError ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
                Could not load reminders. {loadError}
              </section>
            ) : null}

            {!isLoading && !loadError && filteredReminders.length === 0 ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
                <h2 className="text-lg font-semibold">{emptyFilterMessage}</h2>
              </section>
            ) : null}

            {filteredReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                isSelected={selectedReminderId === reminder.id}
                isSaving={isSaving}
                onDelete={deleteReminder}
                onEdit={startEditing}
                onMarkCompleted={markCompleted}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type ReminderCardProps = {
  reminder: Reminder;
  isSelected: boolean;
  isSaving: boolean;
  onDelete: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onMarkCompleted: (reminder: Reminder) => void;
};

function ReminderCard({
  reminder,
  isSelected,
  isSaving,
  onDelete,
  onEdit,
  onMarkCompleted,
}: ReminderCardProps) {
  const effectiveState = getEffectiveReminderState(reminder);

  return (
    <article
      className={[
        'rounded-3xl border bg-white/90 p-5 text-center shadow-sm shadow-teal-950/5',
        isSelected ? 'border-teal-300 ring-2 ring-teal-100' : 'border-stone-200',
      ].join(' ')}
    >
      <h3 className="text-xl font-extrabold text-slate-950">{reminder.title}</h3>
      <p className="mt-2 text-sm font-medium text-slate-600">{formatDateTime(reminder.scheduled_at)}</p>

      <dl className="mx-auto mt-4 grid max-w-md gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 font-semibold text-slate-800">{reminderTypeLabels[reminder.type] ?? reminder.type}</dd>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">State</dt>
          <dd className="mt-1 font-semibold text-slate-800">{reminderStateLabels[effectiveState] ?? effectiveState}</dd>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2 sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Repeats</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {reminderFrequencyLabels[reminder.recurring_frequency] ?? reminder.recurring_frequency}
          </dd>
        </div>
      </dl>

      {reminder.notes ? <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">{reminder.notes}</p> : null}

      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onEdit(reminder)}
          disabled={isSaving}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>
        {reminder.state !== 'completed' ? (
          <button
            type="button"
            onClick={() => onMarkCompleted(reminder)}
            disabled={isSaving}
            className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark completed
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(reminder)}
          disabled={isSaving}
          className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

type FieldProps = {
  children: ReactNode;
  error?: string;
  helperText?: string;
  label: string;
  required?: boolean;
};

function Field({ children, error, helperText, label, required = false }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
      {helperText ? <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
    </label>
  );
}
