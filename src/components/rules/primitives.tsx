// Small reusable SVG bits for the rules illustrations.

const NAVY = 'rgb(var(--brand-navy))';

/** Shuttlecock shapes centered on (0,0), cork at the bottom. Drop inside an <svg>/<g>. */
export function ShuttleShapes({
  stroke = NAVY,
  feather = '#ffffff',
  scale = 1,
}: {
  stroke?: string;
  feather?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`} stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      {/* feather skirt */}
      <path d="M -2 2 L -6.5 -10 L 6.5 -10 L 2 2 Z" fill={feather} />
      {/* feather ribs */}
      <path
        d="M -1.6 -1 L -1.8 -9 M 1.6 -1 L 1.8 -9 M -3.8 -0.5 L -4.9 -9 M 3.8 -0.5 L 4.9 -9"
        fill="none"
        strokeWidth={0.8}
      />
      {/* cork */}
      <circle cx="0" cy="4" r="3.6" fill={stroke} stroke="none" />
    </g>
  );
}

/** A standalone shuttle icon (its own svg) for inline/decorative use. */
export function ShuttleIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="-10 -12 20 22" className={className} aria-hidden>
      <ShuttleShapes />
    </svg>
  );
}
