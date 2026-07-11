// Canonical types shared by the API (api/_lib) and the React UI.
// The API imports these as `import type` so there is zero runtime coupling.
//
// Format: two round-robin group tables (A & B) feed an IPL-style Top-4 playoff
// (Qualifier 1 / Eliminator / Qualifier 2 / Final). Standings rank by wins, then by
// point difference (sum of winning margins). The whole thing is derived on read from
// a minimal persisted state.

export type TableId = 'A' | 'B';

/** A team = a doubles pair, assigned to a group table. */
export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  table: TableId | null; // which group (null before assignment)
  position: number | null; // 1-based slot within the table (A1, A2, ...)
}

/** A single match — a group fixture or a playoff tie. */
export interface Match {
  id: string;
  kind: 'group' | 'playoff';
  label: string; // "Qualifier 1", "Final", or "" for a group fixture
  sublabel: string | null; // "Winner → Final · Loser out", or "Day 2"
  tableId: TableId | null; // group fixtures only
  round: number | null; // group round / day
  a: string | null; // teamId in slot a (or null = TBD)
  b: string | null;
  winner: string | null;
  scoreA: number | null;
  scoreB: number | null;
}

/** One row of a group table's standings. */
export interface Standing {
  teamId: string;
  rank: number; // 1-based
  played: number;
  won: number;
  lost: number;
  diff: number; // point difference = sum of winning margins
  points: number; // won * 2
  qualified: boolean; // top 2 advance to the playoffs
}

export interface GroupTable {
  table: TableId;
  standings: Standing[];
  matches: Match[]; // round-robin fixtures
}

export interface Playoffs {
  matches: Match[]; // [q1, elim, q2, final]
  champion: string | null;
}

/** The full, derived tournament returned by GET /api/bracket. */
export interface Tournament {
  name: string;
  teams: Team[];
  tables: GroupTable[]; // [A, B]
  playoffs: Playoffs;
  published: boolean; // both tables have at least one team
  playoffsReady: boolean; // both tables have >= 2 teams
  champion: string | null;
}

/** The minimal state persisted in the single Tournament row. */
export interface TournamentState {
  tableA: string[]; // ordered team ids in Table A
  tableB: string[]; // ordered team ids in Table B
  results: Record<string, string>; // matchId -> winning teamId
  scores: Record<string, { a: number; b: number }>; // matchId -> slot a/b scores
}

/** Team-count guardrails per table (round-robin works for any size in range). */
export const MIN_PER_TABLE = 2;
export const MAX_PER_TABLE = 8;
