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
): TournamentState => ({ tableA, tableB, results, scores, schedule: [] });
const build = (state: TournamentState) => buildTournament(ALL, state, 'x');
const groupA = (t: ReturnType<typeof build>) => t.tables.find((x) => x.table === 'A')!;
const playoff = (t: ReturnType<typeof build>, id: string): Match =>
  t.playoffs.matches.find((m) => m.id === id)!;

function transitive(grp: string[], results: Record<string, string>, scores: Record<string, { a: number; b: number }>, margin = 6) {
  for (let i = 0; i < grp.length; i++) {
    for (let j = i + 1; j < grp.length; j++) {
      const id = gid(grp[i], grp[j]);
      results[id] = grp[i];
      scores[id] = { a: 10 + margin, b: 10 };
    }
  }
}

describe('group fixtures + schedule', () => {
  const g = groupA(build(st()));

  it('has 10 fixtures in the fixed printed order (Match 01 = A1 v A2)', () => {
    expect(g.matches).toHaveLength(10);
    expect(g.matches[0]).toMatchObject({ a: 'a1', b: 'a2', matchNo: 1, time: '10:00 am' });
    expect(g.matches[1]).toMatchObject({ a: 'a3', b: 'a4', matchNo: 2 });
    expect(g.matches[2]).toMatchObject({ a: 'a1', b: 'a5', matchNo: 3 });
    expect(g.matches[9]).toMatchObject({ a: 'a2', b: 'a5', matchNo: 10 });
    for (const id of A) expect(g.matches.filter((m) => m.a === id || m.b === id)).toHaveLength(4);
  });

  it('builds a default schedule with a break and playoff rows', () => {
    const s = build(st()).schedule;
    expect(s.filter((r) => r.kind === 'group')).toHaveLength(10);
    expect(s.some((r) => r.kind === 'break')).toBe(true);
    expect(s.filter((r) => r.kind === 'playoff')).toHaveLength(3);
  });

  it('flags published / playoffsReady from the rosters', () => {
    expect(build(st()).published).toBe(true);
    expect(build(st()).playoffsReady).toBe(true);
    expect(build(st(['a1'], ['b1'])).playoffsReady).toBe(false);
    expect(build(st(A, [])).published).toBe(false);
    expect(build(emptyState()).published).toBe(false);
  });
});

describe('standings (point difference works both ways)', () => {
  it('winner gains the margin and the loser drops it', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    results[gid('a1', 'a3')] = 'a1';
    scores[gid('a1', 'a3')] = { a: 15, b: 5 }; // margin 10
    const standings = groupA(build(st(A, B, results, scores))).standings;
    const a1 = standings.find((x) => x.teamId === 'a1')!;
    const a3 = standings.find((x) => x.teamId === 'a3')!;
    expect(a1.diff).toBe(10);
    expect(a3.diff).toBe(-10);
    expect(a1.points).toBe(2);
  });

  it('ranks by wins, then by point difference', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    results[gid('a1', 'a3')] = 'a1';
    scores[gid('a1', 'a3')] = { a: 15, b: 5 }; // a1 +10
    results[gid('a2', 'a4')] = 'a2';
    scores[gid('a2', 'a4')] = { a: 15, b: 13 }; // a2 +2
    const standings = groupA(build(st(A, B, results, scores))).standings;
    expect(standings[0].teamId).toBe('a1');
    expect(standings[1].teamId).toBe('a2');
  });
});

describe('IPL playoffs', () => {
  it('seeds Q1 = A1 v B1 and Eliminator = A2 v B2, then flows to a champion', () => {
    const results: Record<string, string> = {};
    const scores: Record<string, { a: number; b: number }> = {};
    transitive(A, results, scores);
    transitive(B, results, scores);

    let t = build(st(A, B, results, scores));
    expect([playoff(t, 'q1').a, playoff(t, 'q1').b]).toEqual(['a1', 'b1']);
    expect([playoff(t, 'elim').a, playoff(t, 'elim').b]).toEqual(['a2', 'b2']);

    results['q1'] = 'a1';
    results['elim'] = 'a2';
    t = build(st(A, B, results, scores));
    expect([playoff(t, 'q2').a, playoff(t, 'q2').b]).toEqual(['b1', 'a2']);
    expect(playoff(t, 'final').a).toBe('a1');

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
    results['q1'] = 'b1';

    results[gid('b1', 'b2')] = 'b2';
    scores[gid('b1', 'b2')] = { a: 5, b: 15 };
    const t = build(st(A, B, results, scores));
    expect(playoff(t, 'q1').b).toBe('b2');
    expect(playoff(t, 'q1').winner).toBeNull();
  });
});
