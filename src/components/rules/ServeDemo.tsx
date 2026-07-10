import { useEffect, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import Court, { zoneCenter, type ZoneKey } from './Court';
import { ShuttleShapes } from './primitives';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Interactive serving demo. The server's score decides the box (even → right,
 * odd → left) and the shuttle serves diagonally into the opposite service court.
 */
export default function ServeDemo() {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [score, setScore] = useState(0);
  const [serving, setServing] = useState(false);

  const even = score % 2 === 0;
  const servingZone: ZoneKey = even ? 'br' : 'bl';
  const landingZone: ZoneKey = servingZone === 'br' ? 'tl' : 'tr';
  const start = zoneCenter(servingZone);
  const land = zoneCenter(landingZone);
  const tilt = servingZone === 'br' ? -22 : 22;

  // Snap the shuttle to the serving box whenever the parity flips (and on mount).
  useEffect(() => {
    if (!serving) controls.set({ x: start.x, y: start.y, rotate: tilt });
  }, [servingZone]); // eslint-disable-line react-hooks/exhaustive-deps

  const serve = async () => {
    if (serving) return;
    setServing(true);
    controls.set({ x: start.x, y: start.y, rotate: tilt });
    await controls.start({
      x: land.x,
      y: land.y,
      rotate: tilt,
      transition: { duration: reduce ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] },
    });
    if (!reduce) await sleep(650);
    await controls.start({
      x: start.x,
      y: start.y,
      transition: { duration: reduce ? 0 : 0.4, ease: 'easeInOut' },
    });
    setServing(false);
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[240px]">
        <Court servingZone={servingZone} landingZone={landingZone} className="w-full drop-shadow-sm">
          <motion.g animate={controls} initial={{ x: start.x, y: start.y, rotate: tilt }}>
            <g className="anim-float">
              <ShuttleShapes scale={1.15} />
            </g>
          </motion.g>
        </Court>
      </div>

      <div className="mx-auto mt-4 max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-navy">Server's score</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              even ? 'bg-brand-gold/30 text-brand-navy' : 'bg-brand-royal/15 text-brand-royal'
            }`}
          >
            {even ? 'Even → Right box' : 'Odd → Left box'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setScore((s) => Math.max(0, s - 1))}
            disabled={serving}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-brand-navy/20 text-xl font-bold text-brand-navy transition-colors hover:border-brand-navy disabled:opacity-40"
            aria-label="Decrease score"
          >
            −
          </button>
          <span className="w-12 text-center font-display text-4xl font-extrabold text-brand-navy">
            {score}
          </span>
          <button
            type="button"
            onClick={() => setScore((s) => s + 1)}
            disabled={serving}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-brand-navy/20 text-xl font-bold text-brand-navy transition-colors hover:border-brand-navy disabled:opacity-40"
            aria-label="Increase score"
          >
            +
          </button>
        </div>

        <button type="button" onClick={serve} disabled={serving} className="btn-gold mt-4 w-full">
          {serving ? 'Serving…' : 'Serve ▶'}
        </button>
        <p className="mt-2 text-center text-xs text-brand-ink/60">
          Change the score and serve — the shuttle always crosses diagonally into the far box.
        </p>
      </div>
    </div>
  );
}
