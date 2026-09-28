type IconName =
  | 'github'
  | 'x'
  | 'mail'
  | 'arrow'
  | 'phone'
  | 'flask'
  | 'package'
  | 'shield'
  | 'signal'
  | 'check'
  | 'arrowLeft';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const paths: Record<IconName, React.ReactNode> = {
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"
    />
  ),
  x: (
    <path
      fill="currentColor"
      stroke="none"
      d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2l-11.1-17.4H4.3l13.3 17.4Z"
    />
  ),
  mail: (
    <g {...stroke}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6.5 8.2 6a1.4 1.4 0 0 0 1.6 0L21 6.5" />
    </g>
  ),
  arrow: (
    <g {...stroke}>
      <path d="M5 12h13" />
      <path d="m12.5 6 6 6-6 6" />
    </g>
  ),
  arrowLeft: (
    <g {...stroke}>
      <path d="M19 12H6" />
      <path d="m11.5 6-6 6 6 6" />
    </g>
  ),
  phone: (
    <g {...stroke}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <path d="M10.8 18.5h2.4" />
    </g>
  ),
  flask: (
    <g {...stroke}>
      <path d="M9.5 2.5v6.2L4.3 18a2 2 0 0 0 1.7 3h12a2 2 0 0 0 1.7-3l-5.2-9.3V2.5" />
      <path d="M8 2.5h8" />
      <path d="M6.6 14.5h10.8" />
    </g>
  ),
  package: (
    <g {...stroke}>
      <path d="M20.5 7.8v8.4a1.6 1.6 0 0 1-.8 1.4l-6.9 3.8a1.6 1.6 0 0 1-1.6 0l-6.9-3.8a1.6 1.6 0 0 1-.8-1.4V7.8" />
      <path d="m3.9 6.9 7.3-4a1.6 1.6 0 0 1 1.6 0l7.3 4-8.1 4.4Z" />
      <path d="M12 11.3V21" />
    </g>
  ),
  shield: (
    <g {...stroke}>
      <path d="M12 2.5 20 5.4V11c0 4.6-3.2 8.6-8 10.5-4.8-1.9-8-5.9-8-10.5V5.4Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </g>
  ),
  signal: (
    <g {...stroke}>
      <path d="M4 20v-4" />
      <path d="M9.3 20V12" />
      <path d="M14.7 20V8" />
      <path d="M20 20V4" />
    </g>
  ),
  check: (
    <g {...stroke}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </g>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
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
      {paths[name]}
    </svg>
  );
}

export type { IconName };
