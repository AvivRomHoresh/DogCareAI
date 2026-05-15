export const EMERGENCY_KEYWORDS = [
  'bleeding',
  'blood loss',
  'poison',
  'poisoned',
  'poisoning',
  'toxic',
  'choking',
  'choke',
  'seizure',
  'seizures',
  'unconscious',
  'collapsed',
  'collapse',
  'difficulty breathing',
  'trouble breathing',
  'not breathing',
  'can not breathe',
  "can't breathe",
  'cannot breathe',
  'דימום',
  'מדמם',
  'רעל',
  'הרעלה',
  'מורעל',
  'חנק',
  'נחנק',
  'פרכוס',
  'פרכוסים',
  'איבוד הכרה',
  'חסר הכרה',
  'לא נושם',
  'קשיי נשימה',
] as const;

function normalizeEmergencyText(text: string) {
  return text.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function containsEmergencyKeyword(text: string) {
  const normalizedText = normalizeEmergencyText(text);

  return EMERGENCY_KEYWORDS.some((keyword) =>
    normalizedText.includes(normalizeEmergencyText(keyword)),
  );
}
