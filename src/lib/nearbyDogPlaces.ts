export type NearbyDogPlaceCategory = 'dog_park' | 'groomer' | 'pet_shop' | 'veterinary';

export type NearbyDogPlace = {
  category: NearbyDogPlaceCategory;
  categoryLabel: string;
  distanceMeters: number;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  source: 'OpenStreetMap / Overpass';
};

export type NearbyDogPlacesResult = {
  attribution: string;
  fromCache: boolean;
  places: NearbyDogPlace[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CachePayload = {
  cachedAt: number;
  places: NearbyDogPlace[];
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

export class NearbyDogPlacesError extends Error {
  code: NearbyDogPlacesErrorCode;

  constructor(code: NearbyDogPlacesErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
const cacheTtlMs = 10 * 60 * 1000;
const cachePrefix = 'dogcareai.nearbyDogPlaces.v1';
const defaultRadiusMeters = 5000;
const defaultLimit = 12;

const categoryLabels: Record<NearbyDogPlaceCategory, string> = {
  dog_park: 'Dog park',
  groomer: 'Groomer',
  pet_shop: 'Pet shop',
  veterinary: 'Veterinary clinic',
};

export function getCurrentPosition(): Promise<Coordinates> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(
      new NearbyDogPlacesError('geolocation_unsupported', 'Geolocation is not supported in this browser.'),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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
  coordinates: Coordinates,
  options: { limit?: number; radiusMeters?: number } = {},
): Promise<NearbyDogPlacesResult> {
  const radiusMeters = options.radiusMeters ?? defaultRadiusMeters;
  const limit = options.limit ?? defaultLimit;
  const cacheKey = getCacheKey(coordinates, radiusMeters);
  const cachedPlaces = readCachedPlaces(cacheKey);

  if (cachedPlaces) {
    return {
      attribution: 'Data source: OpenStreetMap contributors via Overpass API.',
      fromCache: true,
      places: cachedPlaces.slice(0, limit),
    };
  }

  const query = buildOverpassQuery(coordinates, radiusMeters);
  const response = await fetch(`${overpassEndpoint}?${new URLSearchParams({ data: query }).toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new NearbyDogPlacesError('api_error', 'OpenStreetMap place search is unavailable right now.');
  }

  const data = (await response.json()) as OverpassResponse;
  const places = normalizeOverpassElements(data.elements ?? [], coordinates)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);

  writeCachedPlaces(cacheKey, places);

  return {
    attribution: 'Data source: OpenStreetMap contributors via Overpass API.',
    fromCache: false,
    places,
  };
}

function buildOverpassQuery({ latitude, longitude }: Coordinates, radiusMeters: number) {
  const around = `(around:${radiusMeters},${latitude},${longitude})`;

  return `
    [out:json][timeout:18];
    (
      node["amenity"="veterinary"]${around};
      way["amenity"="veterinary"]${around};
      relation["amenity"="veterinary"]${around};
      node["shop"="pet"]${around};
      way["shop"="pet"]${around};
      relation["shop"="pet"]${around};
      node["leisure"="dog_park"]${around};
      way["leisure"="dog_park"]${around};
      relation["leisure"="dog_park"]${around};
      node["shop"="pet_grooming"]${around};
      way["shop"="pet_grooming"]${around};
      relation["shop"="pet_grooming"]${around};
      node["shop"="dog_grooming"]${around};
      way["shop"="dog_grooming"]${around};
      relation["shop"="dog_grooming"]${around};
      node["craft"="dog_grooming"]${around};
      way["craft"="dog_grooming"]${around};
      relation["craft"="dog_grooming"]${around};
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
      category,
      categoryLabel: categoryLabels[category],
      distanceMeters: getDistanceMeters(origin, { latitude, longitude }),
      id,
      latitude,
      longitude,
      name: getPlaceName(element.tags ?? {}, category),
      source: 'OpenStreetMap / Overpass',
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

    if (!Array.isArray(payload.places) || Date.now() - payload.cachedAt > cacheTtlMs) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return payload.places;
  } catch {
    window.sessionStorage.removeItem(cacheKey);
    return null;
  }
}

function writeCachedPlaces(cacheKey: string, places: NearbyDogPlace[]) {
  try {
    const payload: CachePayload = {
      cachedAt: Date.now(),
      places,
    };

    window.sessionStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Cache writes are best-effort only; the feature still works without sessionStorage.
  }
}
