export type NearbyDogPlaceCategory = 'dog_park' | 'groomer' | 'pet_shop' | 'veterinary';

export type NearbyDogPlace = {
  address: string | null;
  category: NearbyDogPlaceCategory;
  categoryLabel: string;
  dataCompletenessScore: number;
  distanceMeters: number;
  facebookUrl: string | null;
  googleMapsDirectionsUrl: string;
  googleMapsSearchUrl: string;
  id: string;
  instagramUrl: string | null;
  latitude: number;
  longitude: number;
  name: string;
  openingHours: string | null;
  phone: string | null;
  source: 'OpenStreetMap / Overpass';
  website: string | null;
};

export type NearbyDogPlacesResult = {
  attribution: string;
  fromCache: boolean;
  origin: SearchOrigin;
  places: NearbyDogPlace[];
  radiusMeters: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SearchOrigin = Coordinates & {
  label: string;
  mode: 'address' | 'current_location';
};

export type AddressSuggestion = Coordinates & {
  id: string;
  label: string;
};

type CachePayload = {
  cachedAt: number;
  origin: SearchOrigin;
  places: NearbyDogPlace[];
  radiusMeters: number;
};

type OverpassElement = {
  center?: {
    lat?: number;
    lon?: number;
  };
  id?: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string | undefined>;
  type?: string;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export type NearbyDogPlacesErrorCode = 'api_error' | 'geolocation_unsupported' | 'permission_denied';
export type GeocodingErrorCode = 'address_empty' | 'address_not_found' | 'geocoding_unavailable';

export class NearbyDogPlacesError extends Error {
  code: NearbyDogPlacesErrorCode;
  category?: 'http' | 'network' | 'parse';
  endpointLabel?: string;
  status?: number;

  constructor(
    code: NearbyDogPlacesErrorCode,
    message: string,
    details: { category?: 'http' | 'network' | 'parse'; endpointLabel?: string; status?: number } = {},
  ) {
    super(message);
    this.code = code;
    this.category = details.category;
    this.endpointLabel = details.endpointLabel;
    this.status = details.status;
  }
}

const overpassEndpoints = [
  { label: 'primary', url: 'https://overpass-api.de/api/interpreter' },
  { label: 'fallback', url: 'https://overpass.private.coffee/api/interpreter' },
] as const;
const nominatimEndpoint = 'https://nominatim.openstreetmap.org/search';
const photonEndpoint = 'https://photon.komoot.io/api/';
const cacheTtlMs = 10 * 60 * 1000;
const cachePrefix = 'dogcareai.nearbyDogPlaces.v1';
const lastCacheKey = `${cachePrefix}.last`;
const suggestionCachePrefix = 'dogcareai.addressSuggestions.v1';
const skipPrimaryOverpassKey = 'dogcareai.nearbyDogPlaces.skipPrimaryOverpassForSession';
const defaultRadiusMeters = 5000;
const defaultLimit = 30;
const retryableOverpassStatuses = new Set([406, 429, 502, 503, 504]);

const categoryLabels: Record<NearbyDogPlaceCategory, string> = {
  dog_park: 'Dog park',
  groomer: 'Groomer',
  pet_shop: 'Pet shop',
  veterinary: 'Veterinary clinic',
};

export class NearbyGeocodingError extends Error {
  code: GeocodingErrorCode;

  constructor(code: GeocodingErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    city?: string;
    country?: string;
    housenumber?: string;
    name?: string;
    osm_id?: number;
    postcode?: string;
    state?: string;
    street?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

export function getCurrentPosition(): Promise<SearchOrigin> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(
      new NearbyDogPlacesError('geolocation_unsupported', 'Geolocation is not supported in this browser.'),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          label: 'your current location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          mode: 'current_location',
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new NearbyDogPlacesError('permission_denied', 'Location permission was denied.'));
          return;
        }

        reject(new NearbyDogPlacesError('api_error', error.message || 'Could not read your location.'));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10000,
      },
    );
  });
}

export async function fetchNearbyDogPlaces(
  origin: SearchOrigin,
  options: { limit?: number; radiusMeters?: number } = {},
): Promise<NearbyDogPlacesResult> {
  const radiusMeters = options.radiusMeters ?? defaultRadiusMeters;
  const limit = options.limit ?? defaultLimit;
  const cacheKey = getCacheKey(origin, radiusMeters);
  const cachedPayload = readCachedPlaces(cacheKey);

  if (cachedPayload) {
    return {
      attribution: 'Data source: OpenStreetMap contributors via Overpass API.',
      fromCache: true,
      origin: cachedPayload.origin,
      places: cachedPayload.places.slice(0, limit),
      radiusMeters: cachedPayload.radiusMeters,
    };
  }

  const data = await fetchOverpassData(buildOverpassQuery(origin, radiusMeters));
  const places = normalizeOverpassElements(data.elements ?? [], origin)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);

  writeCachedPlaces(cacheKey, {
    cachedAt: Date.now(),
    origin,
    places,
    radiusMeters,
  });

  return {
    attribution: 'Data source: OpenStreetMap contributors via Overpass API.',
    fromCache: false,
    origin,
    places,
    radiusMeters,
  };
}

async function fetchOverpassData(query: string): Promise<OverpassResponse> {
  let lastError: NearbyDogPlacesError | null = null;
  const endpoints = getOverpassEndpointsForSession();

  for (const [index, endpoint] of endpoints.entries()) {
    try {
      const response = await fetch(endpoint.url, {
        body: new URLSearchParams({ data: query }).toString(),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const error = new NearbyDogPlacesError('api_error', 'OpenStreetMap place search is unavailable right now.', {
          category: 'http',
          endpointLabel: endpoint.label,
          status: response.status,
        });

        warnAboutOverpassFailure(error);

        if (endpoint.label === 'primary' && response.status === 406) {
          rememberPrimaryOverpass406ForSession();
        }

        if (index === 0 && retryableOverpassStatuses.has(response.status) && endpoints.length > 1) {
          lastError = error;
          continue;
        }

        throw error;
      }

      try {
        return (await response.json()) as OverpassResponse;
      } catch {
        const error = new NearbyDogPlacesError('api_error', 'OpenStreetMap place search is unavailable right now.', {
          category: 'parse',
          endpointLabel: endpoint.label,
        });

        warnAboutOverpassFailure(error);

        if (index === 0 && endpoints.length > 1) {
          lastError = error;
          continue;
        }

        throw error;
      }
    } catch (error) {
      if (error instanceof NearbyDogPlacesError) {
        throw error;
      }

      const nearbyError = new NearbyDogPlacesError('api_error', 'OpenStreetMap place search is unavailable right now.', {
        category: 'network',
        endpointLabel: endpoint.label,
      });

      warnAboutOverpassFailure(nearbyError);

      if (index === 0 && endpoints.length > 1) {
        lastError = nearbyError;
        continue;
      }

      throw nearbyError;
    }
  }

  throw lastError ?? new NearbyDogPlacesError('api_error', 'OpenStreetMap place search is unavailable right now.');
}

function getOverpassEndpointsForSession() {
  if (shouldSkipPrimaryOverpassForSession()) {
    return overpassEndpoints.slice(1);
  }

  return overpassEndpoints;
}

function shouldSkipPrimaryOverpassForSession() {
  try {
    return window.sessionStorage.getItem(skipPrimaryOverpassKey) === 'true';
  } catch {
    return false;
  }
}

function rememberPrimaryOverpass406ForSession() {
  try {
    window.sessionStorage.setItem(skipPrimaryOverpassKey, 'true');
  } catch {
    // Endpoint preference is a session-only optimization; search still works without sessionStorage.
  }
}

function warnAboutOverpassFailure(error: NearbyDogPlacesError) {
  console.warn('DogCareAI Nearby place search request failed.', {
    category: error.category ?? 'unknown',
    endpoint: error.endpointLabel ?? 'unknown',
    status: error.status ?? null,
  });
}

export async function geocodeAddress(address: string): Promise<SearchOrigin> {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    throw new NearbyGeocodingError('address_empty', 'Enter an address before searching.');
  }

  const response = await fetch(
    `${nominatimEndpoint}?${new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      q: trimmedAddress,
    }).toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new NearbyGeocodingError('geocoding_unavailable', 'Address search is unavailable right now.');
  }

  const results = (await response.json()) as NominatimResult[];
  const firstResult = results[0];
  const latitude = Number(firstResult?.lat);
  const longitude = Number(firstResult?.lon);

  if (!firstResult || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new NearbyGeocodingError('address_not_found', 'No matching address was found.');
  }

  return {
    label: firstResult.display_name || trimmedAddress,
    latitude,
    longitude,
    mode: 'address',
  };
}

export async function fetchAddressSuggestions(query: string, limit = 5): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return [];
  }

  const cacheKey = `${suggestionCachePrefix}.${trimmedQuery.toLowerCase()}`;
  const cachedSuggestions = readCachedAddressSuggestions(cacheKey);

  if (cachedSuggestions) {
    return cachedSuggestions.slice(0, limit);
  }

  const response = await fetch(
    `${photonEndpoint}?${new URLSearchParams({
      lang: 'en',
      limit: String(limit),
      q: trimmedQuery,
    }).toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PhotonResponse;
  const suggestions = (data.features ?? [])
    .map(normalizePhotonFeature)
    .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null)
    .slice(0, limit);

  writeCachedAddressSuggestions(cacheKey, suggestions);

  return suggestions;
}

export function readLastCachedNearbyDogPlaces(limit = defaultLimit): NearbyDogPlacesResult | null {
  const cacheKey = window.sessionStorage.getItem(lastCacheKey);

  if (!cacheKey) {
    return null;
  }

  const cachedPayload = readCachedPlaces(cacheKey);

  if (!cachedPayload) {
    return null;
  }

  return {
    attribution: 'Data source: OpenStreetMap contributors via Overpass API.',
    fromCache: true,
    origin: cachedPayload.origin,
    places: cachedPayload.places.slice(0, limit),
    radiusMeters: cachedPayload.radiusMeters,
  };
}

function buildOverpassQuery({ latitude, longitude }: Coordinates, radiusMeters: number) {
  const around = `(around:${radiusMeters},${latitude},${longitude})`;

  return `
    [out:json][timeout:18];
    (
      node["amenity"="veterinary"]${around};
      way["amenity"="veterinary"]${around};
      node["shop"="pet"]${around};
      way["shop"="pet"]${around};
      node["leisure"="dog_park"]${around};
      way["leisure"="dog_park"]${around};
      node["shop"="pet_grooming"]${around};
      way["shop"="pet_grooming"]${around};
      node["shop"="dog_grooming"]${around};
      way["shop"="dog_grooming"]${around};
      node["craft"="dog_grooming"]${around};
      way["craft"="dog_grooming"]${around};
    );
    out body center 100;
  `;
}

function normalizeOverpassElements(elements: OverpassElement[], origin: Coordinates) {
  const seen = new Set<string>();
  const places: NearbyDogPlace[] = [];

  for (const element of elements) {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const category = getCategory(element.tags ?? {});

    if (!element.id || !element.type || latitude === undefined || longitude === undefined || !category) {
      continue;
    }

    const id = `${element.type}-${element.id}`;

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);

    places.push({
      address: getAddress(element.tags ?? {}),
      category,
      categoryLabel: categoryLabels[category],
      dataCompletenessScore: getDataCompletenessScore(element.tags ?? {}),
      distanceMeters: getDistanceMeters(origin, { latitude, longitude }),
      facebookUrl: normalizeFacebookUrl(getTagValue(element.tags ?? {}, ['facebook', 'contact:facebook'])),
      googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(latitude, longitude),
      googleMapsSearchUrl: getGoogleMapsSearchUrl(
        getPlaceName(element.tags ?? {}, category),
        getAddress(element.tags ?? {}),
        latitude,
        longitude,
      ),
      id,
      instagramUrl: normalizeInstagramUrl(getTagValue(element.tags ?? {}, ['instagram', 'contact:instagram'])),
      latitude,
      longitude,
      name: getPlaceName(element.tags ?? {}, category),
      openingHours: getTagValue(element.tags ?? {}, ['opening_hours']),
      phone: getTagValue(element.tags ?? {}, ['phone', 'contact:phone']),
      source: 'OpenStreetMap / Overpass',
      website: normalizeWebsiteUrl(getTagValue(element.tags ?? {}, ['website', 'contact:website', 'url'])),
    });
  }

  return places;
}

function getCategory(tags: Record<string, string | undefined>): NearbyDogPlaceCategory | null {
  if (tags.amenity === 'veterinary') {
    return 'veterinary';
  }

  if (tags.shop === 'pet') {
    return 'pet_shop';
  }

  if (tags.leisure === 'dog_park') {
    return 'dog_park';
  }

  if (tags.shop === 'pet_grooming' || tags.shop === 'dog_grooming' || tags.craft === 'dog_grooming') {
    return 'groomer';
  }

  return null;
}

function getPlaceName(tags: Record<string, string | undefined>, category: NearbyDogPlaceCategory) {
  return tags.name?.trim() || categoryLabels[category];
}

function getAddress(tags: Record<string, string | undefined>) {
  const streetLine = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const parts = [
    streetLine,
    tags['addr:city'],
    tags['addr:postcode'],
    tags['addr:country'],
  ].filter((part): part is string => Boolean(part?.trim()));

  return parts.length > 0 ? parts.join(', ') : null;
}

function getTagValue(tags: Record<string, string | undefined>, keys: string[]) {
  for (const key of keys) {
    const value = tags[key]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeWebsiteUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://${value}`;
}

function normalizeInstagramUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://www.instagram.com/${value.replace(/^@/, '')}`;
}

function normalizeFacebookUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://www.facebook.com/${value}`;
}

function getGoogleMapsDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

function getGoogleMapsSearchUrl(name: string, address: string | null, latitude: number, longitude: number) {
  const query = encodeURIComponent([name, address, `${latitude},${longitude}`].filter(Boolean).join(' '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function normalizePhotonFeature(feature: PhotonFeature): AddressSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  const properties = feature.properties ?? {};
  const streetLine = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const label = [
    properties.name,
    streetLine,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(', ');

  return {
    id: String(properties.osm_id ?? `${latitude}-${longitude}-${label}`),
    label: label || `${latitude}, ${longitude}`,
    latitude,
    longitude,
  };
}

function getDataCompletenessScore(tags: Record<string, string | undefined>) {
  let score = 0;

  if (tags.website || tags['contact:website'] || tags.url) {
    score += 3;
  }

  if (getAddress(tags)) {
    score += 3;
  }

  if (tags.phone || tags['contact:phone']) {
    score += 2;
  }

  if (tags.opening_hours) {
    score += 2;
  }

  if (tags.facebook || tags['contact:facebook'] || tags.instagram || tags['contact:instagram']) {
    score += 1;
  }

  if (tags.name) {
    score += 1;
  }

  return score;
}

function getDistanceMeters(from: Coordinates, to: Coordinates) {
  const earthRadiusMeters = 6371000;
  const lat1 = degreesToRadians(from.latitude);
  const lat2 = degreesToRadians(to.latitude);
  const deltaLat = degreesToRadians(to.latitude - from.latitude);
  const deltaLon = degreesToRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getCacheKey({ latitude, longitude }: Coordinates, radiusMeters: number) {
  return `${cachePrefix}.${latitude.toFixed(2)}.${longitude.toFixed(2)}.${radiusMeters}`;
}

function readCachedPlaces(cacheKey: string) {
  try {
    const rawValue = window.sessionStorage.getItem(cacheKey);

    if (!rawValue) {
      return null;
    }

    const payload = JSON.parse(rawValue) as CachePayload;

    if (!Array.isArray(payload.places) || !payload.origin || Date.now() - payload.cachedAt > cacheTtlMs) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return payload;
  } catch {
    window.sessionStorage.removeItem(cacheKey);
    return null;
  }
}

function writeCachedPlaces(cacheKey: string, payload: CachePayload) {
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(payload));
    window.sessionStorage.setItem(lastCacheKey, cacheKey);
  } catch {
    // Cache writes are best-effort only; the feature still works without sessionStorage.
  }
}

function readCachedAddressSuggestions(cacheKey: string) {
  try {
    const rawValue = window.sessionStorage.getItem(cacheKey);

    if (!rawValue) {
      return null;
    }

    const payload = JSON.parse(rawValue) as { cachedAt: number; suggestions: AddressSuggestion[] };

    if (!Array.isArray(payload.suggestions) || Date.now() - payload.cachedAt > cacheTtlMs) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return payload.suggestions;
  } catch {
    window.sessionStorage.removeItem(cacheKey);
    return null;
  }
}

function writeCachedAddressSuggestions(cacheKey: string, suggestions: AddressSuggestion[]) {
  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        suggestions,
      }),
    );
  } catch {
    // Address suggestion caching is best-effort only.
  }
}
