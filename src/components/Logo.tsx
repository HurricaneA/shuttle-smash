import { useState } from 'react';

/**
 * Renders the tournament logo from /public/logo.png. If the file hasn't been added
 * yet, it falls back to a branded text badge so the app never shows a broken image.
 */
export default function Logo({ className = 'h-12 w-12' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`grid place-items-center rounded-full bg-brand-navy text-brand-gold font-display font-extrabold ${className}`}
        aria-label="Shuttle Smash Championship"
      >
        <span className="text-[0.7em] leading-none">SSC</span>
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Shuttle Smash Championship logo"
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
