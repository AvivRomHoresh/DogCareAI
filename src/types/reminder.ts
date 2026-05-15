export type ReminderType =
  | 'feeding'
  | 'walk'
  | 'medication'
  | 'vaccination'
  | 'grooming'
  | 'vet_visit'
  | 'general';

export type ReminderFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderState = 'upcoming' | 'completed' | 'missed' | 'snoozed';

export type Reminder = {
  id: string;
  user_id: string;
  dog_id: string;
  type: ReminderType;
  title: string;
  scheduled_at: string | null;
  recurring_frequency: ReminderFrequency;
  notes: string | null;
  state: ReminderState;
  created_at: string;
  updated_at: string;
};

export const REMINDER_TYPES: Array<{ value: ReminderType; label: string }> = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'walk', label: 'Walk' },
  { value: 'medication', label: 'Medication' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'vet_visit', label: 'Vet Visit' },
  { value: 'general', label: 'General' },
];

export const REMINDER_FREQUENCIES: Array<{ value: ReminderFrequency; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const REMINDER_STATES: Array<{ value: ReminderState; label: string }> = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
  { value: 'snoozed', label: 'Snoozed' },
];

