// Canonical types shared by the API (api/_lib) and the React UI.
// The API imports these as `import type` so there is zero runtime coupling.

export type Round = 'R1' | 'QF' | 'SF' | 'F' | '3P';
export type SlotKey = 'a' | 'b';

/** A team = a doubles pair. */
export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  seed: number | null; // 1..10 once seeded; null before
}

/** Where a winner (or loser, for the 3rd-place match) flows next. */
export interface Feeder {
  matchId: string;
  slot: SlotKey;
}

export interface Match {
  id: string; // "R1-1","R1-2","QF-1".."QF-4","SF-1","SF-2","F","3P"
  round: Round;
  label: string; // "Play-in 1", "Quarterfinal 1", ...
  a: string | null; // teamId, or null = TBD / awaiting a feeder / bye
  b: string | null;
  winner: string | null; // teamId (echoed from stored results)
  next: Feeder | null; // where the winner advances
  nextLoser: Feeder | null; // where the loser goes (SF -> 3rd-place only)
}

/** The minimal state persisted in the single Tournament row. */
export interface TournamentState {
  seededTeamIds: string[]; // length 10 once seeded; index 0 = seed #1
  results: Record<string, string>; // matchId -> winning teamId
  thirdPlace: boolean;
}

/** The full, derived bracket returned by GET /api/bracket. */
export interface Bracket {
  name: string;
  teams: Team[];
  rounds: Record<Round, Match[]>; // grouped for column rendering
  matches: Match[]; // flat, for lookups
  thirdPlace: boolean;
  seeded: boolean; // seededTeamIds.length === 10
  champion: string | null; // winner of the Final, if decided
}

/** Column order for the main knockout tree (3rd-place is rendered separately). */
export const ROUND_ORDER: Round[] = ['R1', 'QF', 'SF', 'F'];

export const ROUND_TITLE: Record<Round, string> = {
  R1: 'Play-in',
  QF: 'Quarterfinals',
  SF: 'Semifinals',
  F: 'Final',
  '3P': '3rd-Place Match',
};

/** Total teams the bracket is designed for. */
export const TEAM_COUNT = 10;
