import { containsEmergencyKeyword } from '../constants/emergencyKeywords';

export type AssistantIntent =
  | 'feeding'
  | 'vaccination'
  | 'walking'
  | 'routine'
  | 'behavior'
  | 'emergency'
  | 'unknown';

const intentKeywords: Record<Exclude<AssistantIntent, 'emergency' | 'unknown'>, string[]> = {
  feeding: [
    'food',
    'eat',
    'eating',
    'feed',
    'feeding',
    'nutrition',
    'diet',
    'allergy',
    'allergies',
    'treat',
    'אוכל',
    'האכלה',
    'תזונה',
    'אלרגיה',
    'אלרגיות',
  ],
  vaccination: [
    'vaccine',
    'vaccination',
    'shot',
    'shots',
    'vet',
    'veterinarian',
    'medication',
    'medicine',
    'medical',
    'חיסון',
    'חיסונים',
    'וטרינר',
    'תרופה',
    'תרופות',
    'רפואי',
  ],
  walking: [
    'walk',
    'walking',
    'exercise',
    'activity',
    'active',
    'play',
    'טיול',
    'הליכה',
    'פעילות',
    'משחק',
  ],
  routine: [
    'reminder',
    'reminders',
    'schedule',
    'routine',
    'daily',
    'weekly',
    'plan',
    'תזכורת',
    'תזכורות',
    'שגרה',
    'לו"ז',
    'יומי',
    'שבועי',
  ],
  behavior: [
    'barking',
    'anxiety',
    'aggression',
    'aggressive',
    'behavior',
    'training',
    'fear',
    'נביחות',
    'נובח',
    'חרדה',
    'תוקפנות',
    'התנהגות',
    'אילוף',
    'פחד',
  ],
};

function normalizeQuestion(question: string) {
  return question.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function getDetectedIntent(question: string): AssistantIntent {
  if (containsEmergencyKeyword(question)) {
    return 'emergency';
  }

  const normalizedQuestion = normalizeQuestion(question);

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((keyword) => normalizedQuestion.includes(normalizeQuestion(keyword)))) {
      return intent as AssistantIntent;
    }
  }

  return 'unknown';
}
