export type DogGender = 'male' | 'female' | 'unknown';

export type DogActivityLevel = 'low' | 'medium' | 'high';

export type Dog = {
  id: string;
  user_id: string;
  name: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  gender: DogGender | null;
  profile_image_url: string | null;
  medical_notes: string | null;
  allergies: string | null;
  vaccination_history: string | null;
  feeding_preferences: string | null;
  activity_level: DogActivityLevel | null;
  special_conditions: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export const STATIC_AVATAR_OPTIONS = [
  { value: 'static-teal', label: 'Teal' },
  { value: 'static-amber', label: 'Amber' },
  { value: 'static-sky', label: 'Sky' },
  { value: 'static-rose', label: 'Rose' },
] as const;

export type StaticAvatarValue = (typeof STATIC_AVATAR_OPTIONS)[number]['value'];

