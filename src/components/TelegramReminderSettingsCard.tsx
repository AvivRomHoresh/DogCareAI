import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

type TelegramSettingsForm = {
  telegram_chat_id: string;
  telegram_enabled: boolean;
  reminder_notifications_enabled: boolean;
  notify_minutes_before: 0 | 15 | 30 | 60;
};

type NotificationSettingsRow = Omit<TelegramSettingsForm, 'telegram_chat_id'> & {
  telegram_chat_id: string | null;
  user_id: string;
};

type Feedback = {
  tone: 'success' | 'error';
  message: string;
};

const defaultForm: TelegramSettingsForm = {
  telegram_chat_id: '',
  telegram_enabled: false,
  reminder_notifications_enabled: false,
  notify_minutes_before: 15,
};

const notifyBeforeOptions: Array<{ value: TelegramSettingsForm['notify_minutes_before']; label: string }> = [
  { value: 0, label: 'Due now only' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
];

function normalizeForm(form: TelegramSettingsForm): TelegramSettingsForm {
  return {
    ...form,
    telegram_chat_id: form.telegram_chat_id.trim(),
  };
}

function validateSettings(form: TelegramSettingsForm) {
  const normalized = normalizeForm(form);

  if (normalized.telegram_enabled && !normalized.telegram_chat_id) {
    return 'Enter a Telegram chat ID before enabling Telegram reminders.';
  }

  if (normalized.reminder_notifications_enabled && !normalized.telegram_enabled) {
    return 'Enable Telegram before enabling reminder notifications.';
  }

  if (!notifyBeforeOptions.some((option) => option.value === normalized.notify_minutes_before)) {
    return 'Choose a valid notify-before option.';
  }

  return null;
}

function areFormsEqual(a: TelegramSettingsForm, b: TelegramSettingsForm) {
  const normalizedA = normalizeForm(a);
  const normalizedB = normalizeForm(b);

  return (
    normalizedA.telegram_chat_id === normalizedB.telegram_chat_id
    && normalizedA.telegram_enabled === normalizedB.telegram_enabled
    && normalizedA.reminder_notifications_enabled === normalizedB.reminder_notifications_enabled
    && normalizedA.notify_minutes_before === normalizedB.notify_minutes_before
  );
}

export function TelegramReminderSettingsCard() {
  const { hasSupabaseConfig, session, user } = useAuth();
  const [form, setForm] = useState<TelegramSettingsForm>(defaultForm);
  const [savedForm, setSavedForm] = useState<TelegramSettingsForm | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [hasSavedSettings, setHasSavedSettings] = useState(false);

  const isDirty = useMemo(() => {
    if (!savedForm) {
      return !areFormsEqual(form, defaultForm);
    }

    return !areFormsEqual(form, savedForm);
  }, [form, savedForm]);

  const loadSettings = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !user) {
      setForm(defaultForm);
      setSavedForm(defaultForm);
      setHasSavedSettings(false);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from('notification_settings')
      .select('telegram_chat_id,telegram_enabled,reminder_notifications_enabled,notify_minutes_before')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setFeedback({ tone: 'error', message: 'Could not load Telegram reminder settings.' });
      setIsLoading(false);
      return;
    }

    const nextForm = data
      ? {
          telegram_chat_id: typeof data.telegram_chat_id === 'string' ? data.telegram_chat_id : '',
          telegram_enabled: Boolean(data.telegram_enabled),
          reminder_notifications_enabled: Boolean(data.reminder_notifications_enabled),
          notify_minutes_before: notifyBeforeOptions.some((option) => option.value === data.notify_minutes_before)
            ? data.notify_minutes_before
            : 15,
        }
      : defaultForm;

    setForm(nextForm);
    setSavedForm(nextForm);
    setHasSavedSettings(Boolean(data));
    setIsLoading(false);
  }, [hasSupabaseConfig, user]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateField = <Key extends keyof TelegramSettingsForm>(field: Key, value: TelegramSettingsForm[Key]) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'telegram_enabled' && value === false) {
        next.reminder_notifications_enabled = false;
      }

      return next;
    });
    setFeedback(null);
  };

  const saveSettings = async () => {
    if (isSaving || !hasSupabaseConfig || !supabase || !user) {
      return;
    }

    const validationError = validateSettings(form);

    if (validationError) {
      setFeedback({ tone: 'error', message: validationError });
      return;
    }

    const normalized = normalizeForm(form);
    setIsSaving(true);
    setFeedback(null);

    const payload: NotificationSettingsRow = {
      user_id: user.id,
      telegram_chat_id: normalized.telegram_chat_id || null,
      telegram_enabled: normalized.telegram_enabled,
      reminder_notifications_enabled: normalized.reminder_notifications_enabled,
      notify_minutes_before: normalized.notify_minutes_before,
    };

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select('telegram_chat_id,telegram_enabled,reminder_notifications_enabled,notify_minutes_before')
      .single();

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: 'error', message: error.message });
      return;
    }

    const nextSavedForm = {
      telegram_chat_id: typeof data.telegram_chat_id === 'string' ? data.telegram_chat_id : '',
      telegram_enabled: Boolean(data.telegram_enabled),
      reminder_notifications_enabled: Boolean(data.reminder_notifications_enabled),
      notify_minutes_before: notifyBeforeOptions.some((option) => option.value === data.notify_minutes_before)
        ? data.notify_minutes_before
        : 15,
    };

    setForm(nextSavedForm);
    setSavedForm(nextSavedForm);
    setHasSavedSettings(true);
    setFeedback({ tone: 'success', message: 'Telegram reminder settings saved.' });
  };

  const sendTestMessage = async () => {
    if (isSendingTest) {
      return;
    }

    if (!session?.access_token) {
      setFeedback({ tone: 'error', message: 'Please sign in before sending a Telegram test message.' });
      return;
    }

    if (!hasSavedSettings) {
      setFeedback({ tone: 'error', message: 'Save Telegram settings before sending a test message.' });
      return;
    }

    if (isDirty) {
      setFeedback({ tone: 'error', message: 'Save your latest Telegram settings before sending a test message.' });
      return;
    }

    const validationError = validateSettings(form);

    if (validationError) {
      setFeedback({ tone: 'error', message: validationError });
      return;
    }

    if (!form.telegram_enabled || !form.telegram_chat_id.trim()) {
      setFeedback({ tone: 'error', message: 'Enable Telegram and save a chat ID before sending a test message.' });
      return;
    }

    setIsSendingTest(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      const message = payload?.message ?? 'Telegram test message could not be sent.';

      setFeedback({
        tone: payload?.success ? 'success' : 'error',
        message,
      });
    } catch {
      setFeedback({ tone: 'error', message: 'Telegram test message could not be sent. Please try again.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleNotifyBeforeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(event.target.value, 10);
    const nextValue = notifyBeforeOptions.find((option) => option.value === value)?.value ?? 15;
    updateField('notify_minutes_before', nextValue);
  };

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Telegram reminders</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Optional external reminders through a Telegram bot and chat ID. DogCareAI does not collect phone numbers.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-800">
          Optional
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Start the DogCareAI Telegram bot before sending a test message. Reminder delivery logic is not active yet; this
        card only saves settings and verifies the secure test-message connection.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <label className="block text-sm font-medium text-slate-700">
          Telegram chat ID
          <input
            value={form.telegram_chat_id}
            onChange={(event) => updateField('telegram_chat_id', event.target.value)}
            disabled={isLoading || isSaving || isSendingTest}
            className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-stone-100"
            placeholder="Example: 123456789"
            autoComplete="off"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Notify before
          <select
            value={form.notify_minutes_before}
            onChange={handleNotifyBeforeChange}
            disabled={isLoading || isSaving || isSendingTest}
            className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-stone-100"
          >
            {notifyBeforeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-white p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.telegram_enabled}
            onChange={(event) => updateField('telegram_enabled', event.target.checked)}
            disabled={isLoading || isSaving || isSendingTest}
            className="mt-1 h-4 w-4 rounded border-sky-300 text-teal-700"
          />
          <span>
            <span className="font-medium text-slate-900">Enable Telegram</span>
            <span className="block text-xs leading-5 text-slate-500">Requires a saved chat ID.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-white p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.reminder_notifications_enabled}
            onChange={(event) => updateField('reminder_notifications_enabled', event.target.checked)}
            disabled={isLoading || isSaving || isSendingTest || !form.telegram_enabled}
            className="mt-1 h-4 w-4 rounded border-sky-300 text-teal-700"
          />
          <span>
            <span className="font-medium text-slate-900">Enable reminder notifications</span>
            <span className="block text-xs leading-5 text-slate-500">Reminder sending arrives in the next step.</span>
          </span>
        </label>
      </div>

      {feedback ? (
        <div
          className={[
            'mt-4 rounded-2xl border px-4 py-3 text-sm',
            feedback.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800',
          ].join(' ')}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={saveSettings}
          disabled={isLoading || isSaving || isSendingTest || !hasSupabaseConfig}
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={sendTestMessage}
          disabled={isLoading || isSaving || isSendingTest || !hasSupabaseConfig}
          className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSendingTest ? 'Sending...' : 'Send test message'}
        </button>
      </div>
    </section>
  );
}
