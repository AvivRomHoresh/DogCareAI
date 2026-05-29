const MAX_REQUEST_BODY_CHARS = 4096;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
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

  return JSON.parse(body || '{}');
}

function getTelegramSecretHeader(req) {
  return req.headers['x-telegram-bot-api-secret-token'] ?? req.headers['X-Telegram-Bot-Api-Secret-Token'];
}

function getChatId(update) {
  return update?.message?.chat?.id ?? update?.channel_post?.chat?.id ?? null;
}

function getMessageText(update) {
  const text = update?.message?.text ?? update?.channel_post?.text;
  return typeof text === 'string' ? text.trim() : '';
}

function buildChatIdReply(chatId) {
  return [
    'Your DogCareAI Chat ID is:',
    '',
    String(chatId),
    '',
    'Copy this number and paste it into the Telegram chat ID field in DogCareAI.',
    'Do not paste a bot token here.',
  ].join('\n');
}

async function sendTelegramMessage({ botToken, chatId, text }) {
  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
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

  if (!response.ok) {
    return false;
  }

  const payload = await response.json().catch(() => null);
  return payload?.ok === true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method not allowed.' });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (webhookSecret) {
    const headerValue = getTelegramSecretHeader(req);

    if (headerValue !== webhookSecret) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized.' });
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return sendJson(res, 200, { success: false, ignored: true, message: 'Telegram bot is not configured.' });
  }

  let update;

  try {
    update = await readJsonBody(req);
  } catch {
    return sendJson(res, 200, { success: false, ignored: true, message: 'Invalid update ignored.' });
  }

  const chatId = getChatId(update);
  const messageText = getMessageText(update);

  if (chatId === null || chatId === undefined) {
    return sendJson(res, 200, { success: true, ignored: true, message: 'Update ignored.' });
  }

  if (!messageText) {
    return sendJson(res, 200, { success: true, ignored: true, message: 'Non-text update ignored.' });
  }

  const sent = await sendTelegramMessage({
    botToken,
    chatId,
    text: buildChatIdReply(chatId),
  }).catch(() => false);

  return sendJson(res, 200, {
    success: sent,
    ignored: false,
    message: sent ? 'Chat ID reply sent.' : 'Chat ID reply could not be sent.',
  });
}
