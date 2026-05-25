import { productCategoryLabels } from '../lib/productRecommendations';
import type { ProductRecommendationFilter } from '../lib/productRecommendations';

type ProductRecommendationFiltersProps = {
  currentFilter: ProductRecommendationFilter;
  onChange: (filter: ProductRecommendationFilter) => void;
  savedCount: number;
};

const filterItems: Array<{ label: string; value: ProductRecommendationFilter }> = [
  { label: 'All', value: 'all' },
  { label: productCategoryLabels.food, value: 'food' },
  { label: productCategoryLabels.treats, value: 'treats' },
  { label: productCategoryLabels.toys, value: 'toys' },
  { label: productCategoryLabels.accessories, value: 'accessories' },
  { label: 'Saved', value: 'saved' },
];

export function ProductRecommendationFilters({
  currentFilter,
  onChange,
  savedCount,
}: ProductRecommendationFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Product recommendation filters">
      {filterItems.map((item) => {
        const isActive = item.value === currentFilter;
        const label = item.value === 'saved' ? `${item.label} (${savedCount})` : item.label;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={[
              'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              isActive
                ? 'border-teal-300 bg-teal-50 text-teal-900'
                : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
