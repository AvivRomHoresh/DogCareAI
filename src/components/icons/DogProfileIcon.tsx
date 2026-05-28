type DogProfileIconProps = {
  className?: string;
};

export function DogProfileIcon({ className = 'h-6 w-6' }: DogProfileIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M8.2 14.15c.78-1.55 2-2.45 3.8-2.45s3.02.9 3.8 2.45c.98 1.96-.4 4.05-2.44 4.05h-2.72c-2.04 0-3.42-2.09-2.44-4.05Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
      <path
        d="M6.75 10.9c1.14 0 2.02-.95 2.02-2.14s-.88-2.13-2.02-2.13-2.02.95-2.02 2.13.88 2.14 2.02 2.14ZM17.25 10.9c1.14 0 2.02-.95 2.02-2.14s-.88-2.13-2.02-2.13-2.02.95-2.02 2.13.88 2.14 2.02 2.14ZM10.1 8.35c1.06 0 1.88-.96 1.88-2.15s-.82-2.15-1.88-2.15-1.88.96-1.88 2.15.82 2.15 1.88 2.15ZM13.9 8.35c1.06 0 1.88-.96 1.88-2.15s-.82-2.15-1.88-2.15-1.88.96-1.88 2.15.82 2.15 1.88 2.15Z"
        stroke="currentColor"
        strokeWidth="2.05"
      />
    </svg>
  );
}
