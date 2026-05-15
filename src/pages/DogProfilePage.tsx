import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import { supabase } from '../lib/supabaseClient';
import type { Dog, DogActivityLevel, DogGender } from '../types/dog';
import { STATIC_AVATAR_OPTIONS } from '../types/dog';

type DogFormState = {
  name: string;
  breed: string;
  age: string;
  weight: string;
  gender: '' | DogGender;
  medical_notes: string;
  allergies: string;
  vaccination_history: string;
  feeding_preferences: string;
  activity_level: '' | DogActivityLevel;
  special_conditions: string;
  profile_image_url: string;
};

const emptyForm: DogFormState = {
  name: '',
  breed: '',
  age: '',
  weight: '',
  gender: '',
  medical_notes: '',
  allergies: '',
  vaccination_history: '',
  feeding_preferences: '',
  activity_level: '',
  special_conditions: '',
  profile_image_url: STATIC_AVATAR_OPTIONS[0].value,
};

const avatarClasses: Record<string, string> = {
  'static-teal': 'border-teal-200 bg-teal-100 text-teal-900',
  'static-amber': 'border-amber-200 bg-amber-100 text-amber-900',
  'static-sky': 'border-sky-200 bg-sky-100 text-sky-900',
  'static-rose': 'border-rose-200 bg-rose-100 text-rose-900',
};

function dogToForm(dog: Dog): DogFormState {
  return {
    name: dog.name ?? '',
    breed: dog.breed ?? '',
    age: dog.age === null ? '' : String(dog.age),
    weight: dog.weight === null ? '' : String(dog.weight),
    gender: dog.gender ?? '',
    medical_notes: dog.medical_notes ?? '',
    allergies: dog.allergies ?? '',
    vaccination_history: dog.vaccination_history ?? '',
    feeding_preferences: dog.feeding_preferences ?? '',
    activity_level: dog.activity_level ?? '',
    special_conditions: dog.special_conditions ?? '',
    profile_image_url: dog.profile_image_url || STATIC_AVATAR_OPTIONS[0].value,
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

function validateDogForm(form: DogFormState) {
  const errors: Partial<Record<keyof DogFormState, string>> = {};
  const age = parseOptionalNumber(form.age);
  const weight = parseOptionalNumber(form.weight);

  if (!form.name.trim()) {
    errors.name = "Please enter your dog's name.";
  }

  if (age !== null && (!Number.isFinite(age) || age < 0 || age > 40)) {
    errors.age = 'Age must be empty or between 0 and 40.';
  }

  if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 200)) {
    errors.weight = 'Weight must be empty or greater than 0 and no more than 200.';
  }

  if (form.gender && !['male', 'female', 'unknown'].includes(form.gender)) {
    errors.gender = 'Choose male, female, or unknown.';
  }

  if (form.activity_level && !['low', 'medium', 'high'].includes(form.activity_level)) {
    errors.activity_level = 'Choose low, medium, or high.';
  }

  return errors;
}

export function DogProfilePage() {
  const { hasSupabaseConfig, user } = useAuth();
  const {
    activeDog,
    activeDogId,
    dogs,
    error: loadError,
    isLoading,
    refreshDogs,
    setActiveDogId,
  } = useDogs();
  const [selectedDogId, setSelectedDogId] = useState<string>('new');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [form, setForm] = useState<DogFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DogFormState, string>>>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDog = useMemo(
    () => dogs.find((dog) => dog.id === selectedDogId) ?? null,
    [dogs, selectedDogId],
  );

  useEffect(() => {
    if (isCreatingNew) {
      return;
    }

    if (activeDogId && dogs.some((dog) => dog.id === activeDogId)) {
      setSelectedDogId(activeDogId);
      return;
    }

    if (dogs.length > 0) {
      setSelectedDogId(dogs[0].id);
      return;
    }

    setSelectedDogId('new');
  }, [activeDogId, dogs, isCreatingNew]);

  useEffect(() => {
    setFeedback(null);
    setFieldErrors({});

    if (selectedDog) {
      setForm(dogToForm(selectedDog));
    } else {
      setForm(emptyForm);
    }
  }, [selectedDog]);

  const updateField = (field: keyof DogFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const startNewDog = () => {
    setIsCreatingNew(true);
    setSelectedDogId('new');
    setForm(emptyForm);
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

    const nextErrors = validateDogForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ tone: 'error', message: 'Please fix the highlighted fields before saving.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload = {
      name: form.name.trim(),
      breed: form.breed.trim() || null,
      age: parseOptionalNumber(form.age),
      weight: parseOptionalNumber(form.weight),
      gender: form.gender || null,
      medical_notes: form.medical_notes.trim() || null,
      allergies: form.allergies.trim() || null,
      vaccination_history: form.vaccination_history.trim() || null,
      feeding_preferences: form.feeding_preferences.trim() || null,
      activity_level: form.activity_level || null,
      special_conditions: form.special_conditions.trim() || null,
      profile_image_url: form.profile_image_url || STATIC_AVATAR_OPTIONS[0].value,
    };

    const result =
      selectedDogId === 'new'
        ? await supabase
            .from('dogs')
            .insert({ ...payload, user_id: user.id })
            .select('*')
            .single()
        : await supabase.from('dogs').update(payload).eq('id', selectedDogId).select('*').single();

    if (result.error) {
      setFeedback({ tone: 'error', message: result.error.message });
      setIsSaving(false);
      return;
    }

    const savedDog = result.data as Dog;
    await refreshDogs();
    setIsCreatingNew(false);
    setSelectedDogId(savedDog.id);
    setActiveDogId(savedDog.id);
    setFeedback({ tone: 'success', message: 'Dog profile saved successfully.' });
    setIsSaving(false);
  };

  const handleArchive = async () => {
    if (!selectedDog || isSaving || !supabase) {
      return;
    }

    const confirmed = window.confirm(`Archive ${selectedDog.name}? This hides the profile without deleting it.`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('dogs')
      .update({ is_archived: true })
      .eq('id', selectedDog.id);

    if (error) {
      setFeedback({ tone: 'error', message: error.message });
      setIsSaving(false);
      return;
    }

    const remainingDogs = dogs.filter((dog) => dog.id !== selectedDog.id);
    await refreshDogs();
    const nextDogId = remainingDogs[0]?.id ?? null;
    setIsCreatingNew(false);
    setSelectedDogId(nextDogId ?? 'new');
    setActiveDogId(nextDogId);
    setFeedback({ tone: 'success', message: 'Dog profile archived.' });
    setIsSaving(false);
  };

  const selectedAvatarClass = avatarClasses[form.profile_image_url] ?? avatarClasses['static-teal'];

  return (
    <div className="space-y-4">
      <PageCard
        title="Dog Profile"
        description="Create or update the dog profile that powers the beta care context."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{dogs.length === 1 ? '1 active dog' : `${dogs.length} active dogs`}</StatusBadge>
          {activeDog ? <StatusBadge tone="mock">Selected: {activeDog.name}</StatusBadge> : null}
        </div>
      </PageCard>

      {!hasSupabaseConfig ? (
        <PageCard
          title="Supabase setup needed"
          description="Add the frontend-safe Supabase URL and anon key in .env.local to use dog profiles."
        />
      ) : null}

      {loadError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load dog profiles. {loadError}
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading dog profiles...
        </section>
      ) : null}

      {!isLoading && dogs.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <h3 className="text-base font-semibold">Create your dog profile to get started.</h3>
          <p className="mt-2 leading-6">
            Add one dog now. You can add more profiles later and switch the active dog from the header.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
            Profile
            <select
              value={selectedDogId}
              onChange={(event) => {
                const nextDogId = event.target.value;
                if (nextDogId === 'new') {
                  startNewDog();
                  return;
                }

                setIsCreatingNew(false);
                setSelectedDogId(nextDogId);
                setActiveDogId(nextDogId);
              }}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
              disabled={isSaving}
            >
              <option value="new">New dog profile</option>
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={startNewDog}
            disabled={isSaving}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add another dog
          </button>
        </div>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-semibold text-slate-800">Static avatar</p>
              <div
                className={`mt-3 flex h-24 w-24 items-center justify-center rounded-2xl border text-3xl font-bold ${selectedAvatarClass}`}
                aria-hidden="true"
              >
                {(form.name.trim()[0] || 'D').toUpperCase()}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STATIC_AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.value}
                    type="button"
                    onClick={() => updateField('profile_image_url', avatar.value)}
                    className={[
                      'rounded-xl border px-3 py-2 text-sm font-medium transition',
                      form.profile_image_url === avatar.value
                        ? 'border-teal-300 bg-teal-50 text-teal-900'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
                    ].join(' ')}
                  >
                    {avatar.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">File upload is intentionally deferred for beta.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dog name" error={fieldErrors.name} required>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                  maxLength={80}
                />
              </Field>

              <Field label="Breed">
                <input
                  value={form.breed}
                  onChange={(event) => updateField('breed', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                  maxLength={120}
                />
              </Field>

              <Field label="Age" error={fieldErrors.age}>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={form.age}
                  onChange={(event) => updateField('age', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </Field>

              <Field label="Weight" error={fieldErrors.weight}>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={form.weight}
                  onChange={(event) => updateField('weight', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2"
                />
              </Field>

              <Field label="Gender" error={fieldErrors.gender}>
                <select
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                >
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>

              <Field label="Activity level" error={fieldErrors.activity_level}>
                <select
                  value={form.activity_level}
                  onChange={(event) => updateField('activity_level', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                >
                  <option value="">Not specified</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Health notes">
              <textarea
                value={form.medical_notes}
                onChange={(event) => updateField('medical_notes', event.target.value)}
                className="min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2"
                maxLength={1200}
              />
            </Field>

            <Field label="Allergies or sensitivities">
              <textarea
                value={form.allergies}
                onChange={(event) => updateField('allergies', event.target.value)}
                className="min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2"
                maxLength={1000}
              />
            </Field>

            <Field label="Food preferences">
              <textarea
                value={form.feeding_preferences}
                onChange={(event) => updateField('feeding_preferences', event.target.value)}
                className="min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2"
                maxLength={1000}
              />
            </Field>

            <Field label="Vaccination history">
              <textarea
                value={form.vaccination_history}
                onChange={(event) => updateField('vaccination_history', event.target.value)}
                className="min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2"
                maxLength={1000}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Special conditions">
                <textarea
                  value={form.special_conditions}
                  onChange={(event) => updateField('special_conditions', event.target.value)}
                  className="min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2"
                  maxLength={1200}
                />
              </Field>
            </div>
          </div>

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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSaving || !hasSupabaseConfig}
              className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isSaving ? 'Saving...' : selectedDog ? 'Update dog profile' : 'Save dog profile'}
            </button>

            {selectedDog ? (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isSaving}
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Archive profile
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
};

function Field({ children, error, label, required = false }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
    </label>
  );
}
