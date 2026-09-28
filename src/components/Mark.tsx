/**
 * Print registration marks: the corner brackets a press uses to line pages up.
 * The filled square is the datum everything else registers against. Reads at
 * 16px and gains no weight as it scales.
 */
export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none">
        <path d="M2 8V3a1 1 0 0 1 1-1h5" />
        <path d="M22 16v5a1 1 0 0 1-1 1h-5" />
      </g>
      <rect x="8.5" y="8.5" width="7" height="7" fill="currentColor" />
    </svg>
  );
}
