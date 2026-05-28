type RecommendationsIconProps = {
  className?: string;
};

export function RecommendationsIcon({ className = 'h-6 w-6' }: RecommendationsIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M6.75 5.25h10.5a2 2 0 0 1 2 2v11a1.5 1.5 0 0 1-2.2 1.33L12 16.9l-5.05 2.68a1.5 1.5 0 0 1-2.2-1.33v-11a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
      <path
        d="m9 10.7 1.85 1.85L15.3 8.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
    </svg>
  );
}
