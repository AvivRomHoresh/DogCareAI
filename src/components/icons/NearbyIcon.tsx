type NearbyIconProps = {
  className?: string;
};

export function NearbyIcon({ className = 'h-6 w-6' }: NearbyIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 21.25s6.25-5.35 6.25-11.15A6.25 6.25 0 0 0 5.75 10.1C5.75 15.9 12 21.25 12 21.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
      <path
        d="M12 12.65a2.45 2.45 0 1 0 0-4.9 2.45 2.45 0 0 0 0 4.9Z"
        stroke="currentColor"
        strokeWidth="1.85"
      />
      <path d="M8.5 18.4h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.85" />
    </svg>
  );
}
