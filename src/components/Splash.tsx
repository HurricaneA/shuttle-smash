import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShuttleShapes } from './rules/primitives';

const GOLD = 'rgb(var(--brand-gold))';
const WHITE = '#ffffff';

/**
 * One-time loading intro: a girl leaps in from the side and smashes the shuttle
 * (profile silhouette — ponytail + skirt, matching the poster). Shows once per browser
 * session, runs ~2s, can be clicked to skip, and collapses to an instant fade under
 * prefers-reduced-motion.
 */
export default function Splash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = window.setTimeout(onDone, reduce ? 600 : 2000);
    return () => window.clearTimeout(t);
  }, [onDone, reduce]);

  const limb = {
    fill: 'none',
    stroke: GOLD,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <motion.div
      className="brand-gradient fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-3"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      role="button"
      aria-label="Skip intro"
    >
      <svg viewBox="0 0 340 300" className="w-72 sm:w-80" aria-hidden>
        {/* speed lines trailing the smashed shuttle (forward + down) */}
        <motion.g
          stroke={GOLD}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0 } : { opacity: [0, 1, 0] }}
          transition={reduce ? {} : { delay: 0.98, duration: 0.5, times: [0, 0.3, 1] }}
        >
          <line x1="216" y1="52" x2="260" y2="100" />
          <line x1="230" y1="62" x2="274" y2="112" />
          <line x1="244" y1="74" x2="288" y2="124" />
        </motion.g>

        {/* impact flash at the point of contact */}
        <motion.circle
          cx="224"
          cy="38"
          r="12"
          fill="none"
          stroke={GOLD}
          strokeWidth="3"
          style={{ transformBox: 'view-box', transformOrigin: '224px 38px' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={reduce ? { scale: 0, opacity: 0 } : { scale: [0, 4], opacity: [0.9, 0] }}
          transition={reduce ? {} : { delay: 0.9, duration: 0.55, ease: 'easeOut' }}
        />

        {/* the player — leaps in from the left and up to the apex */}
        <motion.g
          initial={reduce ? false : { opacity: 0, x: -28, y: 40 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={reduce ? { duration: 0.25 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* back leg — trailing down and back */}
          <path d="M146 166 L128 190 L108 204" {...limb} strokeWidth="15" />
          {/* front leg — knee up and forward, shin down */}
          <path d="M156 166 L186 162 L206 182" {...limb} strokeWidth="15" />

          {/* skirt (flared A-line) over the hips */}
          <path d="M142 144 L160 144 L180 174 Q151 187 122 174 Z" fill={GOLD} />

          {/* torso */}
          <line x1="155" y1="100" x2="148" y2="150" stroke={GOLD} strokeWidth="18" strokeLinecap="round" />

          {/* trailing balance arm */}
          <path d="M148 116 L122 132 L112 152" {...limb} strokeWidth="12" />

          {/* ponytail streaming back */}
          <path d="M138 74 C112 66 100 84 119 102 C114 87 129 80 142 87 Z" fill={GOLD} />
          {/* head */}
          <circle cx="151" cy="85" r="15" fill={GOLD} />

          {/* racket arm — swings down into the smash, pivoting at the shoulder */}
          <motion.g
            style={{ transformBox: 'view-box', transformOrigin: '157px 108px' }}
            initial={reduce ? false : { rotate: -44 }}
            animate={reduce ? { rotate: 0 } : { rotate: [-44, 10, 0] }}
            transition={reduce ? { duration: 0.25 } : { delay: 0.6, duration: 0.4, ease: [0.5, 0, 0.2, 1], times: [0, 0.72, 1] }}
          >
            <path d="M157 108 L184 84 L206 56" {...limb} strokeWidth="13" />
            <line x1="206" y1="56" x2="214" y2="48" stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
            <ellipse
              cx="222"
              cy="40"
              rx="15"
              ry="20"
              transform="rotate(-28 222 40)"
              fill="none"
              stroke={GOLD}
              strokeWidth="4"
            />
          </motion.g>
        </motion.g>

        {/* the shuttle, launched forward off the racket */}
        <g transform="translate(224 38)">
          <motion.g
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0 } : { opacity: [1, 1, 0], x: [0, 116], y: [0, 194], rotate: [-20, 60] }}
            transition={reduce ? {} : { delay: 0.95, duration: 0.6, ease: 'easeIn' }}
          >
            <ShuttleShapes stroke={WHITE} feather={WHITE} scale={1.25} />
          </motion.g>
        </g>
      </svg>

      {/* wordmark */}
      <motion.div
        className="text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0.25 } : { delay: 1.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
          Shuttle <span className="text-brand-gold">Smash</span>
        </p>
        <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.35em] text-white/70">
          Championship
        </p>
      </motion.div>
    </motion.div>
  );
}
