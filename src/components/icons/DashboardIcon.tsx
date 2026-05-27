type DashboardIconProps = {
  className?: string;
};

export function DashboardIcon({ className = 'h-6 w-6' }: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.75 5.75A2 2 0 0 1 6.75 3.75h3.5v6.5h-5.5v-4.5ZM13.75 3.75h3.5a2 2 0 0 1 2 2v2.5h-5.5v-4.5ZM4.75 13.75h5.5v6.5h-3.5a2 2 0 0 1-2-2v-4.5ZM13.75 11.75h5.5v6.5a2 2 0 0 1-2 2h-3.5v-8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
