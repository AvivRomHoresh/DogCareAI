import type { Reminder, ReminderFrequency, ReminderState, ReminderType } from '../types/reminder';
import { REMINDER_FREQUENCIES, REMINDER_STATES, REMINDER_TYPES } from '../types/reminder';

export const reminderTypeLabels = Object.fromEntries(
  REMINDER_TYPES.map((type) => [type.value, type.label]),
) as Record<ReminderType, string>;

export const reminderFrequencyLabels = Object.fromEntries(
  REMINDER_FREQUENCIES.map((frequency) => [frequency.value, frequency.label]),
) as Record<ReminderFrequency, string>;

export const reminderStateLabels = Object.fromEntries(
  REMINDER_STATES.map((state) => [state.value, state.label]),
) as Record<ReminderState, string>;

export function formatReminderDateTime(value: string | null) {
  if (!value) {
    return 'No date set';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function isOpenReminder(reminder: Reminder) {
  return reminder.state !== 'completed';
}

export function isEffectivelyMissedReminder(reminder: Reminder) {
  if (reminder.state === 'completed' || !reminder.scheduled_at) {
    return false;
  }

  const date = new Date(reminder.scheduled_at);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

export function isMissedReminder(reminder: Reminder) {
  return reminder.state === 'missed' || isEffectivelyMissedReminder(reminder);
}

export function getEffectiveReminderState(reminder: Reminder): ReminderState {
  return isMissedReminder(reminder) ? 'missed' : reminder.state;
}

export function isScheduledToday(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  );
}

export function isScheduledInFuture(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

export function compareReminderSchedule(a: Reminder, b: Reminder) {
  if (!a.scheduled_at && !b.scheduled_at) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }

  if (!a.scheduled_at) {
    return 1;
  }

  if (!b.scheduled_at) {
    return -1;
  }

  return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
}
