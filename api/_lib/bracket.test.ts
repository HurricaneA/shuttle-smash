import { describe, it, expect } from 'vitest';
import { buildTournament, emptyState } from './bracket';
import type { Match, Team, TournamentState } from '../../src/types/bracket';

const team = (id: string): Team => ({ id, name: id, player1: 'a', player2: 'b', table: null, position: null });
const A = ['a1', 'a2', 'a3', 'a4', 'a5'];
const B = ['b1', 'b2', 'b3', 'b4', 'b5'];
const ALL = [...A, ...B].map(team);
const gid = (lo: string, hi: string) => `g:${lo}:${hi}`;

const st = (
  tableA = A,
  tableB = B,
  results: Record<string, string> = {},
  scores: Record<string, { a: number; b: number }> = {},
): TournamentState => ({ tableA, tableB, results, scores });
const build = (state: TournamentState) => buildTournament(ALL, state, 'x');
const groupA = (t: ReturnType<typeof build>) => t.tables.find((x) => x.table === 'A')!;
const playoff = (t: ReturnType<typeof build>, id: string): Match =>
  t.playoffs.matches.find((m) => m.id === id)!;

/** Make grp[i] beat grp[j] for i<j, each by `margin`, filling every fixture. */
function transitive(grp: string[], results: Record<string, string>, scores: Record<string, { a: number; b: number }>, margin = 6) {
  for (let i = 0; i < grp.length; i++) {
    for (let j = i + 1; j < grp.length; j++) {
      const id = gid(grp[i], grp[j]);
      results[id] = grp[i];
      scores[id] = { a: 10 + margin, b: 10 };
    }
  }
}

describe('group fixtures', () => {
  it('a 5-team table has 10 round-robin fixtures over 5 days', () => {
    const g = groupA(build(st()));
    expect(g.matches).toHaveLength(10);
    expect(new Set(g.matches.map((m) => m.round)).size).toBe(5);
    // each team appears in 4 fixtures
    for (const id of A) {
      expect(g.matches.filter((m) => m.a === id || m.b === id)).toHaveLength(4);
    }
  });

  it('flags published / playoffsReady from the rosters', () => {
    expect(build(st()).published).toBe(true);
    expect(build(st()).playoffsReady).toBe(true);
    expect(build(st(['a1'], ['b1'])).playoffsReady).toBe(false); // <2 each
    expect(build(st(A, [])).published).toBe(false);
    expect(build(emptyState()).published).toBe(false);
  });
});

describe('standings', () => {
  it('point difference = sum of winning margins (losses do not subtract)', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    // a1 beats a3 by 10 and a4 by 5; loses nothing else recorded
    results[gid('a1', 'a3')] = 'a1';
    scores[gid('a1', 'a3')] = { a: 15, b: 5 };
    results[gid('a1', 'a4')] = 'a1';
    scores[gid('a1', 'a4')] = { a: 15, b: 10 };
    const s = groupA(build(st(A, B, results, scores))).standings.find((x) => x.teamId === 'a1')!;
    expect(s.won).toBe(2);
    expect(s.points).toBe(4);
    expect(s.diff).toBe(15); // 10 + 5
  });

  it('ranks by wins, then by point difference', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    // a1 and a2 each win exactly one, a1 by a bigger margin
    results[gid('a1', 'a3')] = 'a1';
    scores[gid('a1', 'a3')] = { a: 15, b: 5 }; // +10
    results[gid('a2', 'a4')] = 'a2';
    scores[gid('a2', 'a4')] = { a: 15, b: 13 }; // +2
    const standings = groupA(build(st(A, B, results, scores))).standings;
    expect(standings[0].teamId).toBe('a1');
    expect(standings[1].teamId).toBe('a2');
    expect(standings[0].qualified).toBe(true);
  });
});

describe('IPL playoffs', () => {
  it('seeds Q1 = A1 v B1 and Eliminator = A2 v B2, then flows to a champion', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    transitive(A, results, scores); // ranks a1>a2>a3>a4>a5
    transitive(B, results, scores); // ranks b1>b2>b3>b4>b5

    let t = build(st(A, B, results, scores));
    expect([playoff(t, 'q1').a, playoff(t, 'q1').b]).toEqual(['a1', 'b1']);
    expect([playoff(t, 'elim').a, playoff(t, 'elim').b]).toEqual(['a2', 'b2']);

    // a1 wins Q1 -> Final; b1 (loser) -> Q2. a2 wins Eliminator -> Q2.
    results['q1'] = 'a1';
    results['elim'] = 'a2';
    t = build(st(A, B, results, scores));
    expect([playoff(t, 'q2').a, playoff(t, 'q2').b]).toEqual(['b1', 'a2']);
    expect(playoff(t, 'final').a).toBe('a1');

    // a2 wins Q2 -> Final; a1 wins the Final -> champion.
    results['q2'] = 'a2';
    results['final'] = 'a1';
    t = build(st(A, B, results, scores));
    expect(playoff(t, 'final').b).toBe('a2');
    expect(t.champion).toBe('a1');
  });

  it('self-heals: changing a group result drops a now-invalid playoff result', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    transitive(A, results, scores);
    transitive(B, results, scores);
    results['q1'] = 'b1'; // b1 wins Q1

    // Now flip B so b2 beats b1 -> b2 becomes B1, b1 drops to B2.
    results[gid('b1', 'b2')] = 'b2';
    scores[gid('b1', 'b2')] = { a: 5, b: 15 };
    const t = build(st(A, B, results, scores));
    expect(playoff(t, 'q1').b).toBe('b2'); // Q1 is now a1 v b2
    expect(playoff(t, 'q1').winner).toBeNull(); // stale "b1 won" is ignored
  });
});
