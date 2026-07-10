import { useEffect, useState, type FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { VisualId } from '../../content/rules';
import Court, { COURT, ZONES } from './Court';
import { ShuttleShapes } from './primitives';
import ServeDemo from './ServeDemo';

const NAVY = 'rgb(var(--brand-navy))';
const GOLD = 'rgb(var(--brand-gold))';
const ORANGE = 'rgb(var(--brand-orange))';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      {children}
    </div>
  );
}

/* 1 — Objective: a shuttle arcs over the net into the opponent's court. */
const ObjectiveIllustration: FC = () => {
  const reduce = useReducedMotion();
  return (
    <Panel>
      <svg viewBox="0 0 220 150" className="w-full max-w-[320px]">
        <line x1="8" y1="124" x2="212" y2="124" stroke={NAVY} strokeWidth="2" />
        {/* landing target in the opponent court */}
        <rect
          x="140"
          y="112"
          width="58"
          height="12"
          rx="2"
          className="anim-pulse"
          fill="rgb(var(--brand-gold) / 0.35)"
          stroke={ORANGE}
          strokeWidth="1.4"
          strokeDasharray="5 4"
        />
        <text x="169" y="140" textAnchor="middle" fontSize="9" fill={NAVY} fontWeight="700">
          OPPONENT COURT
        </text>
        {/* net */}
        <line x1="110" y1="124" x2="110" y2="72" stroke={NAVY} strokeWidth="2.5" />
        <line x1="103" y1="74" x2="117" y2="74" stroke={NAVY} strokeWidth="2" />
        <g stroke={NAVY} strokeWidth="0.5" opacity="0.6">
          <line x1="105" y1="76" x2="105" y2="122" />
          <line x1="110" y1="76" x2="110" y2="122" />
          <line x1="115" y1="76" x2="115" y2="122" />
        </g>
        {/* arcing shuttle */}
        <motion.g
          animate={reduce ? { x: 110, y: 60, rotate: 4 } : { x: [34, 110, 168], y: [98, 40, 106], rotate: [-18, 6, 30] }}
          transition={reduce ? {} : { duration: 1.9, times: [0, 0.5, 1], ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
        >
          <ShuttleShapes scale={0.95} />
        </motion.g>
      </svg>
    </Panel>
  );
};

/* 2 — Match Format: a points track 0 → 8 (break) → 15 (win). */
const MatchFormatIllustration: FC = () => {
  const reduce = useReducedMotion();
  return (
    <Panel>
      <svg viewBox="0 0 240 140" className="w-full max-w-[340px]">
        <rect x="20" y="74" width="200" height="8" rx="4" fill="rgb(var(--brand-navy) / 0.12)" />
        {/* milestones */}
        {[
          { x: 20, label: '0', top: 'START' },
          { x: 120, label: '8', top: 'BREAK' },
          { x: 220, label: '15', top: 'WIN' },
        ].map((m) => (
          <g key={m.label}>
            <circle cx={m.x} cy="78" r="6" fill={m.label === '8' ? GOLD : NAVY} />
            <text x={m.x} y="64" textAnchor="middle" fontSize="8" fontWeight="700" fill={NAVY}>
              {m.top}
            </text>
            <text x={m.x} y="100" textAnchor="middle" fontSize="9" fontWeight="800" fill={NAVY}>
              {m.label}
            </text>
          </g>
        ))}
        {/* switch-sides note under the break */}
        <text x="120" y="116" textAnchor="middle" fontSize="8" fill={ORANGE} fontWeight="700">
          2-min break · switch
        </text>
        <text x="220" y="116" textAnchor="middle" fontSize="8" fill={NAVY} fontWeight="700">
          win by 2
        </text>
        {/* travelling shuttle */}
        <motion.g
          animate={reduce ? { x: 120, y: 46 } : { x: [20, 120, 120, 220], y: [46, 46, 46, 46] }}
          transition={reduce ? {} : { duration: 3.2, times: [0, 0.42, 0.6, 1], ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.4 }}
        >
          <ShuttleShapes scale={0.8} />
        </motion.g>
      </svg>
    </Panel>
  );
};

/* 3 — Serving: the interactive demo. */
const ServingIllustration: FC = () => <ServeDemo />;

/* 4 — Scoring: every rally scores a point. */
const ScoringIllustration: FC = () => {
  const reduce = useReducedMotion();
  const Racket = ({ x, flip }: { x: number; flip?: boolean }) => (
    <g transform={`translate(${x}, 78) rotate(${flip ? 30 : -30})`} stroke={NAVY} strokeWidth="2" fill="none">
      <ellipse cx="0" cy="-10" rx="8" ry="11" fill="rgb(var(--brand-royal) / 0.12)" />
      <line x1="0" y1="1" x2="0" y2="16" strokeLinecap="round" />
    </g>
  );
  return (
    <Panel>
      <svg viewBox="0 0 220 130" className="w-full max-w-[320px]">
        <line x1="110" y1="34" x2="110" y2="104" stroke={NAVY} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
        <Racket x={34} />
        <Racket x={186} flip />
        {/* rallying shuttle */}
        <motion.g
          animate={reduce ? { x: 110, y: 60 } : { x: [58, 110, 162, 110], y: [64, 44, 64, 44] }}
          transition={reduce ? {} : { duration: 1.6, times: [0, 0.25, 0.5, 0.75], ease: 'easeInOut', repeat: Infinity }}
        >
          <ShuttleShapes scale={0.85} />
        </motion.g>
        {/* +1 pop */}
        <motion.text
          x="110"
          y="26"
          textAnchor="middle"
          fontSize="16"
          fontWeight="800"
          fill={ORANGE}
          animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0], y: [26, 16, 8], scale: [0.6, 1, 0.8] }}
          transition={reduce ? {} : { duration: 1.6, ease: 'easeOut', repeat: Infinity }}
          style={{ transformOrigin: '110px 20px' }}
        >
          +1
        </motion.text>
        <text x="110" y="122" textAnchor="middle" fontSize="9" fontWeight="700" fill={NAVY}>
          EVERY RALLY = A POINT
        </text>
      </svg>
    </Panel>
  );
};

/* 5 — Faults: cycling grid of the six faults. */
const FAULTS: { label: string; icon: JSX.Element }[] = [
  {
    label: 'Out of bounds',
    icon: (
      <>
        <rect x="8" y="12" width="24" height="22" rx="2" fill="none" stroke={NAVY} strokeWidth="1.6" />
        <circle cx="37" cy="37" r="3.2" fill={ORANGE} />
      </>
    ),
  },
  {
    label: 'Into the net',
    icon: (
      <>
        <line x1="22" y1="8" x2="22" y2="38" stroke={NAVY} strokeWidth="1.6" strokeDasharray="3 3" />
        <circle cx="13" cy="24" r="3.2" fill={ORANGE} />
      </>
    ),
  },
  {
    label: 'Ceiling / walls',
    icon: (
      <>
        <line x1="6" y1="9" x2="38" y2="9" stroke={NAVY} strokeWidth="2" />
        <circle cx="22" cy="15" r="3.2" fill={ORANGE} />
        <line x1="22" y1="34" x2="22" y2="21" stroke={NAVY} strokeWidth="1.4" markerEnd="" />
      </>
    ),
  },
  {
    label: 'Touching the net',
    icon: (
      <>
        <line x1="22" y1="8" x2="22" y2="38" stroke={NAVY} strokeWidth="1.6" strokeDasharray="3 3" />
        <circle cx="22" cy="22" r="4" fill="rgb(var(--brand-royal) / 0.35)" stroke={NAVY} strokeWidth="1.4" />
      </>
    ),
  },
  {
    label: 'Double hit',
    icon: (
      <>
        <circle cx="17" cy="22" r="3.2" fill={NAVY} />
        <text x="26" y="27" fontSize="13" fontWeight="800" fill={ORANGE}>
          ×2
        </text>
      </>
    ),
  },
  {
    label: 'Reaching over',
    icon: (
      <>
        <line x1="22" y1="8" x2="22" y2="38" stroke={NAVY} strokeWidth="1.6" strokeDasharray="3 3" />
        <path d="M10 15 Q22 4 34 15" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M30 12 L34 15 L30 18" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

const FaultsIllustration: FC = () => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % FAULTS.length), 1500);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <Panel>
      <div className="grid w-full grid-cols-3 gap-2">
        {FAULTS.map((f, i) => {
          const on = !reduce && i === active;
          return (
            <button
              key={f.label}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                on ? 'scale-105 border-brand-gold bg-brand-gold/10 shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <svg viewBox="0 0 44 44" className="h-10 w-10">
                {f.icon}
              </svg>
              <span className="text-[11px] font-semibold leading-tight text-brand-navy">{f.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
};

/* 6 — Let: shuttle caught on the net cord, gently swinging; the rally is replayed. */
const LetIllustration: FC = () => {
  const reduce = useReducedMotion();
  return (
    <Panel>
      <svg viewBox="0 0 200 156" className="w-full max-w-[300px]">
        <line x1="20" y1="128" x2="180" y2="128" stroke={NAVY} strokeWidth="2" />
        {/* net */}
        <line x1="100" y1="128" x2="100" y2="52" stroke={NAVY} strokeWidth="2.5" />
        <line x1="72" y1="54" x2="128" y2="54" stroke={NAVY} strokeWidth="2.5" />
        <g stroke={NAVY} strokeWidth="0.5" opacity="0.4">
          <line x1="82" y1="56" x2="82" y2="126" />
          <line x1="91" y1="56" x2="91" y2="126" />
          <line x1="100" y1="56" x2="100" y2="126" />
          <line x1="109" y1="56" x2="109" y2="126" />
          <line x1="118" y1="56" x2="118" y2="126" />
          <line x1="72" y1="74" x2="128" y2="74" />
          <line x1="72" y1="94" x2="128" y2="94" />
          <line x1="72" y1="114" x2="128" y2="114" />
        </g>
        {/* shuttle caught on the cord, dangling and teetering from the contact point */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 56px' }}
          animate={reduce ? {} : { rotate: [-8, 8, -8] }}
          transition={reduce ? {} : { duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
        >
          <g transform="translate(100, 70) rotate(180)">
            <ShuttleShapes scale={1.15} />
          </g>
        </motion.g>
        {/* replay: a clean circular arrow that sweeps, then pauses */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '152px 92px' }}
          animate={reduce ? {} : { rotate: [0, 360] }}
          transition={reduce ? {} : { duration: 0.9, ease: [0.16, 1, 0.3, 1], repeat: Infinity, repeatDelay: 1.6 }}
        >
          <path d="M152 80 A12 12 0 1 1 140 92" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
          <path d="M147 79 L152.5 80 L151 85.5" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <text x="100" y="150" textAnchor="middle" fontSize="10" fontWeight="800" fill={NAVY}>
          LET — REPLAY THE RALLY
        </text>
      </svg>
    </Panel>
  );
};

/* 7 — Doubles Court: the service area is wider (full width) but shorter (pulled in at the back). */
const DoublesCourtIllustration: FC = () => {
  const reduce = useReducedMotion();
  const g = COURT;
  const pulseT = { duration: 2.4, ease: 'easeInOut' as const, repeat: Infinity };
  return (
    <Panel>
      <div className="w-full">
        <Court className="mx-auto w-full max-w-[180px]">
          {/* excluded back strips = the "shorter" part, outside the server's box */}
          <g fill="rgb(var(--brand-navy) / 0.18)">
            <rect x={g.OUT_L} y={g.DLS_BOT} width={g.OUT_R - g.OUT_L} height={g.BOT - g.DLS_BOT} />
            <rect x={g.OUT_L} y={g.TOP} width={g.OUT_R - g.OUT_L} height={g.DLS_TOP - g.TOP} />
          </g>
          {/* wider doubles sidelines in play */}
          <motion.g
            fill="rgb(var(--brand-gold) / 0.55)"
            animate={reduce ? { opacity: 0.5 } : { opacity: [0.3, 0.6, 0.3] }}
            transition={reduce ? {} : pulseT}
          >
            <rect x={g.OUT_L} y={g.TOP} width={g.TRAM_L - g.OUT_L} height={g.BOT - g.TOP} />
            <rect x={g.TRAM_R} y={g.TOP} width={g.OUT_R - g.TRAM_R} height={g.BOT - g.TOP} />
          </motion.g>
          {/* the server's service area — full width, only to the doubles line (short) */}
          <motion.g
            fill="rgb(var(--brand-gold) / 0.4)"
            animate={reduce ? { opacity: 0.35 } : { opacity: [0.15, 0.45, 0.15] }}
            transition={reduce ? {} : { ...pulseT, delay: 0.8 }}
          >
            <rect {...ZONES.bl} />
            <rect {...ZONES.br} />
          </motion.g>
        </Court>
        <div className="mx-auto mt-3 grid max-w-[260px] gap-2 text-xs text-brand-ink/85">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-brand-gold/70" />
            <span>
              <strong className="text-brand-navy">Wider:</strong> the outer sidelines are in play
              for doubles.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-brand-navy/25" />
            <span>
              <strong className="text-brand-navy">Shorter:</strong> the shaded back strip is outside
              the server's box.
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export const VISUALS: Record<VisualId, FC> = {
  objective: ObjectiveIllustration,
  matchFormat: MatchFormatIllustration,
  serving: ServingIllustration,
  scoring: ScoringIllustration,
  faults: FaultsIllustration,
  let: LetIllustration,
  doublesCourt: DoublesCourtIllustration,
};
