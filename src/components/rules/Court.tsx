// A schematic top-down doubles badminton court. Geometry is exported so other
// illustrations (the serve demo) can place a shuttle at the right coordinates.
import type { ReactNode } from 'react';

const NAVY = 'rgb(var(--brand-navy))';

// --- Geometry (viewBox 0 0 180 360, net across the middle) ---
export const COURT_VIEWBOX = '0 0 180 360';
export const NET_Y = 180;

const OUT_L = 20;
const OUT_R = 160;
const TOP = 24;
const BOT = 336;
const TRAM_L = 32; // singles sidelines (inner tramlines)
const TRAM_R = 148;
const SS_TOP = 156; // short service lines (near the net)
const SS_BOT = 204;
const DLS_TOP = 44; // doubles long-service lines (server's shorter back line)
const DLS_BOT = 316;
const MID_X = 90; // center service line

export type ZoneKey = 'bl' | 'br' | 'tl' | 'tr';

/** Court geometry constants (viewBox units), for callers that draw overlays. */
export const COURT = {
  OUT_L,
  OUT_R,
  TOP,
  BOT,
  TRAM_L,
  TRAM_R,
  SS_TOP,
  SS_BOT,
  DLS_TOP,
  DLS_BOT,
  MID_X,
  NET_Y,
};

// Doubles service courts: wide (to the outer sideline) but short (to the doubles line).
// Uses width/height so a zone can be spread straight onto an SVG <rect>.
export const ZONES: Record<ZoneKey, { x: number; y: number; width: number; height: number }> = {
  br: { x: MID_X, y: SS_BOT, width: OUT_R - MID_X, height: DLS_BOT - SS_BOT },
  bl: { x: OUT_L, y: SS_BOT, width: MID_X - OUT_L, height: DLS_BOT - SS_BOT },
  tr: { x: MID_X, y: DLS_TOP, width: OUT_R - MID_X, height: SS_TOP - DLS_TOP },
  tl: { x: OUT_L, y: DLS_TOP, width: MID_X - OUT_L, height: SS_TOP - DLS_TOP },
};

export function zoneCenter(z: ZoneKey) {
  const r = ZONES[z];
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

interface CourtProps {
  servingZone?: ZoneKey | null; // gold fill (where the serve starts)
  landingZone?: ZoneKey | null; // dashed gold target (diagonal receiver box)
  emphasizeSidelines?: boolean; // shade the wider doubles tramlines
  emphasizeServiceDepth?: boolean; // shade the "pulled-in" back strips
  className?: string;
  children?: ReactNode; // overlays (e.g. the animated shuttle)
}

export default function Court({
  servingZone = null,
  landingZone = null,
  emphasizeSidelines = false,
  emphasizeServiceDepth = false,
  className,
  children,
}: CourtProps) {
  const line = { stroke: NAVY, strokeWidth: 1.4, fill: 'none' as const };

  return (
    <svg viewBox={COURT_VIEWBOX} className={className} role="img" aria-label="Badminton court diagram">
      {/* playing surface */}
      <rect x={OUT_L} y={TOP} width={OUT_R - OUT_L} height={BOT - TOP} rx={3} fill="#eef2ff" />

      {/* wider-sideline emphasis (doubles tramlines in play) */}
      {emphasizeSidelines && (
        <g className="anim-pulse" fill="rgb(var(--brand-gold) / 0.4)">
          <rect x={OUT_L} y={TOP} width={TRAM_L - OUT_L} height={BOT - TOP} />
          <rect x={TRAM_R} y={TOP} width={OUT_R - TRAM_R} height={BOT - TOP} />
        </g>
      )}

      {/* shorter-service-box emphasis: shade the back strips excluded from serving */}
      {emphasizeServiceDepth && (
        <g fill="rgb(var(--brand-navy) / 0.12)">
          <rect x={OUT_L} y={DLS_BOT} width={OUT_R - OUT_L} height={BOT - DLS_BOT} />
          <rect x={OUT_L} y={TOP} width={OUT_R - OUT_L} height={DLS_TOP - TOP} />
        </g>
      )}

      {/* serving box */}
      {servingZone && (
        <rect {...ZONES[servingZone]} fill="rgb(var(--brand-gold) / 0.5)" />
      )}
      {/* diagonal landing box */}
      {landingZone && (
        <rect
          {...ZONES[landingZone]}
          fill="rgb(var(--brand-gold) / 0.16)"
          stroke="rgb(var(--brand-orange))"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
      )}

      {/* boundary + interior lines */}
      <rect x={OUT_L} y={TOP} width={OUT_R - OUT_L} height={BOT - TOP} rx={3} {...line} strokeWidth={2} />
      {/* singles sidelines */}
      <line x1={TRAM_L} y1={TOP} x2={TRAM_L} y2={BOT} {...line} />
      <line x1={TRAM_R} y1={TOP} x2={TRAM_R} y2={BOT} {...line} />
      {/* short service lines */}
      <line x1={OUT_L} y1={SS_TOP} x2={OUT_R} y2={SS_TOP} {...line} />
      <line x1={OUT_L} y1={SS_BOT} x2={OUT_R} y2={SS_BOT} {...line} />
      {/* doubles long service (server) lines */}
      <line x1={OUT_L} y1={DLS_TOP} x2={OUT_R} y2={DLS_TOP} {...line} />
      <line x1={OUT_L} y1={DLS_BOT} x2={OUT_R} y2={DLS_BOT} {...line} />
      {/* center service lines (only in the service area of each half) */}
      <line x1={MID_X} y1={TOP} x2={MID_X} y2={SS_TOP} {...line} />
      <line x1={MID_X} y1={SS_BOT} x2={MID_X} y2={BOT} {...line} />

      {/* net */}
      <line x1={OUT_L - 6} y1={NET_Y} x2={OUT_R + 6} y2={NET_Y} stroke={NAVY} strokeWidth={2.5} />
      <line
        x1={OUT_L - 6}
        y1={NET_Y}
        x2={OUT_R + 6}
        y2={NET_Y}
        stroke="rgb(var(--brand-gold))"
        strokeWidth={2.5}
        strokeDasharray="3 3"
      />
      <circle cx={OUT_L - 6} cy={NET_Y} r={2.5} fill={NAVY} />
      <circle cx={OUT_R + 6} cy={NET_Y} r={2.5} fill={NAVY} />

      {children}
    </svg>
  );
}
