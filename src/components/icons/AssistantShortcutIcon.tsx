type AssistantShortcutIconProps = {
  className?: string;
};

export function AssistantShortcutIcon({ className = 'h-6 w-6' }: AssistantShortcutIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6.5 9.5 4.75 6.25c2.75.1 4.55 1.45 5.15 3.85" />
      <path d="m17.5 9.5 1.75-3.25c-2.75.1-4.55 1.45-5.15 3.85" />
      <path d="M6 13.5c0-4 2.6-6.5 6-6.5s6 2.5 6 6.5c0 3.8-2.4 6.5-6 6.5s-6-2.7-6-6.5Z" />
      <path d="M9.5 13.5h.01" />
      <path d="M14.5 13.5h.01" />
      <path d="M10.5 16.5c.8.65 2.2.65 3 0" />
      <path d="M19.5 4.5 20.5 3l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1z" />
    </svg>
  );
}
