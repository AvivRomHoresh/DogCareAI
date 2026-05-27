import { useState } from 'react';
import { Link } from 'react-router-dom';

const logoAssetPath = '/brand/dogcareai-logo.jpg';

type DogCareLogoProps = {
  className?: string;
};

export function DogCareLogo({ className = '' }: DogCareLogoProps) {
  const [useFallbackMark, setUseFallbackMark] = useState(false);

  return (
    <Link
      aria-label="Go to DogCareAI dashboard"
      className={[
        'group inline-flex items-center gap-4 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        className,
      ].join(' ')}
      to="/"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 shadow-sm ring-1 ring-teal-100 transition group-hover:shadow-md sm:h-16 sm:w-16">
        {useFallbackMark ? (
          <FallbackLogoMark />
        ) : (
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            onError={() => setUseFallbackMark(true)}
            src={logoAssetPath}
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold leading-tight tracking-normal text-slate-950 transition group-hover:text-teal-950 sm:text-3xl">
          DogCareAI
        </span>
        <span className="block text-sm font-semibold leading-5 text-slate-500 sm:text-base">
          Calm care for every dog
        </span>
      </span>
    </Link>
  );
}

function FallbackLogoMark() {
  return (
    <svg aria-hidden="true" className="h-9 w-9 text-teal-800" viewBox="0 0 64 64" role="img">
      <circle cx="32" cy="32" fill="#ccfbf1" r="30" />
      <path
        d="M20 30c0-8 5.4-14 12-14s12 6 12 14v8c0 7-5.4 12-12 12s-12-5-12-12v-8Z"
        fill="#f8fafc"
        stroke="#0f766e"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M21 30c-6-6-9-3-8 4 .7 5 4.4 8 8 8M43 30c6-6 9-3 8 4-.7 5-4.4 8-8 8"
        fill="#99f6e4"
        stroke="#0f766e"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M29 35h6l-3 4-3-4Z" fill="#134e4a" />
      <path d="M26 29h.01M38 29h.01" stroke="#134e4a" strokeLinecap="round" strokeWidth="5" />
      <path d="M28 43c2 2 6 2 8 0" stroke="#134e4a" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
