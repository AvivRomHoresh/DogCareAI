import { useState } from 'react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  fetchAddressSuggestions,
  fetchNearbyDogPlaces,
  geocodeAddress,
  getCurrentPosition,
  NearbyDogPlacesError,
  NearbyGeocodingError,
  readLastCachedNearbyDogPlaces,
  type AddressSuggestion,
  type NearbyDogPlace,
  type NearbyDogPlaceCategory,
  type SearchOrigin,
} from '../lib/nearbyDogPlaces';

type SearchStatus =
  | 'address-empty'
  | 'address-not-found'
  | 'api-error'
  | 'geocoding-error'
  | 'idle'
  | 'loading'
  | 'no-results'
  | 'permission-denied'
  | 'results'
  | 'unsupported';
type PlaceFilter = 'all' | NearbyDogPlaceCategory;
type SortMode = 'best_match' | 'distance' | 'name';

const filterOptions: Array<{ label: string; value: PlaceFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Vets', value: 'veterinary' },
  { label: 'Pet shops', value: 'pet_shop' },
  { label: 'Dog parks', value: 'dog_park' },
  { label: 'Dog groomers', value: 'groomer' },
];

const sortOptions: Array<{ helper: string; label: string; value: SortMode }> = [
  { helper: 'Best match uses available place details, not ratings.', label: 'Best match', value: 'best_match' },
  { helper: 'Nearest first', label: 'Distance', value: 'distance' },
  { helper: 'Alphabetical', label: 'Name A-Z', value: 'name' },
];

const radiusOptions = [
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
];

const googleCategoryLabels: Record<PlaceFilter, string> = {
  all: 'dog services',
  dog_park: 'dog parks',
  groomer: 'dog groomers',
  pet_shop: 'pet shops',
  veterinary: 'veterinary clinics',
};

export function NearbyDogPlacesCard() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [places, setPlaces] = useState<NearbyDogPlace[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<PlaceFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('best_match');
  const [addressInput, setAddressInput] = useState('');
  const [origin, setOrigin] = useState<SearchOrigin | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);

  useEffect(() => {
    const cachedResult = readLastCachedNearbyDogPlaces();

    if (!cachedResult) {
      return;
    }

    setPlaces(cachedResult.places);
    setFromCache(true);
    setOrigin(cachedResult.origin);
    setRadiusMeters(cachedResult.radiusMeters);
    setStatus(cachedResult.places.length > 0 ? 'results' : 'no-results');
  }, []);

  useEffect(() => {
    const trimmedAddress = addressInput.trim();

    if (trimmedAddress.length < 3 || selectedSuggestion?.label === trimmedAddress) {
      setAddressSuggestions([]);
      setIsLoadingSuggestions(false);
      return undefined;
    }

    let isCurrent = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoadingSuggestions(true);

      fetchAddressSuggestions(trimmedAddress)
        .then((suggestions) => {
          if (isCurrent) {
            setAddressSuggestions(suggestions);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setAddressSuggestions([]);
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoadingSuggestions(false);
          }
        });
    }, 700);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [addressInput, selectedSuggestion]);

  const handleFindPlaces = async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const currentOrigin = await getCurrentPosition();
      await runNearbySearch(currentOrigin);
    } catch (error) {
      handleNearbyError(error);
    }
  };

  const handleAddressSearch = async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const addressOrigin =
        selectedSuggestion?.label === addressInput.trim()
          ? {
              label: selectedSuggestion.label,
              latitude: selectedSuggestion.latitude,
              longitude: selectedSuggestion.longitude,
              mode: 'address' as const,
            }
          : await geocodeAddress(addressInput);
      await runNearbySearch(addressOrigin);
    } catch (error) {
      handleNearbyError(error);
    }
  };

  const runNearbySearch = async (nextOrigin: SearchOrigin) => {
    const result = await fetchNearbyDogPlaces(nextOrigin, { limit: 30, radiusMeters });

    setOrigin(result.origin);
    setPlaces(result.places);
    setFromCache(result.fromCache);
    setStatus(result.places.length > 0 ? 'results' : 'no-results');
  };

  const handleNearbyError = (error: unknown) => {
    setPlaces([]);
    setFromCache(false);

    if (error instanceof NearbyDogPlacesError) {
      setErrorMessage(error.message);

      if (error.code === 'permission_denied') {
        setStatus('permission-denied');
        return;
      }

      if (error.code === 'geolocation_unsupported') {
        setStatus('unsupported');
        return;
      }
    } else if (error instanceof NearbyGeocodingError) {
      setErrorMessage(error.message);

      if (error.code === 'address_empty') {
        setStatus('address-empty');
        return;
      }

      if (error.code === 'address_not_found') {
        setStatus('address-not-found');
        return;
      }

      setStatus('geocoding-error');
      return;
    } else {
      setErrorMessage('Nearby dog places could not be loaded right now.');
    }

    setStatus('api-error');
  };

  const isLoading = status === 'loading';
  const displayedPlaces = getDisplayedPlaces(places, selectedFilter, sortMode);
  const googleFallbackUrl = origin ? getGoogleMapsFallbackUrl(origin, selectedFilter) : null;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Nearby dog places</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Find dog-friendly services near you</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Search nearby vets, pet shops, dog parks, and groomers using your browser location and OpenStreetMap data.
              Location is requested only when you click.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFindPlaces}
            disabled={isLoading}
            className="inline-flex justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Searching...' : places.length > 0 ? 'Refresh nearby places' : 'Find near me'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
            <span className="font-semibold">Free data source:</span> OpenStreetMap contributors via Overpass API. No Google
            Places, Google Maps API, Google Geolocation API, API key, billing, or paid service is used.
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
            Results may be incomplete and are not emergency-service availability. Call a veterinarian directly for urgent care.
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-950">Search from address</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Suggestions use Photon after a short pause. Nominatim runs only after you click Search address.
            </span>
            <input
              className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => {
                setAddressInput(event.target.value);
                setSelectedSuggestion(null);
              }}
              placeholder="התזמורת 60, ראשון לציון"
              type="text"
              value={addressInput}
            />
            {isLoadingSuggestions ? (
              <span className="mt-2 block text-xs text-slate-500">Finding address suggestions...</span>
            ) : null}
            {addressSuggestions.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {addressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => {
                      setAddressInput(suggestion.label);
                      setSelectedSuggestion(suggestion);
                      setAddressSuggestions([]);
                    }}
                    className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm leading-5 text-slate-700 transition last:border-b-0 hover:bg-teal-50 hover:text-teal-950"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            ) : null}
          </label>

          <div>
            <label className="block text-sm font-semibold text-slate-950" htmlFor="nearby-radius">
              Radius
            </label>
            <select
              className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              id="nearby-radius"
              onChange={(event) => setRadiusMeters(Number(event.target.value))}
              value={radiusMeters}
            >
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isLoading}
            className="inline-flex justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Search address
          </button>
          <button
            type="button"
            onClick={handleFindPlaces}
            disabled={isLoading}
            className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Use my current location
          </button>
        </div>
      </section>

      {places.length > 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-950">Filter by place type</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedFilter(option.value)}
                    className={[
                      'rounded-full border px-3 py-2 text-sm font-medium transition',
                      selectedFilter === option.value
                        ? 'border-teal-200 bg-teal-50 text-teal-900'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-950">Sort results</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortMode(option.value)}
                    className={[
                      'rounded-2xl border p-3 text-left text-sm transition',
                      sortMode === option.value
                        ? 'border-teal-200 bg-teal-50 text-teal-950'
                        : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
                    ].join(' ')}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{option.helper}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
        {origin ? (
          <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-700">
            Searching near: <span className="font-semibold text-slate-950">{origin.label}</span>
            <span className="block text-xs text-slate-500">
              Radius: {formatDistance(radiusMeters)}. Results are based on OpenStreetMap and may miss some local businesses.
            </span>
          </div>
        ) : null}

        {status === 'idle' ? (
          <InfoBox>
            Click "Find near me" to search. The app will ask your browser for location permission only after that action.
          </InfoBox>
        ) : null}

        {status === 'loading' ? <InfoBox>Checking your location and searching OpenStreetMap...</InfoBox> : null}

        {status === 'permission-denied' ? (
          <WarningBox>
            Location permission was denied. Enable location access in your browser and try again, or use your usual search app
            for nearby dog services.
          </WarningBox>
        ) : null}

        {status === 'unsupported' ? (
          <WarningBox>
            This browser does not support geolocation. You can still search manually for nearby vets, pet shops, dog parks,
            or groomers.
          </WarningBox>
        ) : null}

        {status === 'address-empty' ? (
          <WarningBox>Enter an address before searching, or use your current location.</WarningBox>
        ) : null}

        {status === 'address-not-found' ? (
          <WarningBox>
            Address not found. Check the spelling, try a nearby landmark, or use your current location.
          </WarningBox>
        ) : null}

        {status === 'geocoding-error' ? (
          <WarningBox>
            {errorMessage ?? 'Address search is unavailable right now.'} Try your current location or search manually.
          </WarningBox>
        ) : null}

        {status === 'api-error' ? (
          <WarningBox>
            {errorMessage ?? 'Nearby dog places are unavailable right now.'} Try again later or search manually if you need
            urgent help.
          </WarningBox>
        ) : null}

        {status === 'no-results' ? (
          <div className="space-y-3">
            <InfoBox>
              No nearby dog places were found in the current search radius. Results are based on OpenStreetMap and may miss
              some local businesses.
            </InfoBox>
            <div className="flex flex-wrap gap-3">
              <HelperPill>Try another address</HelperPill>
              <HelperPill>Try a larger radius</HelperPill>
              {googleFallbackUrl ? (
                <ExternalButton href={googleFallbackUrl}>{getGoogleFallbackLabel(selectedFilter)}</ExternalButton>
              ) : null}
            </div>
          </div>
        ) : null}

        {status === 'results' ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Showing {displayedPlaces.length} of {places.length} results within about 5 km.
              </span>
              {fromCache ? <span className="rounded-full bg-stone-100 px-2 py-1 font-medium">Cached result</span> : null}
              {sortMode === 'best_match' ? (
                <span className="rounded-full bg-teal-50 px-2 py-1 font-medium text-teal-800">
                  Best match uses available place details, not ratings.
                </span>
              ) : null}
            </div>

            {displayedPlaces.length === 0 ? (
              <div className="space-y-3">
                <InfoBox>
                  No places match this filter. Try All, another address, or a larger radius. OSM may miss some local
                  businesses.
                </InfoBox>
                {googleFallbackUrl ? (
                  <ExternalButton href={googleFallbackUrl}>{getGoogleFallbackLabel(selectedFilter)}</ExternalButton>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-3">
                {displayedPlaces.map((place) => (
                  <PlaceResultCard key={place.id} place={place} />
                ))}
              </div>
            )}

            {googleFallbackUrl ? (
              <div className="mt-4">
                <ExternalButton href={googleFallbackUrl}>{getGoogleFallbackLabel(selectedFilter)}</ExternalButton>
              </div>
            ) : null}
          </>
        ) : null}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
        Data source: OpenStreetMap contributors via Overpass API. Results may be incomplete and are not emergency-service
        availability.
        </p>
      </section>
    </section>
  );
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function getDisplayedPlaces(places: NearbyDogPlace[], selectedFilter: PlaceFilter, sortMode: SortMode) {
  const filteredPlaces =
    selectedFilter === 'all' ? places : places.filter((place) => place.category === selectedFilter);

  return [...filteredPlaces].sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name) || a.distanceMeters - b.distanceMeters;
    }

    if (sortMode === 'best_match') {
      return b.dataCompletenessScore - a.dataCompletenessScore || a.distanceMeters - b.distanceMeters;
    }

    return a.distanceMeters - b.distanceMeters;
  });
}

function PlaceResultCard({ place }: { place: NearbyDogPlace }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{place.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <MiniBadge>{place.categoryLabel}</MiniBadge>
            <MiniBadge>{formatDistance(place.distanceMeters)}</MiniBadge>
            {place.openingHours ? <MiniBadge>Hours listed</MiniBadge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
            href={place.googleMapsDirectionsUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Navigate
          </a>
          <a
            className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
            href={place.googleMapsSearchUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Find on Google Maps
          </a>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Navigate uses the mapped OpenStreetMap location. Google Maps search may show similar businesses if the place name is
        ambiguous.
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <PlaceDetail label="Address" value={place.address ?? 'Address not listed in OSM'} />
        <PlaceDetail
          label="Phone"
          value={
            place.phone ? (
              <a className="font-medium text-teal-700 hover:text-teal-900" href={`tel:${getTelHref(place.phone)}`}>
                {place.phone}
              </a>
            ) : (
              'Phone not listed'
            )
          }
        />
        {place.openingHours ? <PlaceDetail label="Opening hours" value={place.openingHours} /> : null}
        <div>
          <dt className="font-medium text-slate-700">Website</dt>
          <dd className="mt-1 text-slate-600">
            {place.website ? (
              <a
                className="break-words font-medium text-teal-700 hover:text-teal-900"
                href={place.website}
                rel="noopener noreferrer"
                target="_blank"
              >
                {place.website}
              </a>
            ) : (
              'Website not listed'
            )}
          </dd>
        </div>
        {place.facebookUrl ? (
          <SocialLink label="Facebook" url={place.facebookUrl} />
        ) : null}
        {place.instagramUrl ? (
          <SocialLink label="Instagram" url={place.instagramUrl} />
        ) : null}
      </dl>

      <p className="mt-4 text-xs text-slate-500">
        Source: {place.source}. Completeness score: {place.dataCompletenessScore}.
      </p>
    </article>
  );
}

function getGoogleMapsFallbackUrl(origin: SearchOrigin, selectedFilter: PlaceFilter) {
  const searchTerm = googleCategoryLabels[selectedFilter];
  const query = encodeURIComponent(
    origin.mode === 'address'
      ? `${searchTerm} near ${origin.label}`
      : `${searchTerm} near ${origin.label} ${origin.latitude},${origin.longitude}`,
  );

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function getGoogleFallbackLabel(selectedFilter: PlaceFilter) {
  return `Search ${googleCategoryLabels[selectedFilter]} on Google Maps`;
}

function getTelHref(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function PlaceDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-slate-700">{label}</dt>
      <dd className="mt-1 text-slate-600">{value}</dd>
    </div>
  );
}

function SocialLink({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-700">{label}</dt>
      <dd className="mt-1 text-slate-600">
        <a className="break-words font-medium text-teal-700 hover:text-teal-900" href={url} rel="noopener noreferrer" target="_blank">
          {url}
        </a>
      </dd>
    </div>
  );
}

function MiniBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function HelperPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-slate-700">
      {children}
    </span>
  );
}

function ExternalButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function InfoBox({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">{children}</p>;
}

function WarningBox({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{children}</p>;
}
