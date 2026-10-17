interface MarkProps {
  className?: string;
}

/**
 * A shield resolved into a wireframe: outer hull, two diagonals, and three
 * vertex handles. Reads as a mesh at 16px, as a crest at 40px.
 */
export function Mark({ className = '' }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.5 20.5 6.8V15.2L12 25.5 3.5 15.2V6.8L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.5V25.5M3.5 6.8 12 15.2 20.5 6.8"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="12" cy="2.5" r="1.35" fill="currentColor" />
      <circle cx="3.5" cy="6.8" r="1.35" fill="currentColor" />
      <circle cx="20.5" cy="6.8" r="1.35" fill="currentColor" />
      <circle cx="12" cy="15.2" r="1.1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
