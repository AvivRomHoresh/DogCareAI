import { useEffect, useMemo, useState } from 'react';
import { ProductRecommendationCard } from '../components/ProductRecommendationCard';
import { ProductRecommendationFilters } from '../components/ProductRecommendationFilters';
import { RecommendationsIcon } from '../components/icons/RecommendationsIcon';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import {
  applyProductApiEnrichments,
  filterRecommendations,
  getProductCatalogIds,
  getRecommendationContext,
  getRecommendedProducts,
  loadProductApiEnrichments,
} from '../lib/productRecommendations';
import type { ProductApiEnrichment, ProductRecommendationFilter } from '../lib/productRecommendations';

const anonymousFavoritesKey = 'dogcareai.productFavorites.anonymous';

export function RecommendationsPage() {
  const { user } = useAuth();
  const { activeDog, dogs, error: dogsError, isLoading } = useDogs();
  const [filter, setFilter] = useState<ProductRecommendationFilter>('all');
  const [apiEnrichments, setApiEnrichments] = useState<Record<string, ProductApiEnrichment | null>>({});
  const [areFavoritesLoaded, setAreFavoritesLoaded] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const favoritesKey = user?.id ? `dogcareai.productFavorites.${user.id}` : anonymousFavoritesKey;
  const context = useMemo(() => getRecommendationContext(activeDog), [activeDog]);
  const recommendations = useMemo(() => getRecommendedProducts(activeDog), [activeDog]);
  const catalogProductIds = useMemo(() => getProductCatalogIds(), []);
  const displayRecommendations = useMemo(
    () => applyProductApiEnrichments(recommendations, apiEnrichments),
    [apiEnrichments, recommendations],
  );
  const visibleSavedCount = useMemo(
    () => displayRecommendations.filter((product) => savedIds.has(product.id)).length,
    [displayRecommendations, savedIds],
  );
  const filteredRecommendations = useMemo(
    () => filterRecommendations(displayRecommendations, filter, savedIds),
    [displayRecommendations, filter, savedIds],
  );

  useEffect(() => {
    let isCurrent = true;

    loadProductApiEnrichments(recommendations).then((nextEnrichments) => {
      if (isCurrent) {
        setApiEnrichments(nextEnrichments);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [recommendations]);

  useEffect(() => {
    setAreFavoritesLoaded(false);

    try {
      const rawValue = window.localStorage.getItem(favoritesKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      const parsedIds = Array.isArray(parsedValue) ? parsedValue.filter((value) => typeof value === 'string') : [];
      const validIds = parsedIds.filter((id) => catalogProductIds.has(id));
      setSavedIds(new Set(validIds));

      if (validIds.length !== parsedIds.length) {
        window.localStorage.setItem(favoritesKey, JSON.stringify(validIds));
      }
    } catch {
      setSavedIds(new Set());
    }

    setAreFavoritesLoaded(true);
  }, [catalogProductIds, favoritesKey]);

  useEffect(() => {
    if (!areFavoritesLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(favoritesKey, JSON.stringify(Array.from(savedIds)));
    } catch {
      // Favorites are a local demo convenience; the catalog still works if localStorage is unavailable.
    }
  }, [areFavoritesLoaded, favoritesKey, savedIds]);

  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const activeDogLabel = activeDog ? `Recommendations for ${activeDog.name}` : 'Product recommendations';
  const profileNote = context.hasLimitedProfileData
    ? `Some profile details are missing or unclear (${context.profileNotes.join(', ')}), so general dog-care recommendations are included.`
    : `Using ${activeDog?.name}'s breed, age, and size where available.`;

  return (
    <div className="space-y-5">
      <header className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center justify-center gap-3 text-teal-800">
          <RecommendationsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Recommendations</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Browse personalized product ideas for your dog based on their profile, size, age, and needs.
        </p>
      </header>

      {isLoading ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading dog context...
        </section>
      ) : null}

      {dogsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
          Could not load dog profiles. {dogsError}
        </section>
      ) : null}

      {!isLoading && !dogsError && dogs.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 shadow-sm">
          Create a dog profile to personalize recommendations. General dog-care product ideas can be shown once a dog is
          selected.
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Catalog</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">{activeDogLabel}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{profileNote}</p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
              These are browsing ideas only. Food and treat cards may use Open Pet Food Facts when results are clean.
              Check labels, sizing, and professional guidance when needed.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700 lg:min-w-64">
            <p className="font-semibold text-slate-900">Profile signals</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-slate-500">Age</dt>
                <dd className="font-semibold capitalize">{context.ageGroup}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Size</dt>
                <dd className="font-semibold capitalize">{context.sizeGroup}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Breed match</dt>
                <dd className="font-semibold capitalize">{context.breedGroup.replace(/-/g, ' ')}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5">
          <ProductRecommendationFilters currentFilter={filter} onChange={setFilter} savedCount={visibleSavedCount} />
        </div>
      </section>

      {filteredRecommendations.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 shadow-sm">
          No saved recommendations yet. Star a product idea to keep it in this browser for later.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRecommendations.map((product) => (
          <ProductRecommendationCard
            key={product.id}
            brand={product.brand}
            category={product.category}
            id={product.id}
            imageUrl={product.imageUrl}
            isApiAssisted={product.isApiAssisted}
            isSaved={savedIds.has(product.id)}
            matchStrength={product.matchStrength}
            officialUrl={product.officialUrl}
            onToggleSaved={toggleSaved}
            placeholderAccent={product.placeholderAccent}
            placeholderLabel={product.placeholderLabel}
            productName={product.productName}
            reason={product.reason}
            sourceLabel={product.sourceLabel}
          />
        ))}
      </section>
    </div>
  );
}
