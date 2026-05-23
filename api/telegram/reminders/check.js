import { createClient } from '@supabase/supabase-js';

const FALLBACK_TIME_ZONE = 'Asia/Jerusalem';
const MAX_NOTIFICATIONS_PER_CHECK = 10;
const OVERDUE_LOOKBACK_HOURS = 24;
const MAX_REQUEST_BODY_CHARS = 4096;
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
    checked: counts.checked ?? 0,
    sent: counts.sent ?? 0,
    skipped_duplicate: counts.skippedDuplicate ?? 0,
    skipped: counts.skipped ?? 0,
  };
}

function getBearerToken(req) {
  const header = req.headers.authorization ?? req.headers.Authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
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

function getSafeTimeZone(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return FALLBACK_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

function formatReminderTime(value, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone,
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

function buildTelegramMessage({ dogName, notificationKind, reminder, scheduledAt, timeZone }) {
  const safeDogName = dogName || 'Your dog';
  const title = truncateText(reminder.title || 'Care reminder');

  if (notificationKind === 'reminder_missed') {
    return [
      `${DOG_EMOJI} DogCareAI Missed Reminder`,
      `${safeDogName} missed a reminder:`,
      title,
      `Scheduled for: ${formatReminderTime(scheduledAt, timeZone)}`,
    ].join('\n');
  }

  return [
    `${DOG_EMOJI} DogCareAI Reminder`,
    `${safeDogName} has an upcoming reminder:`,
    title,
    `Time: ${formatReminderTime(scheduledAt, timeZone)}`,
  ].join('\n');
}
async function readJsonBody(req) {
  const canUseBuffer = typeof Buffer !== 'undefined';

  if (req.body && typeof req.body === 'object' && (!canUseBuffer || !Buffer.isBuffer(req.body))) {
    return req.body;
  }

  if (canUseBuffer && Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8') || '{}');
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }

  if (typeof req.on !== 'function') {
    return {};
  }

  const body = await new Promise((resolve, reject) => {
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;

      if (rawBody.length > MAX_REQUEST_BODY_CHARS) {
        reject(new Error('request_body_too_large'));
      }
    });
    req.on('end', () => resolve(rawBody));
    req.on('error', reject);
  });

  return body ? JSON.parse(body) : {};
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, buildResult(false, 'Method not allowed.'));
  }

  let stage = 'read_body';

  try {
    let body = {};

    try {
      body = await readJsonBody(req);
    } catch {
      body = {};
    }

    const timeZone = getSafeTimeZone(body?.timeZone);
    stage = 'auth';
    const token = getBearerToken(req);

    if (!token) {
      return sendJson(res, 401, buildResult(false, 'Please sign in before checking Telegram reminders.'));
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return sendJson(res, 500, buildResult(false, 'Server Supabase configuration is missing.'));
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return sendJson(res, 500, buildResult(false, 'Telegram notifications are not configured on the server yet.'));
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return sendJson(res, 401, buildResult(false, 'Your session could not be verified. Please sign in again.'));
    }

    const userId = userData.user.id;
    stage = 'load_settings';
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id,telegram_chat_id,telegram_enabled,reminder_notifications_enabled,notify_minutes_before')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      return sendJson(res, 500, buildResult(false, 'Telegram settings could not be loaded. Please try again later.'));
    }

    if (!settings) {
      return sendJson(res, 400, buildResult(false, 'Telegram notification settings have not been saved yet.'));
    }

    if (!settings.telegram_enabled || !settings.reminder_notifications_enabled) {
      return sendJson(res, 400, buildResult(false, 'Telegram reminder notifications are not enabled for this account.'));
    }

    const chatId = typeof settings.telegram_chat_id === 'string' ? settings.telegram_chat_id.trim() : '';

    if (!chatId) {
      return sendJson(res, 400, buildResult(false, 'Telegram chat ID is missing. Save a chat ID before checking reminders.'));
    }

    const notifyMinutesBefore = [0, 15, 30, 60].includes(settings.notify_minutes_before)
      ? settings.notify_minutes_before
      : 15;
    const now = new Date();
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
      return sendJson(res, 500, buildResult(false, 'Reminders could not be loaded. Please try again later.'));
    }

    const relevantReminders = reminders ?? [];
    const dogIds = [...new Set(relevantReminders.map((reminder) => reminder.dog_id).filter(Boolean))];
    const dogNamesById = new Map();

    if (dogIds.length > 0) {
      stage = 'load_dogs';
      const { data: dogs } = await supabase.from('dogs').select('id,name').eq('user_id', userId).in('id', dogIds);

      for (const dog of dogs ?? []) {
        dogNamesById.set(dog.id, dog.name);
      }
    }

    const counts = {
      checked: relevantReminders.length,
      sent: 0,
      skippedDuplicate: 0,
      skipped: 0,
    };
    let lastDiagnosticCode = null;

    for (const reminder of relevantReminders) {
      try {
        const scheduledAt = new Date(reminder.scheduled_at);

        if (Number.isNaN(scheduledAt.getTime())) {
          counts.skipped += 1;
          continue;
        }

        const notificationKind = getNotificationKind(scheduledAt, now);
        const reminderScheduledAt = scheduledAt.toISOString();
        stage = 'record_delivery';
        const alreadySent = await hasExistingDelivery({
          supabase,
          userId,
          reminderId: reminder.id,
          notificationKind,
          reminderScheduledAt,
        });

        if (alreadySent) {
          counts.skippedDuplicate += 1;
          continue;
        }

        if (counts.sent >= MAX_NOTIFICATIONS_PER_CHECK) {
          counts.skipped += 1;
          continue;
        }

        stage = 'send_telegram';
        let messageText;

        try {
          messageText = buildTelegramMessage({
            dogName: dogNamesById.get(reminder.dog_id),
            notificationKind,
            reminder,
            scheduledAt,
            timeZone,
          });
        } catch {
          lastDiagnosticCode = 'message_format_failed';
          counts.skipped += 1;
          continue;
        }

        const telegramResult = await sendTelegramMessage({
          botToken,
          chatId,
          text: messageText,
        });

        if (!telegramResult.ok) {
          lastDiagnosticCode = telegramResult.diagnosticCode ?? 'telegram_send_failed';
          counts.skipped += 1;
          continue;
        }

        stage = 'record_delivery';
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
          counts.skippedDuplicate += 1;
          continue;
        }

        if (!deliveryResult.recorded) {
          lastDiagnosticCode = deliveryResult.diagnosticCode ?? 'delivery_record_failed';
          counts.skipped += 1;
          continue;
        }

        counts.sent += 1;
      } catch {
        lastDiagnosticCode = 'reminder_processing_failed';
        counts.skipped += 1;
      }
    }

    const message = (() => {
      if (counts.sent > 0) {
        return `Telegram reminder check complete. Sent ${counts.sent} notification${counts.sent === 1 ? '' : 's'}.`;
      }

      if (counts.skipped > 0 && lastDiagnosticCode) {
        return `Telegram reminder check complete, but no notifications could be sent. Diagnostic: ${lastDiagnosticCode}.`;
      }

      return 'Telegram reminder check complete. No new notifications were sent.';
    })();

    return sendJson(res, 200, buildResult(!(counts.sent === 0 && counts.skipped > 0), message, counts));
  } catch {
    return sendJson(
      res,
      500,
      buildResult(false, `Telegram reminder check failed on the server during: ${stage}. Please try again later.`),
    );
  }
}
