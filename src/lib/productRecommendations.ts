import type { Dog, DogActivityLevel } from '../types/dog';
import {
  buildSearchableBreedList,
  findBreedMatch,
  normalizeBreedName,
  sharedCuratedBreedNames,
} from './dogBreedMatching';

export type ProductRecommendationCategory = 'food' | 'treats' | 'toys' | 'accessories';

export type ProductRecommendationFilter = ProductRecommendationCategory | 'all' | 'saved';

export type DogAgeGroup = 'puppy' | 'adult' | 'senior' | 'unknown';

export type DogSizeGroup = 'small' | 'medium' | 'large' | 'unknown';

export type ProductRecommendationType = 'brandCategory' | 'exactProduct' | 'fallback' | 'productLine';

type BreedGroup =
  | 'beagle'
  | 'border-collie'
  | 'bulldog'
  | 'french-bulldog'
  | 'german-shepherd'
  | 'golden-retriever'
  | 'labrador-retriever'
  | 'maltese'
  | 'mixed-breed'
  | 'poodle'
  | 'rottweiler'
  | 'shih-tzu'
  | 'siberian-husky';

type RecommendationTag =
  | BreedGroup
  | DogAgeGroup
  | DogSizeGroup
  | DogActivityLevel
  | 'allergy-aware'
  | 'chew'
  | 'comfort'
  | 'enrichment'
  | 'grooming'
  | 'training'
  | 'walking';

export type ProductRecommendation = {
  allowedAgeGroups?: DogAgeGroup[];
  allowedSizes?: DogSizeGroup[];
  apiCategoryTag?: 'dog-food' | 'dog-treats';
  apiSearchTerm?: string;
  brand: string;
  category: ProductRecommendationCategory;
  id: string;
  imageUrl?: string;
  isApiAssisted?: boolean;
  isGeneralFallback?: boolean;
  matchStrength?: 'general' | 'matched';
  officialUrl: string;
  placeholderAccent: 'amber' | 'emerald' | 'rose' | 'sky' | 'teal' | 'violet';
  placeholderLabel: string;
  productType: ProductRecommendationType;
  productName: string;
  reason: string;
  sourceLabel: string;
  tags: RecommendationTag[];
};

export type ProductRecommendationResult = ProductRecommendation & {
  matchStrength: 'general' | 'matched';
};

type OpenPetFoodFactsProduct = {
  brands?: string;
  categories_tags?: string[];
  image_front_small_url?: string;
  image_front_url?: string;
  product_name?: string;
  url?: string;
};

type OpenPetFoodFactsResponse = {
  products?: OpenPetFoodFactsProduct[];
};

export type ProductApiEnrichment = {
  brand: string;
  imageUrl: string;
  officialUrl: string;
  productName: string;
  sourceLabel: string;
};

export type RecommendationContext = {
  ageGroup: DogAgeGroup;
  breedGroup: BreedGroup | 'unknown';
  hasUnrecognizedBreedInput: boolean;
  inferredSizeFromBreed: boolean;
  hasLimitedProfileData: boolean;
  matchedBreedName: string | null;
  profileNotes: string[];
  sizeGroup: DogSizeGroup;
};

export const productCategoryLabels: Record<ProductRecommendationCategory, string> = {
  accessories: 'Accessories',
  food: 'Food',
  toys: 'Toys',
  treats: 'Treats',
};

const canonicalBreedGroups: Record<string, BreedGroup> = {
  Beagle: 'beagle',
  'Border Collie': 'border-collie',
  Bulldog: 'bulldog',
  'French Bulldog': 'french-bulldog',
  'German Shepherd Dog': 'german-shepherd',
  'Golden Retriever': 'golden-retriever',
  'Labrador Retriever': 'labrador-retriever',
  Maltese: 'maltese',
  'Mixed Breed': 'mixed-breed',
  Poodle: 'poodle',
  Rottweiler: 'rottweiler',
  'Shih Tzu': 'shih-tzu',
  'Siberian Husky': 'siberian-husky',
};

const breedSizeHints: Record<BreedGroup, DogSizeGroup> = {
  beagle: 'medium',
  'border-collie': 'medium',
  bulldog: 'medium',
  'french-bulldog': 'small',
  'german-shepherd': 'large',
  'golden-retriever': 'large',
  'labrador-retriever': 'large',
  maltese: 'small',
  'mixed-breed': 'unknown',
  poodle: 'unknown',
  rottweiler: 'large',
  'shih-tzu': 'small',
  'siberian-husky': 'large',
};

const productBreedSearchList = buildSearchableBreedList([], () => '', sharedCuratedBreedNames);
const sizeGroups: DogSizeGroup[] = ['small', 'medium', 'large'];
const ageGroups: DogAgeGroup[] = ['puppy', 'adult', 'senior'];

const productCatalog: ProductRecommendation[] = [
  {
    apiCategoryTag: 'dog-food',
    apiSearchTerm: 'Wellness dog food',
    brand: 'Wellness',
    category: 'food',
    id: 'food-wellness-small-adult-line',
    imageUrl: 'https://www.wellnesspetfood.com/wp-content/uploads/2024/01/For-Dogs.jpg',
    officialUrl: 'https://www.wellnesspetfood.com/dog-food/',
    placeholderAccent: 'amber',
    placeholderLabel: 'Food',
    productType: 'productLine',
    productName: 'Adult dog food product line',
    reason: 'Explore this official dog food line for small adult dogs and compare label guidance before choosing.',
    sourceLabel: 'Curated official dog product line',
    tags: ['small', 'adult', 'maltese', 'shih-tzu', 'french-bulldog'],
  },
  {
    apiCategoryTag: 'dog-food',
    apiSearchTerm: 'IAMS dog food',
    brand: 'IAMS',
    category: 'food',
    id: 'food-iams-adult-dog-line',
    imageUrl: 'https://www.iams.com/sites/g/files/fnmzdf9391/files/2025-06/Iams_logo.jpg',
    officialUrl: 'https://www.iams.com/dog/dog-food',
    placeholderAccent: 'emerald',
    placeholderLabel: 'Food',
    productType: 'productLine',
    productName: 'Adult dog food product line',
    reason: 'A dog-food line to compare for medium and large adult dogs, using label guidance for final fit.',
    sourceLabel: 'Curated official dog product line',
    tags: ['adult', 'medium', 'large'],
  },
  {
    apiCategoryTag: 'dog-food',
    apiSearchTerm: 'Merrick dog food',
    brand: 'Merrick',
    category: 'food',
    id: 'food-merrick-large-adult-line',
    imageUrl: 'https://www.merrickpetcare.com/sites/default/files/2024-04/logo-merrick-main_0.svg',
    officialUrl: 'https://www.merrickpetcare.com/dog-food/',
    placeholderAccent: 'rose',
    placeholderLabel: 'Food',
    productType: 'productLine',
    productName: 'Adult dog food product line',
    reason: 'A dog-food line to compare for medium and large adult dogs with similar profile details.',
    sourceLabel: 'Curated official dog product line',
    tags: ['adult', 'large', 'medium', 'golden-retriever', 'labrador-retriever', 'rottweiler'],
  },
  {
    apiCategoryTag: 'dog-food',
    apiSearchTerm: 'Blue Buffalo dog food',
    brand: 'Blue Buffalo',
    category: 'food',
    id: 'food-blue-dog-recommender',
    imageUrl: 'https://www.bluebuffalo.com/globalassets/00-global/newblueshield2x.png',
    isGeneralFallback: true,
    officialUrl: 'https://www.bluebuffalo.com/dog-food/',
    placeholderAccent: 'teal',
    placeholderLabel: 'Food',
    productType: 'fallback',
    productName: 'Dog food recommender overview',
    reason: 'A dog-specific browsing fallback when profile details are broad or unclear.',
    sourceLabel: 'Curated official dog info page',
    tags: ['unknown'],
  },
  {
    apiCategoryTag: 'dog-treats',
    apiSearchTerm: 'Zuke dog treats',
    brand: 'Zuke\'s',
    category: 'treats',
    id: 'treat-zukes-training-line',
    imageUrl: 'https://www.zukes.com/sites/default/files/2024-04/_MRK_LogoAssets_Zukes_Original_Logo_2023.svg',
    officialUrl: 'https://www.zukes.com/',
    placeholderAccent: 'rose',
    placeholderLabel: 'Treat',
    productType: 'productLine',
    productName: 'Training treats product line',
    reason: 'May fit short training sessions or reward routines for small and medium dogs.',
    sourceLabel: 'Curated official brand info',
    tags: ['puppy', 'adult', 'small', 'medium', 'training', 'beagle', 'maltese', 'poodle', 'shih-tzu'],
  },
  {
    apiCategoryTag: 'dog-treats',
    apiSearchTerm: 'Milk Bone dog treats',
    brand: 'Milk-Bone',
    category: 'treats',
    id: 'treat-milkbone-dog-treats',
    imageUrl: 'https://www.milkbone.com/milkbone/logo/86226/image-thumb__86226___auto_40cd750bba9870f18aada2478b24840a/10_79134_Multi_Banner_Resize_MilkBone.06324da2.jpg',
    isGeneralFallback: true,
    officialUrl: 'https://www.milkbone.com/dog-treats',
    placeholderAccent: 'amber',
    placeholderLabel: 'Treat',
    productType: 'fallback',
    productName: 'Dog treats product line',
    reason: 'A broad dog-treat browsing fallback for routine rewards; check label and size guidance.',
    sourceLabel: 'Curated official dog product line',
    tags: ['unknown'],
  },
  {
    apiCategoryTag: 'dog-treats',
    apiSearchTerm: 'Old Mother Hubbard dog treats',
    brand: 'Old Mother Hubbard',
    category: 'treats',
    id: 'treat-old-mother-hubbard-medium',
    imageUrl: 'https://www.wellnesspetfood.com/wp-content/uploads/2025/02/OMH_Landing_Page_update.png',
    officialUrl: 'https://www.oldmotherhubbard.com/dog-treats/',
    placeholderAccent: 'sky',
    placeholderLabel: 'Treat',
    productType: 'productLine',
    productName: 'Crunchy dog treats product line',
    reason: 'A treat line to explore for medium adult dogs and scent-curious training routines.',
    sourceLabel: 'Curated official dog product line',
    tags: ['adult', 'medium', 'training', 'beagle', 'border-collie', 'mixed-breed'],
  },
  {
    brand: 'KONG',
    category: 'toys',
    id: 'toy-kong-classic-large',
    imageUrl: 'https://cdn11.bigcommerce.com/s-k3kxaf4rop/images/stencil/original/logo-resized_1761953642__90706.original.png',
    officialUrl: 'https://www.kongcompany.com/dog-toys/',
    placeholderAccent: 'rose',
    placeholderLabel: 'Toy',
    productType: 'productLine',
    productName: 'Classic dog toy product line',
    reason: 'May fit enrichment routines for medium and large dogs that enjoy chewing or food-puzzle style play.',
    sourceLabel: 'Curated official dog toy info',
    tags: ['enrichment', 'chew', 'adult', 'medium', 'large', 'labrador-retriever', 'golden-retriever', 'german-shepherd', 'rottweiler'],
  },
  {
    brand: 'Chuckit!',
    category: 'toys',
    id: 'toy-chuckit-fetch-large',
    imageUrl: 'https://www.chuckit-toys.co.uk/media/wysiwyg/icotheme/vintage/logo/Logo-Shorthand.png',
    officialUrl: 'https://www.chuckit-toys.com/',
    placeholderAccent: 'teal',
    placeholderLabel: 'Fetch',
    productType: 'productLine',
    productName: 'Fetch toy product line',
    reason: 'May fit active medium and large dogs that enjoy supervised outdoor play and retrieve games.',
    sourceLabel: 'Curated official brand info',
    tags: ['high', 'walking', 'medium', 'large', 'golden-retriever', 'labrador-retriever', 'siberian-husky', 'border-collie'],
  },
  {
    brand: 'Nylabone',
    category: 'toys',
    id: 'toy-nylabone-chew-large',
    imageUrl: 'https://www.nylabone.com/-/media/project/oneweb/nylabone/images/header-footer/nylabon_hp.jpg',
    officialUrl: 'https://www.nylabone.com/products',
    placeholderAccent: 'amber',
    placeholderLabel: 'Chew',
    productType: 'productLine',
    productName: 'Chew toy product line',
    reason: 'A chew-focused toy line for supervised enrichment in medium and large dogs.',
    sourceLabel: 'Curated official brand info',
    tags: ['chew', 'adult', 'large', 'medium', 'bulldog', 'german-shepherd', 'rottweiler'],
  },
  {
    brand: 'West Paw',
    category: 'toys',
    id: 'toy-west-paw-enrichment-medium-large',
    imageUrl: 'https://www.westpaw.com/cdn/shop/files/westpaw_1b1cf58b-e9b4-4bd4-a3f2-549cdb0a525a.jpg?v=1618496993&width=2000',
    officialUrl: 'https://www.westpaw.com/collections/dog-toys',
    placeholderAccent: 'emerald',
    placeholderLabel: 'Toy',
    productType: 'brandCategory',
    productName: 'Dog toy collection overview',
    reason: 'Can fit medium and large dogs with enrichment needs when you want durable toy ideas to compare.',
    sourceLabel: 'Curated official brand category',
    tags: ['enrichment', 'chew', 'adult', 'medium', 'large', 'mixed-breed'],
  },
  {
    brand: 'West Paw',
    category: 'toys',
    id: 'toy-west-paw-general-fallback',
    imageUrl: 'https://www.westpaw.com/cdn/shop/files/westpaw_1b1cf58b-e9b4-4bd4-a3f2-549cdb0a525a.jpg?v=1618496993&width=2000',
    isGeneralFallback: true,
    officialUrl: 'https://www.westpaw.com/collections/dog-toys',
    placeholderAccent: 'teal',
    placeholderLabel: 'Toy',
    productType: 'fallback',
    productName: 'Dog toy collection overview',
    reason: 'A broad dog-toy browsing fallback when breed or size details are unclear.',
    sourceLabel: 'Curated official dog toy category',
    tags: ['unknown'],
  },
  {
    brand: 'Snuggle Puppy',
    category: 'toys',
    id: 'toy-snuggle-puppy-small-comfort',
    imageUrl: 'https://snugglepuppy.com/cdn/shop/files/Medium-Biscuit_SP112-ECM_Main1.jpg?v=1769449563',
    officialUrl: 'https://snugglepuppy.com/products/snuggle-puppy',
    placeholderAccent: 'rose',
    placeholderLabel: 'Comfort',
    productType: 'exactProduct',
    productName: 'Comfort toy overview',
    reason: 'A gentle comfort-oriented idea to explore for puppies, seniors, and small companion dogs.',
    sourceLabel: 'Curated official product info',
    tags: ['comfort', 'puppy', 'senior', 'small', 'maltese', 'shih-tzu'],
  },
  {
    brand: 'Ruffwear',
    category: 'accessories',
    id: 'accessory-ruffwear-harness-medium-large',
    imageUrl: 'https://ruffwear.com/cdn/shop/collections/FW18-Product-Category-Header-Image-Harnesses_882x589.jpg?v=1771257639',
    officialUrl: 'https://ruffwear.com/collections/dog-harnesses',
    placeholderAccent: 'teal',
    placeholderLabel: 'Walk',
    productType: 'productLine',
    productName: 'Dog harness product line',
    reason: 'May fit walking routines for active medium and large dogs; compare harness size and fit before buying.',
    sourceLabel: 'Curated official harness line',
    tags: ['walking', 'high', 'medium', 'large', 'siberian-husky', 'german-shepherd', 'rottweiler', 'border-collie'],
  },
  {
    brand: 'Kurgo',
    category: 'accessories',
    id: 'accessory-kurgo-travel-medium',
    imageUrl: 'https://cdn.sanity.io/images/d075r9p6/production/9aacaeb693521a6dae28bc9c033d8a7cf5f37dd6-763x524.jpg?w=1200&h=630',
    officialUrl: 'https://www.kurgo.com/dog-travel',
    placeholderAccent: 'sky',
    placeholderLabel: 'Travel',
    productType: 'productLine',
    productName: 'Dog travel accessory line',
    reason: 'A practical accessory line for medium dogs that join errands, walks, or car trips.',
    sourceLabel: 'Curated official dog travel line',
    tags: ['walking', 'adult', 'medium', 'beagle', 'border-collie', 'mixed-breed'],
  },
  {
    brand: 'Earth Rated',
    category: 'accessories',
    id: 'accessory-earth-rated-walk-fallback',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0669/4040/3989/files/thelabsandco-alpha-3625_4.jpg?v=1678644118',
    isGeneralFallback: true,
    officialUrl: 'https://www.earthrated.com/products/',
    placeholderAccent: 'emerald',
    placeholderLabel: 'Walk',
    productType: 'fallback',
    productName: 'Walk and cleanup accessory overview',
    reason: 'A broad everyday-care fallback that stays useful when profile details are incomplete.',
    sourceLabel: 'Curated official product line',
    tags: ['unknown'],
  },
  {
    brand: 'Earthbath',
    category: 'accessories',
    id: 'accessory-earthbath-grooming',
    imageUrl: 'https://earthbath.com/cdn/shop/files/Untitled_design_66.png?v=1636156000',
    officialUrl: 'https://earthbath.com/',
    placeholderAccent: 'violet',
    placeholderLabel: 'Groom',
    productType: 'brandCategory',
    productName: 'Dog grooming product overview',
    reason: 'May fit grooming routines for dogs where coat care and comfort are part of daily care.',
    sourceLabel: 'Curated official brand info',
    tags: ['grooming', 'small', 'medium', 'large', 'golden-retriever', 'labrador-retriever', 'siberian-husky', 'shih-tzu', 'poodle', 'maltese'],
  },
  {
    brand: 'Wild One',
    category: 'accessories',
    id: 'accessory-wild-one-walk-small-medium',
    imageUrl: 'https://wildone.com/cdn/shop/collections/WO_VM_Studio_PDP_WalkandTreat_Harness_Moonstone_Dog_01_f82f3410-dd45-49d8-b267-1589dec8c01a.jpg?v=1771432400',
    officialUrl: 'https://www.wildone.com/collections/walk',
    placeholderAccent: 'amber',
    placeholderLabel: 'Walk',
    productType: 'productLine',
    productName: 'Walking accessory line',
    reason: 'A walking accessory line to compare for small and medium dogs in everyday routines.',
    sourceLabel: 'Curated official walk line',
    tags: ['walking', 'small', 'medium', 'maltese', 'french-bulldog', 'beagle'],
  },
  {
    brand: 'Wahl',
    category: 'accessories',
    id: 'accessory-wahl-grooming-small-medium',
    imageUrl: 'https://wahlusa.com/media/og_image/websites/4/download.jpeg',
    officialUrl: 'https://wahlusa.com/',
    placeholderAccent: 'sky',
    placeholderLabel: 'Groom',
    productType: 'brandCategory',
    productName: 'Grooming accessory overview',
    reason: 'May be useful for browsing grooming tools by coat comfort and routine needs for small and medium dogs.',
    sourceLabel: 'Curated official brand info',
    tags: ['grooming', 'small', 'medium', 'maltese', 'poodle', 'shih-tzu'],
  },
];


const openPetFoodFactsBaseUrl = 'https://world.openpetfoodfacts.org/cgi/search.pl';
const apiCacheKey = 'dogcareai.productRecommendations.openPetFoodFacts.v1';
const apiCacheTtlMs = 1000 * 60 * 60 * 6;
const apiTimeoutMs = 5000;
let memoryApiEnrichments: Record<string, ProductApiEnrichment | null> | null = null;

export function getRecommendationContext(dog: Dog | null | undefined): RecommendationContext {
  const breedMatch = getBreedMatch(dog?.breed);
  const breedGroup = breedMatch?.breedGroup ?? 'unknown';
  const hasBreedInput = Boolean(dog?.breed?.trim());
  const hasUnrecognizedBreedInput = hasBreedInput && breedGroup === 'unknown';
  const ageGroup = getAgeGroup(dog?.age);
  const weightSizeGroup = getSizeGroup(dog?.weight);
  const inferredSizeGroup = breedGroup === 'unknown' ? 'unknown' : breedSizeHints[breedGroup];
  const sizeGroup = weightSizeGroup === 'unknown' ? inferredSizeGroup : weightSizeGroup;
  const profileNotes: string[] = [];

  if (!hasBreedInput) {
    profileNotes.push('breed');
  } else if (hasUnrecognizedBreedInput) {
    profileNotes.push('recognized breed');
  }

  if (ageGroup === 'unknown') {
    profileNotes.push('age');
  }

  if (weightSizeGroup === 'unknown' && inferredSizeGroup === 'unknown') {
    profileNotes.push('weight');
  }

  return {
    ageGroup,
    breedGroup,
    hasUnrecognizedBreedInput,
    inferredSizeFromBreed: weightSizeGroup === 'unknown' && inferredSizeGroup !== 'unknown',
    hasLimitedProfileData: profileNotes.length > 0,
    matchedBreedName: breedMatch?.canonicalName ?? null,
    profileNotes,
    sizeGroup,
  };
}

export function getRecommendedProducts(dog: Dog | null | undefined) {
  const context = getRecommendationContext(dog);
  const activeTags = new Set<RecommendationTag>([
    context.ageGroup,
    context.sizeGroup,
    context.breedGroup,
  ]);

  if (dog?.activity_level) {
    activeTags.add(dog.activity_level);
  }

  if (dog?.allergies?.trim() || dog?.feeding_preferences?.trim()) {
    activeTags.add('allergy-aware');
  }

  const scored = productCatalog
    .map((product, index) => {
      if (!isProductEligible(product, context)) {
        return null;
      }

      const score = scoreProduct(product, activeTags, context);
      return { index, product, score };
    })
    .filter((item): item is { index: number; product: ProductRecommendation; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return balanceRecommendedProducts(scored).map(({ product, score }) => ({
    ...product,
    matchStrength: score > 0 ? 'matched' as const : 'general' as const,
    reason: buildRecommendationReason(product, context, score),
  }));
}

export function getProductCatalogIds() {
  return new Set(productCatalog.map((product) => product.id));
}

export function filterRecommendations(
  products: ProductRecommendationResult[],
  filter: ProductRecommendationFilter,
  savedIds: Set<string>,
) {
  if (filter === 'all') {
    return products;
  }

  if (filter === 'saved') {
    return products.filter((product) => savedIds.has(product.id));
  }

  return products.filter((product) => product.category === filter);
}

export function applyProductApiEnrichments(
  products: ProductRecommendationResult[],
  enrichments: Record<string, ProductApiEnrichment | null>,
): ProductRecommendationResult[] {
  return products.map((product) => {
    const enrichment = enrichments[product.id];

    if (!enrichment) {
      return product;
    }

    return {
      ...product,
      brand: enrichment.brand,
      imageUrl: enrichment.imageUrl,
      isApiAssisted: true,
      officialUrl: enrichment.officialUrl,
      productName: enrichment.productName,
      sourceLabel: enrichment.sourceLabel,
    };
  });
}

export async function loadProductApiEnrichments(products: ProductRecommendationResult[]) {
  const eligibleProducts = products.filter((product) => product.apiCategoryTag && product.apiSearchTerm);

  if (eligibleProducts.length === 0) {
    return {};
  }

  const cached = readCachedApiEnrichments();

  if (cached) {
    return cached;
  }

  const nextEnrichments: Record<string, ProductApiEnrichment | null> = {};

  await Promise.all(
    eligibleProducts.map(async (product) => {
      nextEnrichments[product.id] = await fetchProductApiEnrichment(product);
    }),
  );

  memoryApiEnrichments = nextEnrichments;
  writeCachedApiEnrichments(nextEnrichments);
  return nextEnrichments;
}

function getBreedMatch(breed: string | null | undefined): { breedGroup: BreedGroup; canonicalName: string } | null {
  const normalizedBreed = normalizeBreedName(breed);

  if (!normalizedBreed) {
    return null;
  }

  const match = findBreedMatch(normalizedBreed, productBreedSearchList);

  if (!match) {
    return null;
  }

  const breedGroup = canonicalBreedGroups[match.canonicalName];

  if (!breedGroup) {
    return null;
  }

  return {
    breedGroup,
    canonicalName: match.canonicalName,
  };
}

function getAgeGroup(age: number | null | undefined): DogAgeGroup {
  if (age === null || age === undefined || !Number.isFinite(age) || age < 0) {
    return 'unknown';
  }

  if (age < 1) {
    return 'puppy';
  }

  if (age >= 7) {
    return 'senior';
  }

  return 'adult';
}

function getSizeGroup(weight: number | null | undefined): DogSizeGroup {
  if (weight === null || weight === undefined || !Number.isFinite(weight) || weight <= 0) {
    return 'unknown';
  }

  if (weight < 10) {
    return 'small';
  }

  if (weight >= 25) {
    return 'large';
  }

  return 'medium';
}

function isProductEligible(product: ProductRecommendation, context: RecommendationContext) {
  const allowedSizes = product.allowedSizes ?? getTagAllowedSizes(product);
  const allowedAgeGroups = product.allowedAgeGroups ?? getTagAllowedAgeGroups(product);

  if (context.hasUnrecognizedBreedInput) {
    return Boolean(product.isGeneralFallback);
  }

  if (!hasSpecificProfileSignal(context)) {
    return Boolean(product.isGeneralFallback);
  }

  if (
    context.sizeGroup !== 'unknown'
    && allowedSizes.length > 0
    && !allowedSizes.includes(context.sizeGroup)
  ) {
    return false;
  }

  if (
    context.sizeGroup === 'unknown'
    && isSizeSpecific(allowedSizes)
    && !product.tags.includes('unknown')
  ) {
    return false;
  }

  if (
    context.ageGroup !== 'unknown'
    && allowedAgeGroups.length > 0
    && !allowedAgeGroups.includes(context.ageGroup)
  ) {
    return false;
  }

  if (
    context.ageGroup === 'unknown'
    && allowedAgeGroups.length === 1
    && (allowedAgeGroups.includes('puppy') || allowedAgeGroups.includes('senior'))
  ) {
    return false;
  }

  return true;
}

function scoreProduct(product: ProductRecommendation, activeTags: Set<RecommendationTag>, context: RecommendationContext) {
  let score = product.tags.reduce((total, tag) => total + (activeTags.has(tag) ? tagWeight(tag) : 0), 0);
  const allowedSizes = product.allowedSizes ?? getTagAllowedSizes(product);
  const allowedAgeGroups = product.allowedAgeGroups ?? getTagAllowedAgeGroups(product);

  if (context.breedGroup !== 'unknown' && product.tags.includes(context.breedGroup)) {
    score += 8;
  }

  if (context.sizeGroup !== 'unknown' && allowedSizes.includes(context.sizeGroup)) {
    score += context.inferredSizeFromBreed ? 4 : 6;
  }

  if (context.ageGroup !== 'unknown' && allowedAgeGroups.includes(context.ageGroup)) {
    score += 4;
  }

  if (product.productType === 'exactProduct') {
    score += 2;
  }

  if (product.productType === 'brandCategory') {
    score -= 1;
  }

  if (product.isGeneralFallback && hasSpecificProfileSignal(context)) {
    score -= 6;
  }

  return score;
}

function balanceRecommendedProducts(
  scored: Array<{ index: number; product: ProductRecommendation; score: number }>,
) {
  const byCategory = new Map<ProductRecommendationCategory, Array<{ index: number; product: ProductRecommendation; score: number }>>();
  const categories: ProductRecommendationCategory[] = ['food', 'treats', 'toys', 'accessories'];

  categories.forEach((category) => {
    byCategory.set(category, scored.filter((item) => item.product.category === category));
  });

  const balanced: Array<{ index: number; product: ProductRecommendation; score: number }> = [];

  while (balanced.length < scored.length) {
    const nextCategory = categories.find((category) => (byCategory.get(category)?.length ?? 0) > 0);

    if (!nextCategory) {
      break;
    }

    categories.forEach((category) => {
      const nextItem = byCategory.get(category)?.shift();

      if (nextItem) {
        balanced.push(nextItem);
      }
    });
  }

  return balanced;
}

function buildRecommendationReason(product: ProductRecommendation, context: RecommendationContext, score: number) {
  if (product.isGeneralFallback) {
    if (context.hasUnrecognizedBreedInput) {
      return `Selected as a general fallback because the saved breed was not recognized. ${product.reason}`;
    }

    return `Selected as a general fallback because some profile details are missing or broad. ${product.reason}`;
  }

  if (context.matchedBreedName && product.tags.includes(context.breedGroup)) {
    return `Suggested because ${context.matchedBreedName} matches this card's profile tags. ${product.reason}`;
  }

  if (context.sizeGroup !== 'unknown' && (product.allowedSizes ?? getTagAllowedSizes(product)).includes(context.sizeGroup)) {
    return context.inferredSizeFromBreed
      ? `Suggested because ${context.matchedBreedName ?? 'the matched breed'} is generally a ${context.sizeGroup}-size dog. ${product.reason}`
      : `Matched this dog's ${context.sizeGroup}-size profile. ${product.reason}`;
  }

  if (context.ageGroup !== 'unknown' && (product.allowedAgeGroups ?? getTagAllowedAgeGroups(product)).includes(context.ageGroup)) {
    return `Matched this dog's ${context.ageGroup} life-stage profile. ${product.reason}`;
  }

  if (score > 0) {
    return `Selected from matching profile signals. ${product.reason}`;
  }

  return `Selected as a general option because some profile details are missing. ${product.reason}`;
}

function getTagAllowedSizes(product: ProductRecommendation): DogSizeGroup[] {
  const sizes = sizeGroups.filter((size) => product.tags.includes(size));

  return sizes;
}

function getTagAllowedAgeGroups(product: ProductRecommendation): DogAgeGroup[] {
  const allowedAgeGroups = ageGroups.filter((ageGroup) => product.tags.includes(ageGroup));

  return allowedAgeGroups;
}

function isSizeSpecific(sizes: DogSizeGroup[]) {
  return sizes.length > 0 && sizes.length < 3;
}

function hasSpecificProfileSignal(context: RecommendationContext) {
  return context.breedGroup !== 'unknown' || context.sizeGroup !== 'unknown' || context.ageGroup !== 'unknown';
}

function tagWeight(tag: RecommendationTag) {
  if (
    tag === 'beagle'
    || tag === 'border-collie'
    || tag === 'bulldog'
    || tag === 'french-bulldog'
    || tag === 'german-shepherd'
    || tag === 'golden-retriever'
    || tag === 'labrador-retriever'
    || tag === 'maltese'
    || tag === 'mixed-breed'
    || tag === 'poodle'
    || tag === 'rottweiler'
    || tag === 'shih-tzu'
    || tag === 'siberian-husky'
  ) {
    return 4;
  }

  if (tag === 'puppy' || tag === 'adult' || tag === 'senior') {
    return 3;
  }

  if (tag === 'small' || tag === 'medium' || tag === 'large') {
    return 2;
  }

  if (tag === 'low' || tag === 'high') {
    return 2;
  }

  return 1;
}

async function fetchProductApiEnrichment(product: ProductRecommendationResult): Promise<ProductApiEnrichment | null> {
  if (!product.apiCategoryTag || !product.apiSearchTerm) {
    return null;
  }

  try {
    const apiCategoryTag = product.apiCategoryTag;
    const apiSearchTerm = product.apiSearchTerm;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), apiTimeoutMs);
    const url = new URL(openPetFoodFactsBaseUrl);

    url.searchParams.set('tagtype_0', 'categories');
    url.searchParams.set('tag_contains_0', 'contains');
    url.searchParams.set('tag_0', apiCategoryTag);
    url.searchParams.set('search_terms', apiSearchTerm);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', '5');
    url.searchParams.set('fields', 'product_name,brands,image_front_small_url,image_front_url,url,categories_tags');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as OpenPetFoodFactsResponse;
    const match = payload.products?.find((candidate) => isUsableApiProduct(candidate, apiCategoryTag));

    if (!match?.product_name || !match.url) {
      return null;
    }

    const imageUrl = match.image_front_small_url || match.image_front_url;

    if (!imageUrl) {
      return null;
    }

    return {
      brand: sanitizeProductText(match.brands) || product.brand,
      imageUrl,
      officialUrl: match.url,
      productName: sanitizeProductText(match.product_name),
      sourceLabel: 'Open Pet Food Facts',
    };
  } catch {
    return null;
  }
}

function isUsableApiProduct(product: OpenPetFoodFactsProduct, categoryTag: 'dog-food' | 'dog-treats') {
  const productName = sanitizeProductText(product.product_name);
  const imageUrl = product.image_front_small_url || product.image_front_url;
  const categories = product.categories_tags ?? [];
  const normalizedCategories = categories.map((category) => category.toLowerCase());
  const hasCatOnlySignal = normalizedCategories.some((category) => category.includes('cat-food'))
    && !normalizedCategories.some((category) => category.includes('dog-food') || category.includes('dog-treat'));
  const isDogFood = normalizedCategories.some(
    (category) => category.includes('dog-food') || category.includes('dry-dog-food') || category.includes('wet-dog-food'),
  );
  const isDogTreat = normalizedCategories.some(
    (category) => category.includes('dog-treat') || category.includes('dog-biscuit'),
  );

  if (!productName || !imageUrl || !product.url || hasCatOnlySignal) {
    return false;
  }

  if (categoryTag === 'dog-treats') {
    return isDogTreat || isDogFood;
  }

  return isDogFood;
}

function sanitizeProductText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function readCachedApiEnrichments() {
  if (memoryApiEnrichments) {
    return memoryApiEnrichments;
  }

  try {
    const rawValue = window.sessionStorage.getItem(apiCacheKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as {
      expiresAt?: number;
      value?: Record<string, ProductApiEnrichment | null>;
    };

    if (!parsedValue.expiresAt || parsedValue.expiresAt < Date.now() || !parsedValue.value) {
      window.sessionStorage.removeItem(apiCacheKey);
      return null;
    }

    memoryApiEnrichments = parsedValue.value;
    return parsedValue.value;
  } catch {
    return null;
  }
}

function writeCachedApiEnrichments(value: Record<string, ProductApiEnrichment | null>) {
  try {
    window.sessionStorage.setItem(
      apiCacheKey,
      JSON.stringify({
        expiresAt: Date.now() + apiCacheTtlMs,
        value,
      }),
    );
  } catch {
    // API enrichment is optional; the curated catalog remains available without sessionStorage.
  }
}
