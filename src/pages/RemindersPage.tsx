import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import { supabase } from '../lib/supabaseClient';
import type { Reminder, ReminderFrequency, ReminderState, ReminderType } from '../types/reminder';
import { REMINDER_FREQUENCIES, REMINDER_STATES, REMINDER_TYPES } from '../types/reminder';

type ReminderFormState = {
  title: string;
  type: ReminderType;
  scheduled_at: string;
  recurring_frequency: ReminderFrequency;
  notes: string;
  state: ReminderState;
};

type ReminderFilter = 'all' | 'today_open' | 'completed';

const emptyForm: ReminderFormState = {
  title: '',
  type: 'feeding',
  scheduled_at: '',
  recurring_frequency: 'none',
  notes: '',
  state: 'upcoming',
};

const typeLabels = Object.fromEntries(REMINDER_TYPES.map((type) => [type.value, type.label]));
const frequencyLabels = Object.fromEntries(
  REMINDER_FREQUENCIES.map((frequency) => [frequency.value, frequency.label]),
);
const stateLabels = Object.fromEntries(REMINDER_STATES.map((state) => [state.value, state.label]));

const reminderFilters: Array<{ value: ReminderFilter; label: string }> = [
  { value: 'all', label: 'All reminders' },
  { value: 'today_open', label: 'Today open' },
  { value: 'completed', label: 'Completed' },
];

function validateReminderForm(form: ReminderFormState) {
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

  if (!REMINDER_STATES.some((state) => state.value === form.state)) {
    errors.state = 'Choose a valid reminder state.';
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

function formatDateTime(value: string | null) {
  if (!value) {
    return 'No date set';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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

function isScheduledToday(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  );
}

export function RemindersPage() {
  const { hasSupabaseConfig, user } = useAuth();
  const { activeDog, activeDogId, dogs, isLoading: isDogsLoading } = useDogs();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminderId, setSelectedReminderId] = useState<string>('new');
  const [form, setForm] = useState<ReminderFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ReminderFormState, string>>>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReminderFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === selectedReminderId) ?? null,
    [reminders, selectedReminderId],
  );

  const filteredReminders = useMemo(() => {
    if (activeFilter === 'today_open') {
      return reminders.filter(
        (reminder) => reminder.state !== 'completed' && isScheduledToday(reminder.scheduled_at),
      );
    }

    if (activeFilter === 'completed') {
      return reminders.filter((reminder) => reminder.state === 'completed');
    }

    return reminders;
  }, [activeFilter, reminders]);

  const emptyFilterMessage =
    activeFilter === 'today_open'
      ? 'No open reminders for today.'
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

  const updateField = (field: keyof ReminderFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const startNewReminder = () => {
    setSelectedReminderId('new');
    setForm(emptyForm);
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

    const nextErrors = validateReminderForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ tone: 'error', message: 'Please fix the highlighted fields before saving.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      title: form.title.trim(),
      type: form.type,
      scheduled_at: toIsoOrNull(form.scheduled_at),
      recurring_frequency: form.recurring_frequency,
      notes: form.notes.trim() || null,
      state: form.state,
    };

    const result =
      selectedReminderId === 'new'
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

    const savedReminder = result.data as Reminder;
    await loadReminders();
    setSelectedReminderId(savedReminder.id);
    setForm(reminderToForm(savedReminder));
    setFeedback({ tone: 'success', message: 'Reminder saved successfully.' });
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
      <PageCard
        title="Reminders"
        description="Create and manage basic care reminders for the selected dog."
      >
        <div className="flex flex-wrap gap-2">
          {activeDog ? <StatusBadge>Active dog: {activeDog.name}</StatusBadge> : null}
          <StatusBadge>{reminders.length === 1 ? '1 reminder' : `${reminders.length} reminders`}</StatusBadge>
        </div>
      </PageCard>

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

      {canUseReminders ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {selectedReminder ? 'Edit reminder' : 'Add reminder'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">For {activeDog?.name}</p>
              </div>
              <button
                type="button"
                onClick={startNewReminder}
                disabled={isSaving}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                New reminder
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <Field label="Title" error={fieldErrors.title} required>
                <input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                  maxLength={120}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" error={fieldErrors.type} required>
                  <select
                    value={form.type}
                    onChange={(event) => updateField('type', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                  >
                    {REMINDER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Date and time">
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(event) => updateField('scheduled_at', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2"
                  />
                </Field>

                <Field
                  label="Repeats"
                  error={fieldErrors.recurring_frequency}
                  helperText="In beta, completing a repeating reminder creates the next occurrence as a separate reminder."
                >
                  <select
                    value={form.recurring_frequency}
                    onChange={(event) => updateField('recurring_frequency', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                  >
                    {REMINDER_FREQUENCIES.map((frequency) => (
                      <option key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="State" error={fieldErrors.state}>
                  <select
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                  >
                    {REMINDER_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2"
                  maxLength={1000}
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

              <button
                type="submit"
                disabled={isSaving || !hasSupabaseConfig}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
              >
                {isSaving ? 'Saving...' : selectedReminder ? 'Update reminder' : 'Save reminder'}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="tablist" aria-label="Reminder filters">
                {reminderFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
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
  return (
    <article
      className={[
        'rounded-2xl border bg-white p-5 shadow-sm',
        isSelected ? 'border-teal-300 ring-2 ring-teal-100' : 'border-stone-200',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{reminder.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatDateTime(reminder.scheduled_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{typeLabels[reminder.type] ?? reminder.type}</Badge>
          <Badge>{stateLabels[reminder.state] ?? reminder.state}</Badge>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-800">Repeats</dt>
          <dd>{frequencyLabels[reminder.recurring_frequency] ?? reminder.recurring_frequency}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-800">State</dt>
          <dd>{stateLabels[reminder.state] ?? reminder.state}</dd>
        </div>
      </dl>

      {reminder.notes ? <p className="mt-4 text-sm leading-6 text-slate-600">{reminder.notes}</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onEdit(reminder)}
          disabled={isSaving}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>
        {reminder.state !== 'completed' ? (
          <button
            type="button"
            onClick={() => onMarkCompleted(reminder)}
            disabled={isSaving}
            className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark completed
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(reminder)}
          disabled={isSaving}
          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
