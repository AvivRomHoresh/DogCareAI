import {
  buildSearchableBreedList,
  findBreedMatch,
  normalizeBreedName,
  sharedCuratedBreedNames,
} from '../lib/dogBreedMatching';

type DogAvatarSize = 'md' | 'sm' | 'xl';

type DogAvatarProps = {
  breed?: string | null;
  className?: string;
  name?: string | null;
  profileImageUrl?: string | null;
  size?: DogAvatarSize;
  weight?: number | null;
};

type AvatarVariant =
  | 'curly'
  | 'generic'
  | 'largeDark'
  | 'largeGolden'
  | 'largeWorking'
  | 'longHound'
  | 'mediumHound'
  | 'smallLight';

type AvatarPalette = {
  background: string;
  ear: string;
  face: string;
  muzzle: string;
  nose: string;
  patch?: string;
};

const avatarBreedSearchList = buildSearchableBreedList([], () => '', sharedCuratedBreedNames);

const accentBackgrounds: Record<string, string> = {
  'static-amber': 'from-amber-50 to-orange-100',
  'static-rose': 'from-rose-50 to-pink-100',
  'static-sky': 'from-sky-50 to-cyan-100',
  'static-teal': 'from-teal-50 to-emerald-100',
};

const sizeClasses: Record<DogAvatarSize, string> = {
  md: 'h-16 w-16',
  sm: 'h-12 w-12',
  xl: 'h-24 w-24',
};

const palettes: Record<AvatarVariant, AvatarPalette> = {
  curly: {
    background: '#f0fdfa',
    ear: '#d6d3d1',
    face: '#f5f5f4',
    muzzle: '#fff7ed',
    nose: '#334155',
    patch: '#c4b5fd',
  },
  generic: {
    background: '#f8fafc',
    ear: '#cbd5e1',
    face: '#e2e8f0',
    muzzle: '#f8fafc',
    nose: '#334155',
    patch: '#99f6e4',
  },
  largeDark: {
    background: '#fef3c7',
    ear: '#1f2937',
    face: '#334155',
    muzzle: '#d97706',
    nose: '#111827',
    patch: '#f59e0b',
  },
  largeGolden: {
    background: '#fffbeb',
    ear: '#b45309',
    face: '#f59e0b',
    muzzle: '#fde68a',
    nose: '#334155',
    patch: '#fef3c7',
  },
  largeWorking: {
    background: '#eef2ff',
    ear: '#475569',
    face: '#94a3b8',
    muzzle: '#f8fafc',
    nose: '#1e293b',
    patch: '#334155',
  },
  longHound: {
    background: '#fff7ed',
    ear: '#78350f',
    face: '#b45309',
    muzzle: '#fed7aa',
    nose: '#1f2937',
    patch: '#92400e',
  },
  mediumHound: {
    background: '#ecfeff',
    ear: '#92400e',
    face: '#f5f5f4',
    muzzle: '#ffedd5',
    nose: '#334155',
    patch: '#b45309',
  },
  smallLight: {
    background: '#fff1f2',
    ear: '#e7e5e4',
    face: '#fafaf9',
    muzzle: '#fff7ed',
    nose: '#475569',
    patch: '#f9a8d4',
  },
};

export function DogAvatar({
  breed,
  className = '',
  name,
  profileImageUrl,
  size = 'md',
  weight,
}: DogAvatarProps) {
  const match = findBreedMatch(normalizeBreedName(breed), avatarBreedSearchList);
  const variant = getAvatarVariant(match?.canonicalName, weight);
  const palette = palettes[variant];
  const accentClass = accentBackgrounds[profileImageUrl ?? ''] ?? accentBackgrounds['static-teal'];
  const label = name?.trim()
    ? `${name.trim()} dog avatar`
    : match?.canonicalName
      ? `${match.canonicalName} inspired dog avatar`
      : 'Dog avatar';

  return (
    <div
      aria-label={label}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-1 shadow-sm ring-1 ring-stone-200',
        accentClass,
        sizeClasses[size],
        className,
      ].join(' ')}
      role="img"
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 96 96">
        <circle cx="48" cy="48" fill={palette.background} r="45" />
        <path
          d={variant === 'largeWorking' ? 'M25 35 34 13l10 25z' : variant === 'smallLight' ? 'M25 36c-6 8-7 19-3 30 8-4 13-13 15-27z' : 'M25 35c-9 7-11 20-6 33 9-4 15-14 18-29z'}
          fill={palette.ear}
        />
        <path
          d={variant === 'largeWorking' ? 'M71 35 62 13 52 38z' : variant === 'smallLight' ? 'M71 36c6 8 7 19 3 30-8-4-13-13-15-27z' : 'M71 35c9 7 11 20 6 33-9-4-15-14-18-29z'}
          fill={palette.ear}
        />
        <path
          d="M25 51c0-19 10-33 23-33s23 14 23 33c0 18-10 30-23 30S25 69 25 51z"
          fill={palette.face}
        />
        {palette.patch ? (
          <path
            d={
              variant === 'largeDark'
                ? 'M31 36c4-10 11-16 17-16s13 6 17 16c-5-2-11-3-17-3s-12 1-17 3z'
                : variant === 'largeWorking'
                  ? 'M33 28c4-6 9-9 15-9s11 3 15 9c-5 8-10 13-15 17-5-4-10-9-15-17z'
                  : 'M48 20c10 3 17 15 17 31 0 4-.5 8-1.5 11C55 57 49 45 48 20z'
            }
            fill={palette.patch}
            opacity={variant === 'largeDark' || variant === 'largeWorking' ? '0.75' : '0.5'}
          />
        ) : null}
        {variant === 'curly' ? (
          <>
            <circle cx="34" cy="29" fill={palette.ear} opacity="0.7" r="7" />
            <circle cx="48" cy="24" fill={palette.ear} opacity="0.75" r="8" />
            <circle cx="62" cy="29" fill={palette.ear} opacity="0.7" r="7" />
          </>
        ) : null}
        <ellipse cx="48" cy="59" fill={palette.muzzle} rx={variant === 'largeDark' ? '19' : '16'} ry="13" />
        {variant === 'smallLight' || variant === 'curly' ? (
          <path d="M35 42c4 2 8 2 12 0M49 42c4 2 8 2 12 0" fill="none" stroke={palette.ear} strokeLinecap="round" strokeWidth="2" opacity="0.55" />
        ) : null}
        <path d="M37 47c3-2 6-2 9 0" fill="none" stroke="#0f172a" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M50 47c3-2 6-2 9 0" fill="none" stroke="#0f172a" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M44 56c2-2.5 6-2.5 8 0-1.2 2.2-2.5 3.3-4 3.3s-2.8-1.1-4-3.3z" fill={palette.nose} />
        <path d="M48 60v4" stroke={palette.nose} strokeLinecap="round" strokeWidth="2" />
        <path d="M40 66c4 3.5 12 3.5 16 0" fill="none" stroke={palette.nose} strokeLinecap="round" strokeWidth="2" opacity="0.85" />
        {variant === 'mediumHound' || variant === 'longHound' ? (
          <path d="M29 38c4 10 4 20-2 30" fill="none" stroke={palette.ear} strokeLinecap="round" strokeWidth={variant === 'longHound' ? '7' : '5'} opacity="0.9" />
        ) : null}
        {variant === 'largeDark' ? <path d="M35 37h26" stroke={palette.patch} strokeLinecap="round" strokeWidth="4" opacity="0.75" /> : null}
      </svg>
    </div>
  );
}

function getAvatarVariant(canonicalBreed: string | undefined, weight: number | null | undefined): AvatarVariant {
  switch (canonicalBreed) {
    case 'Maltese':
    case 'Shih Tzu':
    case 'French Bulldog':
      return 'smallLight';
    case 'Beagle':
      return 'mediumHound';
    case 'Dachshund':
      return 'longHound';
    case 'Border Collie':
    case 'Bulldog':
      return 'mediumHound';
    case 'Rottweiler':
      return 'largeDark';
    case 'Golden Retriever':
    case 'Labrador Retriever':
      return 'largeGolden';
    case 'German Shepherd Dog':
    case 'Siberian Husky':
      return 'largeWorking';
    case 'Poodle':
      return 'curly';
    case 'Mixed Breed':
      return 'generic';
    default:
      return getWeightFallbackVariant(weight);
  }
}

function getWeightFallbackVariant(weight: number | null | undefined): AvatarVariant {
  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
    return 'generic';
  }

  if (weight < 10) {
    return 'smallLight';
  }

  if (weight >= 25) {
    return 'largeWorking';
  }

  return 'mediumHound';
}
