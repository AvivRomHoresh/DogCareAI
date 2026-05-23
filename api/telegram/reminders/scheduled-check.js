import { createClient } from '@supabase/supabase-js';

const FALLBACK_TIME_ZONE = 'Asia/Jerusalem';
const MAX_USERS_PER_RUN = 25;
const MAX_NOTIFICATIONS_PER_RUN = 25;
const MAX_NOTIFICATIONS_PER_USER = 5;
const OVERDUE_LOOKBACK_HOURS = 24;
const DOG_EMOJI = '\u{1F436}';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function buildResult(success, message, counts = {}) {
  return {
    success,
    message,
    users_checked: counts.usersChecked ?? 0,
    reminders_checked: counts.remindersChecked ?? 0,
    sent: counts.sent ?? 0,
    skipped_duplicate: counts.skippedDuplicate ?? 0,
    skipped: counts.skipped ?? 0,
    capped: counts.capped ?? false,
    diagnostic: counts.diagnostic ?? null,
  };
}

function getSafeSupabaseDiagnostic(prefix, error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const status = typeof error?.status === 'number' ? error.status : null;

  if (code && /^[A-Za-z0-9_]+$/.test(code)) {
    return `${prefix}_${code}`;
  }

  if (status === 401 || status === 403) {
    return `${prefix}_auth`;
  }

  return `${prefix}_unknown`;
}

function decodeJwtPayload(value) {
  if (typeof value !== 'string' || value.split('.').length !== 3) {
    return null;
  }

  try {
    const [, payload] = value.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getServiceRoleKeyDiagnostic(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'service_role_key_missing';
  }

  const trimmed = value.trim();
  const jwtPayload = decodeJwtPayload(trimmed);

  if (jwtPayload && jwtPayload.role !== 'service_role') {
    return 'service_role_key_not_service_role_jwt';
  }

  if (!jwtPayload && /^(anon|publishable)[._-]/i.test(trimmed)) {
    return 'service_role_key_looks_like_anon_or_publishable';
  }

  return null;
}

function getCronSecret(req) {
  const header = req.headers['x-telegram-cron-secret'] ?? req.headers['X-Telegram-Cron-Secret'];

  if (Array.isArray(header)) {
    return header[0]?.trim() || null;
  }

  return typeof header === 'string' && header.trim() ? header.trim() : null;
}

function getNotifyWindowEnd(now, notifyMinutesBefore) {
  return new Date(now.getTime() + notifyMinutesBefore * 60 * 1000);
}

function getOverdueLookbackStart(now) {
  return new Date(now.getTime() - OVERDUE_LOOKBACK_HOURS * 60 * 60 * 1000);
}

function getNotificationKind(scheduledAt, now) {
  return scheduledAt > now ? 'reminder_upcoming' : 'reminder_missed';
}

function formatReminderTime(value) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: FALLBACK_TIME_ZONE,
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

function truncateText(value, maxLength = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function buildTelegramMessage({ dogName, notificationKind, reminder, scheduledAt }) {
  const safeDogName = dogName || 'Your dog';
  const title = truncateText(reminder.title || 'Care reminder');

  if (notificationKind === 'reminder_missed') {
    return [
      `${DOG_EMOJI} DogCareAI Missed Reminder`,
      `${safeDogName} missed a reminder:`,
      title,
      `Scheduled for: ${formatReminderTime(scheduledAt)}`,
    ].join('\n');
  }

  return [
    `${DOG_EMOJI} DogCareAI Reminder`,
    `${safeDogName} has an upcoming reminder:`,
    title,
    `Time: ${formatReminderTime(scheduledAt)}`,
  ].join('\n');
}

async function sendTelegramMessage({ botToken, chatId, text }) {
  let response;

  try {
    response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch {
    return { ok: false, messageId: null, diagnosticCode: 'telegram_fetch_exception' };
  }

  if (!response.ok) {
    return { ok: false, messageId: null, diagnosticCode: 'telegram_send_failed' };
  }

  const payload = await response.json().catch(() => null);

  return {
    ok: payload?.ok === true,
    messageId: payload?.result?.message_id ? String(payload.result.message_id) : null,
    diagnosticCode: payload?.ok === true ? null : 'telegram_send_failed',
  };
}

async function hasExistingDelivery({ supabase, userId, reminderId, notificationKind, reminderScheduledAt }) {
  let result;

  try {
    result = await supabase
      .from('telegram_notification_deliveries')
      .select('id')
      .eq('user_id', userId)
      .eq('reminder_id', reminderId)
      .eq('notification_kind', notificationKind)
      .eq('reminder_scheduled_at', reminderScheduledAt)
      .maybeSingle();
  } catch {
    return false;
  }

  const { data, error } = result;

  if (error) {
    return false;
  }

  return Boolean(data);
}

async function recordDelivery({ supabase, delivery }) {
  let result;

  try {
    result = await supabase.from('telegram_notification_deliveries').insert(delivery);
  } catch {
    return { recorded: false, duplicate: false, diagnosticCode: 'delivery_record_exception' };
  }

  const { error } = result;

  if (!error) {
    return { recorded: true, duplicate: false, diagnosticCode: null };
  }

  if (error.code === '23505') {
    return { recorded: false, duplicate: true, diagnosticCode: 'duplicate_delivery' };
  }

  return { recorded: false, duplicate: false, diagnosticCode: 'delivery_record_failed' };
}

async function loadDogNamesById({ supabase, userId, reminders }) {
  const dogIds = [...new Set(reminders.map((reminder) => reminder.dog_id).filter(Boolean))];
  const dogNamesById = new Map();

  if (dogIds.length === 0) {
    return dogNamesById;
  }

  const { data } = await supabase
    .from('dogs')
    .select('id,name,user_id')
    .eq('user_id', userId)
    .in('id', dogIds);

  for (const dog of data ?? []) {
    if (dog.user_id === userId) {
      dogNamesById.set(dog.id, dog.name);
    }
  }

  return dogNamesById;
}

async function processReminder({ supabase, botToken, chatId, userId, dogNamesById, reminder, now }) {
  const scheduledAt = new Date(reminder.scheduled_at);

  if (Number.isNaN(scheduledAt.getTime())) {
    return { sent: false, duplicate: false, diagnosticCode: 'invalid_scheduled_at' };
  }

  const notificationKind = getNotificationKind(scheduledAt, now);
  const reminderScheduledAt = scheduledAt.toISOString();
  const alreadySent = await hasExistingDelivery({
    supabase,
    userId,
    reminderId: reminder.id,
    notificationKind,
    reminderScheduledAt,
  });

  if (alreadySent) {
    return { sent: false, duplicate: true, diagnosticCode: 'duplicate_delivery' };
  }

  let messageText;

  try {
    messageText = buildTelegramMessage({
      dogName: dogNamesById.get(reminder.dog_id),
      notificationKind,
      reminder,
      scheduledAt,
    });
  } catch {
    return { sent: false, duplicate: false, diagnosticCode: 'message_format_failed' };
  }

  const telegramResult = await sendTelegramMessage({
    botToken,
    chatId,
    text: messageText,
  });

  if (!telegramResult.ok) {
    return {
      sent: false,
      duplicate: false,
      diagnosticCode: telegramResult.diagnosticCode ?? 'telegram_send_failed',
    };
  }

  const deliveryResult = await recordDelivery({
    supabase,
    delivery: {
      user_id: userId,
      dog_id: reminder.dog_id,
      reminder_id: reminder.id,
      notification_kind: notificationKind,
      reminder_scheduled_at: reminderScheduledAt,
      telegram_message_id: telegramResult.messageId,
    },
  });

  if (deliveryResult.duplicate) {
    return { sent: false, duplicate: true, diagnosticCode: 'duplicate_delivery' };
  }

  if (!deliveryResult.recorded) {
    return {
      sent: false,
      duplicate: false,
      diagnosticCode: deliveryResult.diagnosticCode ?? 'delivery_record_failed',
    };
  }

  return { sent: true, duplicate: false, diagnosticCode: null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, buildResult(false, 'Method not allowed.'));
  }

  let stage = 'auth';
  const counts = {
    usersChecked: 0,
    remindersChecked: 0,
    sent: 0,
    skippedDuplicate: 0,
    skipped: 0,
    capped: false,
    diagnostic: null,
  };

  try {
    const expectedSecret = process.env.TELEGRAM_CRON_SECRET;
    const providedSecret = getCronSecret(req);

    if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
      return sendJson(res, 401, buildResult(false, 'Scheduled Telegram reminder check is not authorized.', counts));
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!supabaseUrl) {
      return sendJson(res, 500, buildResult(false, 'Scheduled Telegram reminder check is not configured.', {
        ...counts,
        diagnostic: 'supabase_url_missing',
      }));
    }

    const serviceRoleDiagnostic = getServiceRoleKeyDiagnostic(serviceRoleKey);

    if (serviceRoleDiagnostic) {
      return sendJson(res, 500, buildResult(false, 'Scheduled Telegram reminder check is not configured.', {
        ...counts,
        diagnostic: serviceRoleDiagnostic,
      }));
    }

    if (!botToken) {
      return sendJson(res, 500, buildResult(false, 'Scheduled Telegram reminder check is not configured.', {
        ...counts,
        diagnostic: 'missing_telegram_bot_token',
      }));
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    });

    stage = 'load_settings';
    const { data: settingsRows, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id,telegram_chat_id,telegram_enabled,reminder_notifications_enabled,notify_minutes_before')
      .eq('telegram_enabled', true)
      .eq('reminder_notifications_enabled', true)
      .not('telegram_chat_id', 'is', null)
      .limit(MAX_USERS_PER_RUN);

    if (settingsError) {
      return sendJson(res, 500, buildResult(false, 'Scheduled Telegram settings could not be loaded.', {
        ...counts,
        diagnostic: getSafeSupabaseDiagnostic('load_settings_failed', settingsError),
      }));
    }

    const now = new Date();

    for (const settings of settingsRows ?? []) {
      if (counts.sent >= MAX_NOTIFICATIONS_PER_RUN) {
        counts.capped = true;
        break;
      }

      const userId = settings.user_id;
      const chatId = typeof settings.telegram_chat_id === 'string' ? settings.telegram_chat_id.trim() : '';

      if (!userId || !chatId) {
        counts.skipped += 1;
        continue;
      }

      counts.usersChecked += 1;

      try {
        const notifyMinutesBefore = [0, 15, 30, 60].includes(settings.notify_minutes_before)
          ? settings.notify_minutes_before
          : 15;
        const windowEnd = getNotifyWindowEnd(now, notifyMinutesBefore);
        const overdueStart = getOverdueLookbackStart(now);

        stage = 'load_reminders';
        const { data: reminders, error: remindersError } = await supabase
          .from('reminders')
          .select('id,user_id,dog_id,title,type,scheduled_at,state')
          .eq('user_id', userId)
          .neq('state', 'completed')
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', overdueStart.toISOString())
          .lte('scheduled_at', windowEnd.toISOString())
          .order('scheduled_at', { ascending: true });

        if (remindersError) {
          counts.skipped += 1;
          counts.diagnostic = counts.diagnostic ?? getSafeSupabaseDiagnostic('load_reminders_failed', remindersError);
          continue;
        }

        const relevantReminders = reminders ?? [];
        counts.remindersChecked += relevantReminders.length;

        stage = 'load_dogs';
        const dogNamesById = await loadDogNamesById({ supabase, userId, reminders: relevantReminders });
        let userSent = 0;

        for (const reminder of relevantReminders) {
          if (counts.sent >= MAX_NOTIFICATIONS_PER_RUN || userSent >= MAX_NOTIFICATIONS_PER_USER) {
            counts.capped = true;
            break;
          }

          if (reminder.user_id !== userId) {
            counts.skipped += 1;
            continue;
          }

          stage = 'send_telegram';
          const result = await processReminder({
            supabase,
            botToken,
            chatId,
            userId,
            dogNamesById,
            reminder,
            now,
          }).catch(() => ({ sent: false, duplicate: false, diagnosticCode: 'reminder_processing_failed' }));

          if (result.sent) {
            counts.sent += 1;
            userSent += 1;
            continue;
          }

          if (result.duplicate) {
            counts.skippedDuplicate += 1;
          } else {
            counts.skipped += 1;
            counts.diagnostic = counts.diagnostic ?? result.diagnosticCode ?? 'reminder_skipped';
          }
        }
      } catch {
        counts.skipped += 1;
        counts.diagnostic = counts.diagnostic ?? 'user_processing_failed';
      }
    }

    const message =
      counts.sent > 0
        ? `Scheduled Telegram reminder check complete. Sent ${counts.sent} notification${counts.sent === 1 ? '' : 's'}.`
        : 'Scheduled Telegram reminder check complete. No new notifications were sent.';

    return sendJson(res, 200, buildResult(true, message, counts));
  } catch {
    return sendJson(
      res,
      500,
      buildResult(false, `Scheduled Telegram reminder check failed during: ${stage}.`, {
        ...counts,
        diagnostic: 'scheduled_check_failed',
      }),
    );
  }
}
