import { createClient } from '@supabase/supabase-js';

const DISCLAIMER =
  'DogCareAI provides general informational guidance and is not a substitute for professional veterinary advice.';

const FALLBACK_MESSAGE =
  'The AI assistant is temporarily unavailable. Your dog profile and reminders still work. Please try again later.';

const RATE_LIMIT_MESSAGE =
  'The AI assistant is temporarily rate-limited to protect the demo from excessive usage. Please try again in a minute.';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Best-effort beta guard only. Serverless instances may not share memory, so this is not a persistent
// production-grade rate limiter. It still helps protect the demo from repeated Gemini calls per warm instance.
const geminiAttemptTimestampsByUser = new Map();

const EMERGENCY_KEYWORDS = [
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
  'hit by car',
  'hit by a car',
  'ran over',
  'run over',
  'car accident',
  'accident',
  'trauma',
  'injured badly',
  'severe injury',
  'broken leg',
  'broken bone',
  'vomiting',
  'vomit',
  'keeps vomiting',
  "won't stop vomiting",
  'cannot stop vomiting',
  'repeated vomiting',
  'severe vomiting',
  'throwing up nonstop',
  'severe pain',
  'extreme pain',
  'bloated stomach',
  'swollen belly',
  'cannot stand',
  "can't stand",
  'not moving',
  'pale gums',
  'blue gums',
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
  'נדרס',
  'דריסה',
  'נדרסה',
  'תאונה',
  'פגיעה מרכב',
  'רכב פגע',
  'נפגע מרכב',
  'פציעה קשה',
  'נפצע קשה',
  'שבר',
  'רגל שבורה',
  'מקיא',
  'הקאה',
  'הקאות',
  'לא מפסיק להקיא',
  'לא מפסיקה להקיא',
  'הקאות חוזרות',
  'מקיא שוב ושוב',
  'כאב חזק',
  'כאבים חזקים',
  'בטן נפוחה',
  'נפיחות בבטן',
  'לא עומד',
  'לא מצליח לעמוד',
  'לא זז',
  'התמוטט',
  'חניכיים חיוורות',
  'חניכיים כחולות',
];

const INTENT_KEYWORDS = {
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
  walking: ['walk', 'walking', 'exercise', 'activity', 'active', 'play', 'טיול', 'הליכה', 'פעילות', 'משחק'],
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

const INTENT_REMINDER_TYPES = {
  feeding: ['feeding'],
  vaccination: ['vaccination', 'medication', 'vet_visit'],
  walking: ['walk'],
  routine: ['feeding', 'walk', 'medication', 'vaccination', 'grooming', 'vet_visit', 'general'],
  behavior: ['general', 'walk'],
};

function normalizeText(text) {
  return String(text ?? '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function containsEmergencyKeyword(text) {
  const normalizedText = normalizeText(text);
  return EMERGENCY_KEYWORDS.some((keyword) => normalizedText.includes(normalizeText(keyword)));
}

function detectIntent(question) {
  if (containsEmergencyKeyword(question)) {
    return 'emergency';
  }

  const normalizedQuestion = normalizeText(question);

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedQuestion.includes(normalizeText(keyword)))) {
      return intent;
    }
  }

  return 'unknown';
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function buildResponse({ message, responseSource, isEmergency = false, detectedIntent }) {
  return {
    message,
    response_source: responseSource,
    is_emergency: isEmergency,
    detected_intent: detectedIntent,
    disclaimer: DISCLAIMER,
  };
}

function fallbackResponse(detectedIntent) {
  return buildResponse({
    message: FALLBACK_MESSAGE,
    responseSource: 'fallback',
    detectedIntent,
  });
}

function rateLimitResponse(detectedIntent) {
  return buildResponse({
    message: RATE_LIMIT_MESSAGE,
    responseSource: 'fallback',
    detectedIntent,
  });
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function canAttemptGeminiForUser(userId, maxRequestsPerMinute) {
  const now = Date.now();
  const recentTimestamps = (geminiAttemptTimestampsByUser.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentTimestamps.length >= maxRequestsPerMinute) {
    geminiAttemptTimestampsByUser.set(userId, recentTimestamps);
    return false;
  }

  recentTimestamps.push(now);
  geminiAttemptTimestampsByUser.set(userId, recentTimestamps);
  return true;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  const body = await new Promise((resolve, reject) => {
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 32768) {
        reject(new Error('request_body_too_large'));
      }
    });
    req.on('end', () => resolve(rawBody));
    req.on('error', reject);
  });

  return JSON.parse(body);
}

function getBearerToken(req) {
  const header = req.headers.authorization ?? req.headers.Authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

function summarizeDog(dog) {
  return {
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    weight: dog.weight,
    activity_level: dog.activity_level,
    allergies: dog.allergies,
    feeding_preferences: dog.feeding_preferences,
    vaccination_history: dog.vaccination_history,
    medical_notes: dog.medical_notes,
    special_conditions: dog.special_conditions,
  };
}

function compareReminderSchedule(a, b) {
  if (!a.scheduled_at && !b.scheduled_at) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }

  if (!a.scheduled_at) {
    return 1;
  }

  if (!b.scheduled_at) {
    return -1;
  }

  return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
}

function getRelevantReminders(reminders, detectedIntent) {
  const openReminders = reminders.filter((reminder) => reminder.state !== 'completed');
  const reminderTypes = INTENT_REMINDER_TYPES[detectedIntent];
  const relevantReminders = reminderTypes
    ? openReminders.filter((reminder) => reminderTypes.includes(reminder.type))
    : openReminders;

  return relevantReminders.sort(compareReminderSchedule).slice(0, 5);
}

function formatReminder(reminder) {
  return `${reminder.title} (${reminder.type}, ${reminder.scheduled_at || 'no date set'}, state: ${reminder.state})`;
}

function buildMockMessage({ dog, detectedIntent, relevantReminders }) {
  const dogFacts = [
    dog.age !== null ? `${dog.age} years old` : null,
    dog.breed,
    dog.weight !== null ? `${dog.weight} kg` : null,
    dog.activity_level ? `${dog.activity_level} activity level` : null,
  ].filter(Boolean);
  const careNotes = [
    dog.allergies ? `allergies: ${dog.allergies}` : null,
    dog.feeding_preferences ? `feeding preferences: ${dog.feeding_preferences}` : null,
    dog.medical_notes ? `medical notes: ${dog.medical_notes}` : null,
    dog.special_conditions ? `special conditions: ${dog.special_conditions}` : null,
  ].filter(Boolean);
  const reminderText =
    relevantReminders.length > 0
      ? `Relevant reminders: ${relevantReminders.map(formatReminder).join('; ')}.`
      : 'No matching open reminders are currently loaded for this dog.';

  return `${dog.name}${dogFacts.length > 0 ? ` is ${dogFacts.join(', ')}` : ' is the selected dog'}. Detected intent: ${detectedIntent}. ${
    careNotes.length > 0 ? `This mock response would consider ${careNotes.join('; ')}.` : 'This mock response would use the selected dog profile.'
  } ${reminderText} This is a beta mock/demo response; no real AI provider was called.`;
}

function buildGeminiPrompt({ dog, detectedIntent, relevantReminders, question, maxInputChars }) {
  const context = {
    detected_intent: detectedIntent,
    dog: summarizeDog(dog),
    relevant_reminders: relevantReminders.map((reminder) => ({
      title: reminder.title,
      type: reminder.type,
      scheduled_at: reminder.scheduled_at,
      recurring_frequency: reminder.recurring_frequency,
      state: reminder.state,
      notes: reminder.notes,
    })),
  };

  const prompt = [
    'You are DogCareAI, a beta dog-care assistant.',
    'Follow these safety rules strictly:',
    '- Provide general dog-care guidance only.',
    '- Do not diagnose medical conditions.',
    '- Encourage veterinarian consultation for medical concerns.',
    '- Keep the answer concise, practical, and beta-safe.',
    '- Use the active dog context when relevant.',
    '- Avoid claiming certainty.',
    '- If the situation seems urgent, advise contacting a veterinarian or emergency animal clinic immediately.',
    `Persistent disclaimer to respect: ${DISCLAIMER}`,
    '',
    'Structured dog context:',
    JSON.stringify(context, null, 2),
    '',
    'User question:',
    question,
  ].join('\n');

  return prompt.slice(0, maxInputChars);
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function callGemini({ prompt, model, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return '';
    }

    const payload = await response.json();
    return extractGeminiText(payload);
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'invalid_json' });
  }

  const dogId = typeof body?.dog_id === 'string' ? body.dog_id.trim() : '';
  const question = typeof body?.question === 'string' ? body.question.trim() : '';

  if (!dogId || !question) {
    return sendJson(res, 400, { error: 'invalid_input' });
  }

  const token = getBearerToken(req);

  if (!token) {
    return sendJson(res, 401, { error: 'missing_authorization' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return sendJson(res, 500, { error: 'server_not_configured' });
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
    return sendJson(res, 401, { error: 'invalid_authorization' });
  }

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select(
      'id,user_id,name,breed,age,weight,gender,medical_notes,allergies,vaccination_history,feeding_preferences,activity_level,special_conditions,is_archived,created_at,updated_at',
    )
    .eq('id', dogId)
    .eq('is_archived', false)
    .single();

  if (dogError || !dog || dog.user_id !== userData.user.id) {
    return sendJson(res, 404, { error: 'dog_not_found' });
  }

  const detectedIntent = detectIntent(question);

  if (detectedIntent === 'emergency') {
    return sendJson(
      res,
      200,
      buildResponse({
        message: `This may be urgent for ${dog.name}. Contact a veterinarian or emergency animal clinic immediately. DogCareAI cannot diagnose this situation and no Gemini response was generated.`,
        responseSource: 'emergency_rule',
        isEmergency: true,
        detectedIntent,
      }),
    );
  }

  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('id,user_id,dog_id,type,title,scheduled_at,recurring_frequency,notes,state,created_at,updated_at')
    .eq('dog_id', dog.id)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (remindersError) {
    return sendJson(res, 200, fallbackResponse(detectedIntent));
  }

  const relevantReminders = getRelevantReminders(reminders ?? [], detectedIntent);
  const mockMode = process.env.MOCK_AI_MODE !== 'false';

  if (mockMode || !process.env.GEMINI_API_KEY) {
    return sendJson(
      res,
      200,
      buildResponse({
        message: buildMockMessage({ dog, detectedIntent, relevantReminders }),
        responseSource: 'mock',
        detectedIntent,
      }),
    );
  }

  const model = process.env.AI_MODEL || 'gemini-2.5-flash';
  const maxRequestsPerMinute = parsePositiveInteger(process.env.AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE, 10);

  if (!canAttemptGeminiForUser(userData.user.id, maxRequestsPerMinute)) {
    return sendJson(res, 200, rateLimitResponse(detectedIntent));
  }

  const timeoutMs = parsePositiveInteger(process.env.AI_REQUEST_TIMEOUT_MS, 12000);
  const maxInputChars = parsePositiveInteger(process.env.AI_MAX_INPUT_CHARS, 6000);
  const prompt = buildGeminiPrompt({
    dog,
    detectedIntent,
    relevantReminders,
    question,
    maxInputChars,
  });
  const geminiText = await callGemini({ prompt, model, timeoutMs });

  if (!geminiText) {
    return sendJson(res, 200, fallbackResponse(detectedIntent));
  }

  return sendJson(
    res,
    200,
    buildResponse({
      message: geminiText,
      responseSource: 'gemini',
      detectedIntent,
    }),
  );
}
