import Fuse from 'fuse.js';

export type DogInsight = {
  body: string;
  factCandidates: string[];
  fallback: boolean;
  matchedBreedName: string | null;
  matchType: 'alias' | 'exact' | 'fallback' | 'fuzzy' | 'partial';
  sourceLabel: 'dogapi.dog' | 'local fallback';
  title: string;
};

type DogApiBreed = {
  id: string;
  type: 'breed';
  attributes?: {
    description?: string;
    name?: string;
  };
};

type DogApiFact = {
  id: string;
  type: 'fact';
  attributes?: {
    body?: string;
  };
};

type DogApiListResponse<T> = {
  data?: T[];
};

type SearchableBreed = {
  breed?: DogApiBreed;
  canonicalName: string;
  normalizedName: string;
  source: 'api' | 'local';
};

type BreedMatch = {
  breed?: DogApiBreed;
  canonicalName: string;
  matchType: DogInsight['matchType'];
  source: 'api' | 'local';
};

const dogApiBreedsUrl = 'https://dogapi.dog/api/v2/breeds';
const dogApiFactsUrl = 'https://dogapi.dog/api/v2/facts';
const insightCacheKey = 'dogcareai.dogInsights.cache.v2';
const cacheTtlMs = 1000 * 60 * 60 * 6;
const requestTimeoutMs = 3500;

const localGeneralInsight =
  'Dogs often read routines and body language closely, so consistent daily care cues can help them feel more secure.';

const localGeneralInsights = [
  localGeneralInsight,
  'Many dogs enjoy predictable cues, so consistent words and routines can make daily care feel easier to follow.',
  'Short, positive practice sessions can help dogs learn routines without making care time feel overwhelming.',
];

const localBreedFacts: Record<string, string[]> = {
  Beagle: [
    'Beagles are often scent-curious dogs, so sniffing games and calm walks can be especially engaging.',
    'Many Beagles enjoy using their nose, which makes simple hide-and-find games a good enrichment idea.',
    'Beagle background can be a helpful reminder to include safe scent exploration in everyday routines.',
  ],
  Bulldog: [
    'Bulldogs are often companion-focused, so steady routines and comfortable rest spaces can be helpful.',
    'Many Bulldogs enjoy calm interaction and predictable daily care cues.',
    'Bulldog background can be a reminder to watch individual comfort and activity preferences closely.',
  ],
  'French Bulldog': [
    'French Bulldogs are often people-oriented companions, so many enjoy short, positive interaction throughout the day.',
    'Many French Bulldogs respond well to predictable routines and gentle play sessions.',
    'French Bulldog background can be a useful starting point, but each dog still has individual preferences.',
  ],
  'German Shepherd Dog': [
    'German Shepherd Dogs are often task-oriented, so many enjoy structured games and clear routines.',
    'Many German Shepherd Dogs benefit from predictable cues and purposeful enrichment.',
    'German Shepherd Dog background can suggest a love of learning, while individual temperament still matters most.',
  ],
  'Golden Retriever': [
    'Golden Retrievers are often social working dogs, so many enjoy interactive routines and gentle enrichment.',
    'Many Golden Retrievers like predictable play and training moments woven into daily care.',
    'Golden Retriever background can be a useful cue to include positive, people-connected activities.',
  ],
  'Labrador Retriever': [
    'Labrador Retrievers are often people-focused working dogs, so many enjoy predictable routines and interactive activities.',
    'Many Labrador Retrievers enjoy games that combine movement, attention, and simple training cues.',
    'Labrador Retriever background can be a starting point for planning active, positive daily care.',
  ],
  'Mixed Breed': [
    'Mixed-breed dogs can have wonderfully varied traits, so watching their individual routines and preferences is especially useful.',
    'For mixed-breed dogs, daily habits and comfort signals often tell you more than breed labels alone.',
    'Mixed-breed background is a great reminder to tailor care around the dog in front of you.',
  ],
  Poodle: [
    'Poodles are often quick learners, so many enjoy short, varied enrichment games.',
    'Many Poodles respond well to clear cues and mentally engaging routines.',
    'Poodle background can be a helpful prompt to include playful problem-solving in daily care.',
  ],
  'Shih Tzu': [
    'Shih Tzus are often companion-oriented dogs, so many enjoy calm routines close to their people.',
    'Many Shih Tzus appreciate predictable care moments and gentle interaction.',
    'Shih Tzu background can be a reminder to balance companionship, rest, and light enrichment.',
  ],
  'Siberian Husky': [
    'Siberian Huskies are often energetic working dogs, so many enjoy active routines and engaging outlets.',
    'Many Siberian Huskies benefit from consistent structure and safe ways to use their energy.',
    'Siberian Husky background can suggest a need for thoughtful enrichment, while individual preferences still matter.',
  ],
};

const localCuratedBreedNames = Object.keys(localBreedFacts);

const breedAliases: Record<string, string> = {
  beagel: 'Beagle',
  bigel: 'Beagle',
  bulldog: 'Bulldog',
  frenchie: 'French Bulldog',
  'french bulldog': 'French Bulldog',
  'german shepard': 'German Shepherd Dog',
  'german shepherd': 'German Shepherd Dog',
  'german shepherd dog': 'German Shepherd Dog',
  golden: 'Golden Retriever',
  'golden retriever': 'Golden Retriever',
  'golden retriver': 'Golden Retriever',
  gsd: 'German Shepherd Dog',
  husky: 'Siberian Husky',
  lab: 'Labrador Retriever',
  labrador: 'Labrador Retriever',
  'labrador retriever': 'Labrador Retriever',
  'labrador retriver': 'Labrador Retriever',
  mix: 'Mixed Breed',
  'mixed breed': 'Mixed Breed',
  mutt: 'Mixed Breed',
  poodle: 'Poodle',
  'shih tzu': 'Shih Tzu',
  'siberian husky': 'Siberian Husky',
};

const unsuitableContentPatterns = [
  /\bdiagnos/i,
  /\bdisease\b/i,
  /\bcancer\b/i,
  /\bmedication\b/i,
  /\bmedicine\b/i,
  /\btreatment\b/i,
  /\bmust\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bguaranteed\b/i,
  /\bwill\b/i,
  /\brequired\b/i,
  /\bdiet\b/i,
  /\bsupplement\b/i,
];

let memoryBreeds: DogApiBreed[] | null = null;
let memoryFact: string | null = null;
let memoryCacheTime = 0;

export async function getDogInsight(rawBreed: string | null | undefined): Promise<DogInsight> {
  const normalizedBreed = normalizeBreedName(rawBreed);

  if (!normalizedBreed) {
    return buildGeneralInsight(normalizedBreed);
  }

  const breeds = await loadDogApiBreeds();
  const matchedBreed = findBreedMatch(normalizedBreed, breeds);
  const breedInsight = buildBreedInsight(matchedBreed);

  if (breedInsight) {
    return breedInsight;
  }

  return buildGeneralInsight(normalizedBreed);
}

export function getLocalDogInsight(rawBreed: string | null | undefined): DogInsight {
  const normalizedBreed = normalizeBreedName(rawBreed);
  const aliasName = breedAliases[normalizedBreed];

  if (aliasName && localBreedFacts[aliasName]) {
    return buildLocalBreedInsight(aliasName, aliasName === 'Mixed Breed' ? 'alias' : 'fallback');
  }

  return buildLocalInsight(
    'Did You Know?',
    localGeneralInsights,
    null,
    'fallback',
    'local fallback',
  );
}

async function buildGeneralInsight(normalizedBreed: string): Promise<DogInsight> {
  const apiFact = await loadDogApiFact();

  if (apiFact && isSuitableInsightText(apiFact)) {
    return {
      body: trimInsight(apiFact),
      factCandidates: [trimInsight(apiFact), ...localGeneralInsights],
      fallback: false,
      matchedBreedName: null,
      matchType: 'fallback',
      sourceLabel: 'dogapi.dog',
      title: normalizedBreed ? 'General dog fact' : 'Did You Know?',
    };
  }

  return buildLocalInsight('Did You Know?', localGeneralInsights, null, 'fallback', 'local fallback');
}

function buildBreedInsight(match: BreedMatch | null): DogInsight | null {
  if (!match) {
    return null;
  }

  const name = sanitizeText(match.breed?.attributes?.name ?? match.canonicalName);
  const description = sanitizeText(match.breed?.attributes?.description ?? '');
  const candidates = [
    isSuitableInsightText(description) ? trimInsight(description) : null,
    ...(localBreedFacts[match.canonicalName] ?? []),
    ...buildGenericBreedFacts(name),
  ].filter((candidate): candidate is string => Boolean(candidate && isSuitableInsightText(candidate)));

  if (!name || candidates.length === 0) {
    return null;
  }

  const sourceLabel = match.breed && candidates.some((candidate) => candidate === trimInsight(description))
    ? 'dogapi.dog'
    : 'local fallback';

  return {
    body: pickSessionStableItem(candidates, name),
    factCandidates: candidates,
    fallback: sourceLabel === 'local fallback',
    matchedBreedName: name,
    matchType: match.matchType,
    sourceLabel,
    title: `${name} insight`,
  };
}

function buildLocalBreedInsight(canonicalName: string, matchType: DogInsight['matchType']) {
  return buildLocalInsight(
    `${canonicalName} insight`,
    localBreedFacts[canonicalName] ?? buildGenericBreedFacts(canonicalName),
    canonicalName,
    matchType,
    'local fallback',
  );
}

function buildLocalInsight(
  title: string,
  candidates: string[],
  matchedBreedName: string | null,
  matchType: DogInsight['matchType'],
  sourceLabel: DogInsight['sourceLabel'],
): DogInsight {
  const safeCandidates = candidates.filter(isSuitableInsightText);

  return {
    body: pickSessionStableItem(safeCandidates.length > 0 ? safeCandidates : [localGeneralInsight], matchedBreedName ?? title),
    factCandidates: safeCandidates.length > 0 ? safeCandidates : [localGeneralInsight],
    fallback: true,
    matchedBreedName,
    matchType,
    sourceLabel,
    title,
  };
}

function buildGenericBreedFacts(breedName: string) {
  return [
    `${breedName} background can be a helpful starting point, but your dog's own habits and comfort signals matter most.`,
    `For ${breedName} dogs, a steady mix of routine, gentle enrichment, and observation can help you notice what works best for your dog.`,
    `${breedName} dogs can still have individual preferences, so pairing breed context with your dog's daily routine is the most useful approach.`,
  ];
}

async function loadDogApiBreeds(): Promise<DogApiBreed[]> {
  const cached = readCachedDogApiData();

  if (cached?.breeds) {
    memoryBreeds = cached.breeds;
    memoryCacheTime = cached.cachedAt;
    return cached.breeds;
  }

  try {
    const response = await fetchJsonWithTimeout<DogApiListResponse<DogApiBreed>>(dogApiBreedsUrl);
    const breeds = Array.isArray(response.data) ? response.data : [];

    if (breeds.length > 0) {
      memoryBreeds = breeds;
      memoryCacheTime = Date.now();
      writeCachedDogApiData({ breeds, fact: memoryFact });
      return breeds;
    }
  } catch {
    // API failures intentionally fall through to local fallback.
  }

  return [];
}

async function loadDogApiFact(): Promise<string | null> {
  const cached = readCachedDogApiData();

  if (cached?.fact) {
    memoryFact = cached.fact;
    memoryCacheTime = cached.cachedAt;
    return cached.fact;
  }

  try {
    const response = await fetchJsonWithTimeout<DogApiListResponse<DogApiFact>>(dogApiFactsUrl);
    const fact = sanitizeText(response.data?.[0]?.attributes?.body ?? '');

    if (fact) {
      memoryFact = fact;
      memoryCacheTime = Date.now();
      writeCachedDogApiData({ breeds: memoryBreeds, fact });
      return fact;
    }
  } catch {
    // API failures intentionally fall through to local fallback.
  }

  return null;
}

function findBreedMatch(normalizedBreed: string, breeds: DogApiBreed[]): BreedMatch | null {
  const aliasName = breedAliases[normalizedBreed];
  const searchableBreeds = buildSearchableBreedList(breeds);

  if (aliasName) {
    const aliasMatch = searchableBreeds.find((breed) => breed.canonicalName === aliasName);

    if (aliasMatch) {
      return {
        breed: aliasMatch.breed,
        canonicalName: aliasMatch.canonicalName,
        matchType: 'alias',
        source: aliasMatch.source,
      };
    }
  }

  const exactMatch = searchableBreeds.find(({ normalizedName }) => normalizedName === normalizedBreed);

  if (exactMatch) {
    return {
      breed: exactMatch.breed,
      canonicalName: exactMatch.canonicalName,
      matchType: 'exact',
      source: exactMatch.source,
    };
  }

  const partialMatch = searchableBreeds.find(({ normalizedName }) => {
    if (normalizedBreed.length < 5 || normalizedName.length < 5) {
      return false;
    }

    return normalizedName.includes(normalizedBreed) || normalizedBreed.includes(normalizedName);
  });

  if (partialMatch) {
    return {
      breed: partialMatch.breed,
      canonicalName: partialMatch.canonicalName,
      matchType: 'partial',
      source: partialMatch.source,
    };
  }

  if (normalizedBreed.length < 5) {
    return null;
  }

  const fuse = new Fuse(searchableBreeds, {
    distance: 80,
    includeScore: true,
    ignoreLocation: true,
    keys: [
      { name: 'canonicalName', weight: 0.4 },
      { name: 'normalizedName', weight: 0.6 },
    ],
    minMatchCharLength: 3,
    threshold: 0.32,
  });

  const [bestMatch] = fuse.search(normalizedBreed);

  if (!bestMatch || bestMatch.score === undefined || bestMatch.score > getFuseScoreLimit(normalizedBreed)) {
    return null;
  }

  return {
    breed: bestMatch.item.breed,
    canonicalName: bestMatch.item.canonicalName,
    matchType: 'fuzzy',
    source: bestMatch.item.source,
  };
}

function buildSearchableBreedList(breeds: DogApiBreed[]): SearchableBreed[] {
  const seenBreedNames = new Set<string>();
  const apiBreeds = breeds
    .map((breed) => {
      const canonicalName = sanitizeText(breed.attributes?.name ?? '');

      return {
        breed,
        canonicalName,
        normalizedName: normalizeBreedName(canonicalName),
        source: 'api' as const,
      };
    })
    .filter(({ normalizedName }) => normalizedName.length > 0)
    .filter(({ normalizedName }) => {
      if (seenBreedNames.has(normalizedName)) {
        return false;
      }

      seenBreedNames.add(normalizedName);
      return true;
    });

  const localBreeds = localCuratedBreedNames
    .map((canonicalName) => ({
      canonicalName,
      normalizedName: normalizeBreedName(canonicalName),
      source: 'local' as const,
    }))
    .filter(({ normalizedName }) => !seenBreedNames.has(normalizedName));

  return [...apiBreeds, ...localBreeds];
}

function getFuseScoreLimit(normalizedBreed: string) {
  return normalizedBreed.length <= 6 ? 0.24 : 0.3;
}

function normalizeBreedName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[._/\\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSuitableInsightText(value: string) {
  const text = sanitizeText(value);

  if (text.length < 24) {
    return false;
  }

  return !unsuitableContentPatterns.some((pattern) => pattern.test(text));
}

function trimInsight(value: string) {
  const text = sanitizeText(value);
  const firstSentence = text.match(/^(.+?[.!?])\s/)?.[1] ?? text;

  return firstSentence.length > 260 ? `${firstSentence.slice(0, 257).trim()}...` : firstSentence;
}

function sanitizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function pickSessionStableItem<T>(items: T[], seed: string): T {
  const safeItems = items.filter(Boolean);

  if (safeItems.length === 0) {
    return items[0];
  }

  const hash = Array.from(`${seed}:${getSessionInsightSeed(seed)}`).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return safeItems[hash % safeItems.length];
}

function getSessionInsightSeed(seed: string) {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const key = `${insightCacheKey}.seed.${seed}`;

  try {
    const existingSeed = window.sessionStorage.getItem(key);

    if (existingSeed) {
      return existingSeed;
    }

    const nextSeed = String(Math.floor(Math.random() * 1000000));
    window.sessionStorage.setItem(key, nextSeed);
    return nextSeed;
  } catch {
    return 'fallback';
  }
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Dog API request failed.');
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

type CachedDogApiData = {
  breeds: DogApiBreed[] | null;
  cachedAt: number;
  fact: string | null;
};

function readCachedDogApiData(): CachedDogApiData | null {
  const now = Date.now();

  if (memoryCacheTime && now - memoryCacheTime < cacheTtlMs) {
    return {
      breeds: memoryBreeds,
      cachedAt: memoryCacheTime,
      fact: memoryFact,
    };
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(insightCacheKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as CachedDogApiData;

    if (!parsed.cachedAt || now - parsed.cachedAt >= cacheTtlMs) {
      window.sessionStorage.removeItem(insightCacheKey);
      return null;
    }

    return {
      breeds: Array.isArray(parsed.breeds) ? parsed.breeds : null,
      cachedAt: parsed.cachedAt,
      fact: typeof parsed.fact === 'string' ? parsed.fact : null,
    };
  } catch {
    window.sessionStorage.removeItem(insightCacheKey);
    return null;
  }
}

function writeCachedDogApiData(value: { breeds: DogApiBreed[] | null; fact: string | null }) {
  if (typeof window === 'undefined') {
    return;
  }

  const cachedAt = Date.now();

  try {
    window.sessionStorage.setItem(
      insightCacheKey,
      JSON.stringify({
        breeds: value.breeds,
        cachedAt,
        fact: value.fact,
      }),
    );
  } catch {
    // Cache writes are best-effort only.
  }
}
