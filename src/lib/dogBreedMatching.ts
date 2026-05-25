import Fuse from 'fuse.js';

export type BreedMatchType = 'alias' | 'exact' | 'fallback' | 'fuzzy' | 'partial';

export type BreedSearchSource = 'api' | 'local';

export type SearchableBreed<TBreed = unknown> = {
  breed?: TBreed;
  canonicalName: string;
  normalizedName: string;
  source: BreedSearchSource;
};

export type BreedMatch<TBreed = unknown> = {
  breed?: TBreed;
  canonicalName: string;
  matchType: BreedMatchType;
  source: BreedSearchSource;
};

export const sharedCuratedBreedNames = [
  'Beagle',
  'Border Collie',
  'Bulldog',
  'French Bulldog',
  'German Shepherd Dog',
  'Golden Retriever',
  'Labrador Retriever',
  'Maltese',
  'Mixed Breed',
  'Poodle',
  'Rottweiler',
  'Shih Tzu',
  'Siberian Husky',
];

export const sharedBreedAliases: Record<string, string> = {
  beagle: 'Beagle',
  beagel: 'Beagle',
  bigel: 'Beagle',
  'border collie': 'Border Collie',
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
  maltese: 'Maltese',
  mix: 'Mixed Breed',
  'mixed breed': 'Mixed Breed',
  mutt: 'Mixed Breed',
  poodle: 'Poodle',
  rottweiler: 'Rottweiler',
  rottie: 'Rottweiler',
  'shih tzu': 'Shih Tzu',
  'siberian husky': 'Siberian Husky',
};

export function normalizeBreedName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[._/\\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findBreedMatch<TBreed>(
  normalizedBreed: string,
  searchableBreeds: SearchableBreed<TBreed>[],
): BreedMatch<TBreed> | null {
  const aliasName = sharedBreedAliases[normalizedBreed];

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

export function buildSearchableBreedList<TBreed>(
  breeds: TBreed[],
  getBreedName: (breed: TBreed) => string,
  localBreedNames = sharedCuratedBreedNames,
) {
  const seenBreedNames = new Set<string>();
  const apiBreeds = breeds
    .map((breed) => {
      const canonicalName = sanitizeBreedText(getBreedName(breed));

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

  const localBreeds = localBreedNames
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

function sanitizeBreedText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}
