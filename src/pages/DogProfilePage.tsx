import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { DogAvatar } from '../components/DogAvatar';
import { DogProfileIcon } from '../components/icons/DogProfileIcon';
import { PageCard } from '../components/PageCard';
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

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100';

const textareaClassName =
  'min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100';

const accentSwatchClasses: Record<string, string> = {
  'static-amber': 'bg-gradient-to-br from-amber-100 to-orange-200',
  'static-rose': 'bg-gradient-to-br from-rose-100 to-pink-200',
  'static-sky': 'bg-gradient-to-br from-sky-100 to-cyan-200',
  'static-teal': 'bg-gradient-to-br from-teal-100 to-emerald-200',
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

function getAccentSwatchClass(value: string) {
  return accentSwatchClasses[value] ?? accentSwatchClasses['static-teal'];
}

function validateDogForm(form: DogFormState) {
  const errors: Partial<Record<keyof DogFormState, string>> = {};
  const age = parseOptionalNumber(form.age);
  const weight = parseOptionalNumber(form.weight);

  const trimmedName = form.name.trim();

  if (!trimmedName) {
    errors.name = "Please enter your dog's name.";
  } else if (trimmedName.length < 2) {
    errors.name = 'Dog name must be at least 2 characters.';
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
  const isNewProfile = selectedDogId === 'new' || !selectedDog;
  const pageSubtitle = isNewProfile
    ? 'Create your dog profile now'
    : `Update ${selectedDog.name}'s profile details`;

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

  return (
    <div className="space-y-4">
      <section className="space-y-3 bg-transparent py-2 text-center">
        <h1 className="inline-flex items-center justify-center gap-3 text-4xl font-extrabold tracking-normal text-slate-950 sm:text-5xl">
          <DogProfileIcon className="h-9 w-9 text-teal-700 sm:h-10 sm:w-10" />
          <span>Dog Profile</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600">{pageSubtitle}</p>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-teal-950/5 backdrop-blur sm:p-5">
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-center">
          <label className="flex w-full flex-col gap-1 text-sm font-semibold text-slate-700 sm:max-w-sm">
            Choose profile
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
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
            className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add another dog
          </button>
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-slate-500">
          {dogs.length === 0
            ? 'Your first profile will become the active dog context.'
            : activeDog
              ? `Active dog context: ${activeDog.name}`
              : 'Select a profile to make it the active dog context.'}
        </p>
      </section>

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

      <section className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm shadow-teal-950/5 backdrop-blur">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-stone-100 bg-stone-50/80 p-5 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Dog avatar</p>
              <DogAvatar
                breed={form.breed}
                className="mx-auto mt-4"
                name={form.name}
                profileImageUrl={form.profile_image_url}
                size="xl"
                weight={parseOptionalNumber(form.weight)}
              />
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Breed-inspired local illustration. Photo upload is intentionally deferred.
              </p>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar accent</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                {STATIC_AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.value}
                    type="button"
                    aria-label={`Use ${avatar.label} avatar accent`}
                    title={avatar.label}
                    onClick={() => updateField('profile_image_url', avatar.value)}
                    className={[
                      'h-8 w-8 rounded-full border text-[0px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
                      form.profile_image_url === avatar.value
                        ? 'border-teal-500 ring-2 ring-teal-100'
                        : 'border-white/80 hover:border-teal-200',
                      getAccentSwatchClass(avatar.value),
                    ].join(' ')}
                  >
                    {avatar.label}
                  </button>
                ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dog name" error={fieldErrors.name} required>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className={inputClassName}
                  maxLength={80}
                />
              </Field>

              <Field label="Breed">
                <input
                  value={form.breed}
                  onChange={(event) => updateField('breed', event.target.value)}
                  className={inputClassName}
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
                  className={inputClassName}
                />
              </Field>

              <Field label="Weight" error={fieldErrors.weight} helperText="Weight is in kilograms.">
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={form.weight}
                  onChange={(event) => updateField('weight', event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Gender" error={fieldErrors.gender}>
                <select
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>

              <Field
                label="Activity level"
                error={fieldErrors.activity_level}
                helperText="Low: mostly calm / short walks. Medium: regular daily walks. High: very active dog."
              >
                <select
                  value={form.activity_level}
                  onChange={(event) => updateField('activity_level', event.target.value)}
                  className={inputClassName}
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
                className={textareaClassName}
                maxLength={1200}
              />
            </Field>

            <Field label="Allergies or sensitivities">
              <textarea
                value={form.allergies}
                onChange={(event) => updateField('allergies', event.target.value)}
                className={textareaClassName}
                maxLength={1000}
              />
            </Field>

            <Field label="Food preferences">
              <textarea
                value={form.feeding_preferences}
                onChange={(event) => updateField('feeding_preferences', event.target.value)}
                className={textareaClassName}
                maxLength={1000}
              />
            </Field>

            <Field label="Vaccination history">
              <textarea
                value={form.vaccination_history}
                onChange={(event) => updateField('vaccination_history', event.target.value)}
                className={textareaClassName}
                maxLength={1000}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Special conditions">
                <textarea
                  value={form.special_conditions}
                  onChange={(event) => updateField('special_conditions', event.target.value)}
                  className={textareaClassName}
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

          <div className="flex flex-col items-center justify-center gap-3 border-t border-stone-100 pt-5 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving || !hasSupabaseConfig}
              className="w-full rounded-2xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
            >
              {isSaving ? 'Saving...' : selectedDog ? 'Update dog profile' : 'Save dog profile'}
            </button>

            {selectedDog ? (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isSaving}
                className="w-full rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
