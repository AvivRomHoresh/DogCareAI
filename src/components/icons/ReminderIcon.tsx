type ReminderIconProps = {
  className?: string;
};

export function ReminderIcon({ className = 'h-6 w-6' }: ReminderIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 3.75v3.5M17 3.75v3.5M5.75 6h12.5a2 2 0 0 1 2 2v10.25a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
      <path
        d="M4.25 10h15.5M8.25 14h3.25M8.25 17h5.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.85"
      />
      <path
        d="m15.25 14.8 1.15 1.15 2.05-2.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
    </svg>
  );
}
