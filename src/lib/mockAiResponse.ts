import {
  compareReminderSchedule,
  formatReminderDateTime,
  isOpenReminder,
  reminderTypeLabels,
} from './reminderHelpers';
import type { AssistantIntent } from './getDetectedIntent';
import type { Dog } from '../types/dog';
import type { Reminder, ReminderType } from '../types/reminder';

export type AssistantResponseSource = 'gemini' | 'mock' | 'fallback' | 'emergency_rule';

export type AssistantResponse = {
  message: string;
  response_source: AssistantResponseSource;
  is_emergency: boolean;
  detected_intent: AssistantIntent;
  disclaimer: string;
};

export const DOGCARE_DISCLAIMER =
  'DogCareAI provides general informational guidance and is not a substitute for professional veterinary advice.';

type BuildMockResponseInput = {
  question: string;
  dog: Dog;
  detectedIntent: Exclude<AssistantIntent, 'emergency'>;
  reminders: Reminder[];
};

const intentReminderTypes: Partial<Record<Exclude<AssistantIntent, 'emergency' | 'unknown'>, ReminderType[]>> = {
  feeding: ['feeding'],
  vaccination: ['vaccination', 'medication', 'vet_visit'],
  walking: ['walk'],
  routine: ['feeding', 'walk', 'medication', 'vaccination', 'grooming', 'vet_visit', 'general'],
  behavior: ['general', 'walk'],
};

const intentLabels: Record<AssistantIntent, string> = {
  feeding: 'feeding',
  vaccination: 'vaccination or care',
  walking: 'walking and activity',
  routine: 'routine',
  behavior: 'behavior',
  emergency: 'emergency',
  unknown: 'general care',
};

function compactDogContext(dog: Dog) {
  return [
    dog.age !== null ? `${dog.age} years old` : null,
    dog.breed,
    dog.weight !== null ? `${dog.weight} kg` : null,
    dog.activity_level ? `${dog.activity_level} activity level` : null,
  ].filter(Boolean);
}

function dogCareNotes(dog: Dog, detectedIntent: Exclude<AssistantIntent, 'emergency'>) {
  const notes = [];

  if (detectedIntent === 'feeding' && dog.feeding_preferences) {
    notes.push(`feeding preferences: ${dog.feeding_preferences}`);
  }

  if (dog.allergies) {
    notes.push(`allergies: ${dog.allergies}`);
  }

  if ((detectedIntent === 'vaccination' || detectedIntent === 'unknown') && dog.vaccination_history) {
    notes.push(`vaccination history: ${dog.vaccination_history}`);
  }

  if (dog.medical_notes) {
    notes.push(`medical notes: ${dog.medical_notes}`);
  }

  if (dog.special_conditions) {
    notes.push(`special conditions: ${dog.special_conditions}`);
  }

  return notes;
}

export function getRelevantReminderContext(
  reminders: Reminder[],
  detectedIntent: Exclude<AssistantIntent, 'emergency'>,
) {
  const reminderTypes = detectedIntent === 'unknown' ? undefined : intentReminderTypes[detectedIntent];
  const openReminders = reminders.filter(isOpenReminder);
  const relevantReminders = reminderTypes
    ? openReminders.filter((reminder) => reminderTypes.includes(reminder.type))
    : openReminders;

  return relevantReminders.sort(compareReminderSchedule).slice(0, 3);
}

function formatReminderContext(reminders: Reminder[]) {
  if (reminders.length === 0) {
    return 'No matching open reminders are currently loaded for this dog.';
  }

  return `Relevant reminders loaded for context: ${reminders
    .map((reminder) => {
      const typeLabel = reminderTypeLabels[reminder.type] ?? reminder.type;
      return `${reminder.title} (${typeLabel}, ${formatReminderDateTime(reminder.scheduled_at)})`;
    })
    .join('; ')}.`;
}

export function buildMockAiResponse({
  question,
  dog,
  detectedIntent,
  reminders,
}: BuildMockResponseInput): AssistantResponse {
  const dogContext = compactDogContext(dog);
  const careNotes = dogCareNotes(dog, detectedIntent);
  const relevantReminders = getRelevantReminderContext(reminders, detectedIntent);
  const intentLabel = intentLabels[detectedIntent];
  const profileSentence =
    dogContext.length > 0
      ? `${dog.name} is ${dogContext.join(', ')}.`
      : `${dog.name}'s profile is selected, with room to add more care details.`;
  const careNotesSentence =
    careNotes.length > 0
      ? `This mock response would consider ${careNotes.join('; ')}.`
      : 'This mock response would use the selected dog profile and any available reminders.';
  const questionEcho = question.trim().endsWith('?') ? 'question' : 'care note';

  return {
    message: `${profileSentence} Detected intent: ${intentLabel}. ${careNotesSentence} ${formatReminderContext(
      relevantReminders,
    )} This is a beta mock/demo response for your ${questionEcho}; no real AI provider was called.`,
    response_source: 'mock',
    is_emergency: false,
    detected_intent: detectedIntent,
    disclaimer: DOGCARE_DISCLAIMER,
  };
}
