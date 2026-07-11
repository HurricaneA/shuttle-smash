// Tournament engine: two round-robin group tables feed an IPL-style Top-4 playoff.
//
// State is minimal — the two ordered table rosters + a map of matchId -> winnerId and
// matchId -> score. Everything else (fixtures, standings, playoff seeding) is DERIVED on
// read, so correcting an earlier result self-heals the standings and the playoffs.
//
// No node/browser APIs here -> unit-testable and safe to import anywhere.

import type {
  GroupTable,
  Match,
  Standing,
  TableId,
  Team,
  Tournament,
  TournamentState,
} from '../../src/types/bracket';

// Self-contained constants (the API bundle must not import runtime values from src/).
// Keep in sync with src/types/bracket.ts.
export const MIN_PER_TABLE = 2;
export const MAX_PER_TABLE = 8;

type Results = Record<string, string>;
type Scores = Record<string, { a: number; b: number }>;

/** Apply a stored result + score to a match, if the recorded winner is a participant. */
function applyResult(m: Match, results: Results, scores: Scores): { winner: string | null; loser: string | null } {
  const w = results[m.id];
  if (!w || !m.a || !m.b || (m.a !== w && m.b !== w)) return { winner: null, loser: null };
  m.winner = w;
  const s = scores[m.id];
  if (s) {
    m.scoreA = s.a;
    m.scoreB = s.b;
  }
  return { winner: w, loser: m.a === w ? m.b : m.a };
}

/**
 * Round-robin fixtures via the circle method. Returns fixtures with a 1-based round
 * number (the "day"), so each round is a balanced set of simultaneous matches.
 */
function roundRobin(ids: string[]): { round: number; a: string; b: string }[] {
  if (ids.length < 2) return [];
  const list = [...ids];
  if (list.length % 2 === 1) list.push('__bye__');
  const n = list.length;
  const half = n / 2;
  const arr = [...list];
  const out: { round: number; a: string; b: string }[] = [];

  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== '__bye__' && b !== '__bye__') out.push({ round: r + 1, a, b });
    }
    // rotate all but the first element
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(1, arr.length - 1, ...rest);
  }
  return out;
}

/** Build the round-robin fixtures for one table (winners/scores attached from state). */
function groupMatches(tableId: TableId, ids: string[], results: Results, scores: Scores): Match[] {
  const posOf = (id: string) => ids.indexOf(id) + 1;
  return roundRobin(ids).map((f) => {
    // canonical slot order: lower table position is slot a
    const [a, b] = posOf(f.a) < posOf(f.b) ? [f.a, f.b] : [f.b, f.a];
    const m: Match = {
      id: `g:${a}:${b}`,
      kind: 'group',
      label: `${tableId}${posOf(a)} vs ${tableId}${posOf(b)}`,
      sublabel: `Day ${f.round}`,
      tableId,
      round: f.round,
      a,
      b,
      winner: null,
      scoreA: null,
      scoreB: null,
    };
    applyResult(m, results, scores);
    return m;
  });
}

/** Compute a table's standings: wins, then point difference (sum of winning margins). */
function computeStandings(ids: string[], matches: Match[]): Standing[] {
  const stat = new Map(ids.map((id) => [id, { won: 0, lost: 0, played: 0, diff: 0 }]));
  for (const m of matches) {
    if (!m.winner || !m.a || !m.b) continue;
    const loser = m.a === m.winner ? m.b : m.a;
    const sw = stat.get(m.winner);
    const sl = stat.get(loser);
    if (!sw || !sl) continue;
    sw.played++;
    sl.played++;
    sw.won++;
    sl.lost++;
    if (m.scoreA != null && m.scoreB != null) sw.diff += Math.abs(m.scoreA - m.scoreB);
  }
  return ids
    .map((id, idx) => ({ id, idx, ...stat.get(id)! }))
    .sort((x, y) => y.won - x.won || y.diff - x.diff || x.idx - y.idx)
    .map((o, i) => ({
      teamId: o.id,
      rank: i + 1,
      played: o.played,
      won: o.won,
      lost: o.lost,
      diff: o.diff,
      points: o.won * 2,
      qualified: i < 2,
    }));
}

const playoffMatch = (id: string, label: string, sublabel: string | null, a: string | null, b: string | null): Match => ({
  id,
  kind: 'playoff',
  label,
  sublabel,
  tableId: null,
  round: null,
  a,
  b,
  winner: null,
  scoreA: null,
  scoreB: null,
});

/** Derive the IPL Top-4 playoffs from the two tables' standings. */
function derivePlayoffs(standA: Standing[], standB: Standing[], results: Results, scores: Scores) {
  const at = (s: Standing[], i: number) => s[i]?.teamId ?? null;

  const q1 = playoffMatch('q1', 'Qualifier 1', 'Winner → Final · Loser → Qualifier 2', at(standA, 0), at(standB, 0));
  const elim = playoffMatch('elim', 'Eliminator', 'Winner → Qualifier 2 · Loser out', at(standA, 1), at(standB, 1));
  const q1r = applyResult(q1, results, scores);
  const elimR = applyResult(elim, results, scores);

  const q2 = playoffMatch('q2', 'Qualifier 2', 'Winner → Final · Loser out', q1r.loser, elimR.winner);
  const q2r = applyResult(q2, results, scores);

  const final = playoffMatch('final', 'Final', null, q1r.winner, q2r.winner);
  const finalR = applyResult(final, results, scores);

  return { matches: [q1, elim, q2, final], champion: finalR.winner };
}

/** Assemble the full public tournament from teams + persisted state. */
export function buildTournament(teamsFromDb: Team[], state: TournamentState, name: string): Tournament {
  const byId = new Map(teamsFromDb.map((t) => [t.id, t]));
  const rosters: Record<TableId, string[]> = {
    A: state.tableA.filter((id) => byId.has(id)),
    B: state.tableB.filter((id) => byId.has(id)),
  };

  const tables: GroupTable[] = (['A', 'B'] as TableId[]).map((tid) => {
    const matches = groupMatches(tid, rosters[tid], state.results, state.scores ?? {});
    return { table: tid, standings: computeStandings(rosters[tid], matches), matches };
  });

  const standA = tables[0].standings;
  const standB = tables[1].standings;
  const playoffs = derivePlayoffs(standA, standB, state.results, state.scores ?? {});

  // Teams with their table + position filled in (A roster, then B roster).
  const teams: Team[] = (['A', 'B'] as TableId[]).flatMap((tid) =>
    rosters[tid].map((id, i) => {
      const t = byId.get(id)!;
      return { id: t.id, name: t.name, player1: t.player1, player2: t.player2, table: tid, position: i + 1 };
    }),
  );

  return {
    name,
    teams,
    tables,
    playoffs,
    published: rosters.A.length >= 1 && rosters.B.length >= 1,
    playoffsReady: rosters.A.length >= 2 && rosters.B.length >= 2,
    champion: playoffs.champion,
  };
}

/** Default state for a brand-new / reset tournament. */
export function emptyState(): TournamentState {
  return { tableA: [], tableB: [], results: {}, scores: {} };
}
