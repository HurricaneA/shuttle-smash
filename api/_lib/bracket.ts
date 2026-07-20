// Tournament engine: two round-robin group tables feed an IPL-style Top-4 playoff.
//
// State is minimal — the two ordered rosters, a map of matchId -> winnerId / score, and
// the day's schedule (running order + times). Standings, fixtures and playoff seeding are
// DERIVED on read, so correcting an earlier result self-heals everything downstream.
//
// No node/browser APIs here -> unit-testable and safe to import anywhere.

import type {
  GroupTable,
  Match,
  ScheduleRow,
  Standing,
  TableId,
  Team,
  Tournament,
  TournamentState,
} from '../../src/types/bracket';

// Self-contained constants (the API bundle must not import runtime values from src/).
export const MIN_PER_TABLE = 2;
export const MAX_PER_TABLE = 8;

type Results = Record<string, string>;
type Scores = Record<string, { a: number; b: number }>;

// Fixed fixture order for a 5-team table (matches the printed schedule). 1-based positions.
const ORDER_5: [number, number][] = [
  [1, 2],
  [3, 4],
  [1, 5],
  [2, 3],
  [4, 5],
  [1, 3],
  [2, 4],
  [3, 5],
  [1, 4],
  [2, 5],
];

// Default single-day schedule (matches the printed timetable). Times editable in admin.
const DEFAULT_GROUP_TIMES = [
  '10:00 am',
  '10:25 am',
  '11:50 am',
  '12:15 pm',
  '12:40 pm',
  '01:05 pm',
  '01:30 pm',
  '02:45 pm',
  '03:10 pm',
  '03:35 pm',
];
const BREAK_BEFORE_INDEX = 7; // break falls before the 8th group match
const DEFAULT_BREAK_TIME = '01:55 pm';
const DEFAULT_PLAYOFF_ROWS: { ids: string[]; time: string; label: string }[] = [
  { ids: ['q1', 'elim'], time: '04:00 pm', label: 'Qualifier 1 · Eliminator' },
  { ids: ['q2'], time: '04:30 pm', label: 'Qualifier 2' },
  { ids: ['final'], time: '05:30 pm', label: 'Final' },
];

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

/** Ordered list of fixture pairs (1-based table positions) covering every pairing. */
function fixtureOrder(n: number): [number, number][] {
  if (n === 5) return ORDER_5;
  const list = Array.from({ length: n }, (_, i) => i + 1);
  if (list.length % 2 === 1) list.push(0); // 0 = bye
  const m = list.length;
  const arr = [...list];
  const pairs: [number, number][] = [];
  for (let r = 0; r < m - 1; r++) {
    for (let i = 0; i < m / 2; i++) {
      const a = arr[i];
      const b = arr[m - 1 - i];
      if (a !== 0 && b !== 0) pairs.push(a < b ? [a, b] : [b, a]);
    }
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as number);
    arr.splice(1, arr.length - 1, ...rest);
  }
  return pairs;
}

const newMatch = (over: Partial<Match> & { id: string; kind: Match['kind'] }): Match => ({
  label: '',
  sublabel: null,
  tableId: null,
  matchNo: null,
  time: null,
  a: null,
  b: null,
  winner: null,
  scoreA: null,
  scoreB: null,
  ...over,
});

/** Build a table's fixtures in fixture-order (index i = pairIndex), results attached. */
function groupFixtures(tableId: TableId, ids: string[], results: Results, scores: Scores): Match[] {
  return fixtureOrder(ids.length).map(([p, q]) => {
    const [a, b] = [ids[p - 1], ids[q - 1]]; // p < q, so a is the lower table position
    const m = newMatch({ id: `g:${a}:${b}`, kind: 'group', tableId, a, b });
    applyResult(m, results, scores);
    return m;
  });
}

/** A table's standings: wins, then point difference (scored − conceded across all matches). */
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
    if (m.scoreA != null && m.scoreB != null) {
      const margin = Math.abs(m.scoreA - m.scoreB);
      sw.diff += margin; // winner gains the margin...
      sl.diff -= margin; // ...and the loser drops it (point difference works both ways)
    }
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

/** Derive the IPL Top-4 playoffs from the two tables' standings. */
function derivePlayoffs(standA: Standing[], standB: Standing[], results: Results, scores: Scores) {
  const at = (s: Standing[], i: number) => s[i]?.teamId ?? null;
  const mk = (id: string, label: string, sublabel: string | null, a: string | null, b: string | null) =>
    newMatch({ id, kind: 'playoff', label, sublabel, a, b });

  const q1 = mk('q1', 'Qualifier 1', 'Winner → Final · Loser → Qualifier 2', at(standA, 0), at(standB, 0));
  const elim = mk('elim', 'Eliminator', 'Winner → Qualifier 2 · Loser out', at(standA, 1), at(standB, 1));
  const q1r = applyResult(q1, results, scores);
  const elimR = applyResult(elim, results, scores);

  const q2 = mk('q2', 'Qualifier 2', 'Winner → Final · Loser out', q1r.loser, elimR.winner);
  const q2r = applyResult(q2, results, scores);

  const final = mk('final', 'Final', null, q1r.winner, q2r.winner);
  const finalR = applyResult(final, results, scores);

  return { matches: [q1, elim, q2, final], champion: finalR.winner };
}

/** The default single-day schedule for `nFixtures` group matches per table. */
function defaultSchedule(nFixtures: number): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  for (let i = 0; i < nFixtures; i++) {
    if (i === BREAK_BEFORE_INDEX) rows.push({ id: 'break', kind: 'break', time: DEFAULT_BREAK_TIME, label: 'Break' });
    rows.push({ id: `g${i}`, kind: 'group', pairIndex: i, time: DEFAULT_GROUP_TIMES[i] ?? '' });
  }
  for (const p of DEFAULT_PLAYOFF_ROWS) {
    rows.push({ id: `po_${p.ids.join('_')}`, kind: 'playoff', time: p.time, label: p.label, playoffIds: p.ids });
  }
  return rows;
}

const countGroupRows = (s: ScheduleRow[]) => s.filter((r) => r.kind === 'group').length;

/** Assemble the full public tournament from teams + persisted state. */
export function buildTournament(teamsFromDb: Team[], state: TournamentState, name: string): Tournament {
  const byId = new Map(teamsFromDb.map((t) => [t.id, t]));
  const rosters: Record<TableId, string[]> = {
    A: state.tableA.filter((id) => byId.has(id)),
    B: state.tableB.filter((id) => byId.has(id)),
  };
  const scores = state.scores ?? {};

  const fixtures: Record<TableId, Match[]> = {
    A: groupFixtures('A', rosters.A, state.results, scores),
    B: groupFixtures('B', rosters.B, state.results, scores),
  };
  const nFixtures = Math.max(fixtures.A.length, fixtures.B.length);

  const playoffs = derivePlayoffs(
    computeStandings(rosters.A, fixtures.A),
    computeStandings(rosters.B, fixtures.B),
    state.results,
    scores,
  );
  const playoffById = new Map(playoffs.matches.map((m) => [m.id, m]));

  // Use the saved schedule if it still matches the fixture count; otherwise re-default.
  const schedule =
    state.schedule?.length && countGroupRows(state.schedule) === nFixtures
      ? state.schedule
      : defaultSchedule(nFixtures);

  // Attach running match numbers + times from the schedule.
  let mn = 0;
  for (const row of schedule) {
    if (row.kind === 'group' && row.pairIndex != null) {
      mn += 1;
      for (const tid of ['A', 'B'] as TableId[]) {
        const m = fixtures[tid][row.pairIndex];
        if (m) {
          m.matchNo = mn;
          m.time = row.time;
          // label stays '' — the timetable shows "Match NN" and the table tag
        }
      }
    } else if (row.kind === 'playoff') {
      for (const id of row.playoffIds ?? []) {
        const m = playoffById.get(id);
        if (m) m.time = row.time;
      }
    }
  }

  const tables: GroupTable[] = (['A', 'B'] as TableId[]).map((tid) => ({
    table: tid,
    standings: computeStandings(rosters[tid], fixtures[tid]),
    matches: fixtures[tid],
  }));

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
    schedule,
    published: rosters.A.length >= 1 && rosters.B.length >= 1,
    playoffsReady: rosters.A.length >= 2 && rosters.B.length >= 2,
    champion: playoffs.champion,
  };
}

/** Number of round-robin fixtures for a table of n teams. */
export function groupFixtureCount(n: number): number {
  return fixtureOrder(n).length;
}

/** Default state for a brand-new / reset tournament. */
export function emptyState(): TournamentState {
  return { tableA: [], tableB: [], results: {}, scores: {}, schedule: [] };
}
