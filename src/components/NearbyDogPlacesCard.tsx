import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  fetchNearbyDogPlaces,
  getCurrentPosition,
  NearbyDogPlacesError,
  type NearbyDogPlace,
} from '../lib/nearbyDogPlaces';

type SearchStatus = 'api-error' | 'idle' | 'loading' | 'no-results' | 'permission-denied' | 'results' | 'unsupported';

export function NearbyDogPlacesCard() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [places, setPlaces] = useState<NearbyDogPlace[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFindPlaces = async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const coordinates = await getCurrentPosition();
      const result = await fetchNearbyDogPlaces(coordinates, { limit: 12, radiusMeters: 5000 });

      setPlaces(result.places);
      setFromCache(result.fromCache);
      setStatus(result.places.length > 0 ? 'results' : 'no-results');
    } catch (error) {
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
      } else {
        setErrorMessage('Nearby dog places could not be loaded right now.');
      }

      setStatus('api-error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Nearby dog places</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Find useful places near you</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Search nearby vets, pet shops, dog parks, and groomers using your browser location and OpenStreetMap data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFindPlaces}
          disabled={isLoading}
          className="inline-flex justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Searching...' : 'Find near me'}
        </button>
      </div>

      <div className="mt-4">
        {status === 'idle' ? (
          <InfoBox>
            Location is requested only after you click. No Google Maps, Google Places, API keys, or paid services are used.
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

        {status === 'api-error' ? (
          <WarningBox>
            {errorMessage ?? 'Nearby dog places are unavailable right now.'} Try again later or search manually if you need
            urgent help.
          </WarningBox>
        ) : null}

        {status === 'no-results' ? (
          <InfoBox>
            No nearby dog places were found in the current search radius. Try again from another location or search manually.
          </InfoBox>
        ) : null}

        {status === 'results' ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Showing up to 12 results within about 5 km.</span>
              {fromCache ? <span className="rounded-full bg-stone-100 px-2 py-1 font-medium">Cached result</span> : null}
            </div>
            <div className="grid gap-3">
              {places.map((place) => (
                <article key={place.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">{place.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{place.categoryLabel}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                      {formatDistance(place.distanceMeters)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Source: {place.source}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Data source: OpenStreetMap contributors via Overpass API. Results may be incomplete and are not emergency-service
        availability.
      </p>
    </section>
  );
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function InfoBox({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">{children}</p>;
}

function WarningBox({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{children}</p>;
}
