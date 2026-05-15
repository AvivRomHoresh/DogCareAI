import {
  compareReminderSchedule,
  formatReminderDateTime,
  isOpenReminder,
  reminderTypeLabels,
} from '../lib/reminderHelpers';
import type { Dog } from '../types/dog';
import type { Reminder } from '../types/reminder';

type ContextSummaryCardProps = {
  dog: Dog;
  isLoadingReminders?: boolean;
  reminderError?: string | null;
  reminders: Reminder[];
};

export function ContextSummaryCard({
  dog,
  isLoadingReminders = false,
  reminderError = null,
  reminders,
}: ContextSummaryCardProps) {
  const openReminders = reminders.filter(isOpenReminder).sort(compareReminderSchedule).slice(0, 3);
  const profileFacts = [
    dog.breed ? ['Breed', dog.breed] : null,
    dog.age !== null ? ['Age', `${dog.age} years`] : null,
    dog.weight !== null ? ['Weight', `${dog.weight} kg`] : null,
    dog.activity_level ? ['Activity', dog.activity_level] : null,
    dog.allergies ? ['Allergies', dog.allergies] : null,
    dog.feeding_preferences ? ['Feeding', dog.feeding_preferences] : null,
    dog.medical_notes ? ['Medical notes', dog.medical_notes] : null,
    dog.special_conditions ? ['Special conditions', dog.special_conditions] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <details className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-lg font-semibold text-slate-950">
        Context summary for {dog.name}
      </summary>

      <div className="mt-4 space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          The beta assistant uses selected dog profile details and loaded reminder context. It does not expose or send a
          hidden prompt.
        </p>

        {profileFacts.length > 0 ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {profileFacts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-slate-600">
            Add breed, age, activity, allergies, feeding preferences, or medical notes to enrich assistant context.
          </p>
        )}

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-sm font-semibold text-slate-900">
            {isLoadingReminders
              ? 'Loading reminder context...'
              : `${reminders.length} loaded ${reminders.length === 1 ? 'reminder' : 'reminders'}`}
          </p>

          {reminderError ? (
            <p className="mt-2 text-sm leading-6 text-red-700">
              Reminder context could not be loaded. The mock assistant can still use dog profile context.
            </p>
          ) : null}

          {!isLoadingReminders && !reminderError && openReminders.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">No open reminders are loaded for this dog.</p>
          ) : null}

          {openReminders.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {openReminders.map((reminder) => (
                <li key={reminder.id} className="text-sm leading-6 text-slate-700">
                  <span className="font-medium text-slate-950">{reminder.title}</span>
                  {' - '}
                  {reminderTypeLabels[reminder.type] ?? reminder.type}
                  {' - '}
                  {formatReminderDateTime(reminder.scheduled_at)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </details>
  );
}
