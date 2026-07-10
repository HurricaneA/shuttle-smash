// Canonical types shared by the API (api/_lib) and the React UI.
// The API imports these as `import type` so there is zero runtime coupling.
//
// The bracket is a general single-elimination tree for any team count between
// MIN_TEAMS and MAX_TEAMS. Rounds are dynamic (not a fixed enum), so a bracket for
// 6, 10 or 24 teams all render through the same code.

export type SlotKey = 'a' | 'b';

/** A team = a doubles pair. */
export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  seed: number | null; // 1..N once seeded; null before
}

/** Where a winner (or loser, for the 3rd-place match) flows next. */
export interface Feeder {
  matchId: string;
  slot: SlotKey;
}

export interface Match {
  id: string; // e.g. "r0m1", "r2m0", "third"
  round: number; // 0-based; 0 = first round played, last = final
  roundName: string; // "Play-in", "Quarterfinals", "Final", "Round of 16", ...
  label: string; // per-round match label, e.g. "Match 1"
  a: string | null; // teamId, or null = TBD / awaiting a feeder / bye
  b: string | null;
  winner: string | null; // teamId (echoed from stored results)
  scoreA: number | null; // recorded score for slot a (null = not recorded)
  scoreB: number | null; // recorded score for slot b
  next: Feeder | null; // where the winner advances
  nextLoser: Feeder | null; // where the loser goes (semifinal -> 3rd-place only)
}

/** The minimal state persisted in the single Tournament row. */
export interface TournamentState {
  seededTeamIds: string[]; // length N once seeded; index 0 = seed #1
  results: Record<string, string>; // matchId -> winning teamId
  scores: Record<string, { a: number; b: number }>; // matchId -> slot a/b scores
  thirdPlace: boolean;
}

/** One column of the bracket tree. */
export interface BracketRound {
  round: number;
  name: string;
  matches: Match[];
}

/** The full, derived bracket returned by GET /api/bracket. */
export interface Bracket {
  name: string;
  teams: Team[];
  rounds: BracketRound[]; // ordered first -> final (the main tree)
  thirdPlaceMatch: Match | null;
  matches: Match[]; // flat, for lookups (includes the 3rd-place match)
  thirdPlace: boolean;
  seeded: boolean; // a valid bracket exists (teamCount >= MIN_TEAMS)
  teamCount: number;
  champion: string | null; // winner of the final, if decided
}

/** Supported team-count range for a single-elimination bracket. */
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;

/** Smallest power of two >= n (the bracket size). Minimum 2. */
export function bracketSizeFor(n: number): number {
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

/** Number of first-round byes for n teams. */
export function byesFor(n: number): number {
  return n >= MIN_TEAMS ? bracketSizeFor(n) - n : 0;
}
