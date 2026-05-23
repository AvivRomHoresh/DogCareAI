import { createClient } from '@supabase/supabase-js';

const TEST_MESSAGE = '🐶 DogCareAI test reminder: Telegram notifications are connected.';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const header = req.headers.authorization ?? req.headers.Authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

function buildResult(success, message) {
  return {
    success,
    message,
  };
}

async function sendTelegramTestMessage({ botToken, chatId }) {
  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: TEST_MESSAGE,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    return false;
  }

  const payload = await response.json().catch(() => null);
  return payload?.ok === true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, buildResult(false, 'Method not allowed.'));
  }

  const token = getBearerToken(req);

  if (!token) {
    return sendJson(res, 401, buildResult(false, 'Please sign in before testing Telegram notifications.'));
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

  const { data: settings, error: settingsError } = await supabase
    .from('notification_settings')
    .select('user_id,telegram_chat_id,telegram_enabled,reminder_notifications_enabled')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (settingsError) {
    return sendJson(res, 500, buildResult(false, 'Telegram settings could not be loaded. Please try again later.'));
  }

  if (!settings) {
    return sendJson(res, 400, buildResult(false, 'Telegram notification settings have not been saved yet.'));
  }

  if (!settings.telegram_enabled) {
    return sendJson(res, 400, buildResult(false, 'Telegram notifications are disabled for this account.'));
  }

  const chatId = typeof settings.telegram_chat_id === 'string' ? settings.telegram_chat_id.trim() : '';

  if (!chatId) {
    return sendJson(res, 400, buildResult(false, 'Telegram chat ID is missing. Save a chat ID before sending a test message.'));
  }

  const telegramSent = await sendTelegramTestMessage({
    botToken,
    chatId,
  }).catch(() => false);

  if (!telegramSent) {
    return sendJson(
      res,
      502,
      buildResult(false, 'Telegram could not deliver the test message. Confirm the chat ID and that the bot was started.'),
    );
  }

  return sendJson(res, 200, buildResult(true, 'Telegram test message sent successfully.'));
}
