import { useEffect, useState } from 'react';
import { productCategoryLabels } from '../lib/productRecommendations';
import type { ProductRecommendationCategory } from '../lib/productRecommendations';

type ProductRecommendationCardProps = {
  brand: string;
  category: ProductRecommendationCategory;
  id: string;
  imageUrl?: string;
  isApiAssisted?: boolean;
  isSaved: boolean;
  matchStrength: string;
  officialUrl: string;
  onToggleSaved: (id: string) => void;
  placeholderAccent: 'amber' | 'emerald' | 'rose' | 'sky' | 'teal' | 'violet';
  placeholderLabel: string;
  productName: string;
  reason: string;
  sourceLabel: string;
};

const placeholderClasses: Record<ProductRecommendationCardProps['placeholderAccent'], string> = {
  amber: 'border-amber-200 bg-amber-100 text-amber-950',
  emerald: 'border-emerald-200 bg-emerald-100 text-emerald-950',
  rose: 'border-rose-200 bg-rose-100 text-rose-950',
  sky: 'border-sky-200 bg-sky-100 text-sky-950',
  teal: 'border-teal-200 bg-teal-100 text-teal-950',
  violet: 'border-violet-200 bg-violet-100 text-violet-950',
};

export function ProductRecommendationCard({
  brand,
  category,
  id,
  imageUrl,
  isApiAssisted,
  isSaved,
  matchStrength,
  officialUrl,
  onToggleSaved,
  placeholderAccent,
  placeholderLabel,
  productName,
  reason,
  sourceLabel,
}: ProductRecommendationCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(imageUrl && !hasImageError);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className={`flex aspect-[4/3] items-center justify-center border-b text-lg font-bold ${placeholderClasses[placeholderAccent]}`}>
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-contain p-4"
            loading="lazy"
            onError={() => setHasImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{placeholderLabel}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {productCategoryLabels[category]}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight text-slate-950">{productName}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{brand}</p>
          </div>

          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${productName} from saved products` : `Save ${productName} for later`}
            onClick={() => onToggleSaved(id)}
            className={[
              'rounded-full border px-3 py-2 text-lg leading-none transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              isSaved
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-stone-200 bg-white text-slate-500 hover:border-stone-300 hover:text-slate-800',
            ].join(' ')}
          >
            <span aria-hidden="true">{isSaved ? '★' : '☆'}</span>
          </button>
        </div>

        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{reason}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-slate-600">
            {matchStrength === 'matched' ? 'Profile match' : 'General pick'}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-slate-600">
            {sourceLabel}
          </span>
          {isApiAssisted ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
              API assisted
            </span>
          ) : null}
        </div>

        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-800"
        >
          Official info
        </a>
      </div>
    </article>
  );
}
