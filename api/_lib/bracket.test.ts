import { describe, it, expect } from 'vitest';
import { generateSkeleton, deriveBracket, buildBracket, emptyState } from './bracket';
import type { Match, Team } from '../../src/types/bracket';

// Team ids "t1".."tN", where tK is seed K.
const teamsFor = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);
const teamObjs = (n: number): Team[] =>
  teamsFor(n).map((id) => ({ id, name: id, player1: 'a', player2: 'b', seed: Number(id.slice(1)) }));
const seedNum = (id: string | null) => (id ? Number(id.slice(1)) : null);
const state = (n: number, results = {}, scores = {}, thirdPlace = true) => ({
  seededTeamIds: teamsFor(n),
  results,
  scores,
  thirdPlace,
});

/** Play the whole bracket deterministically (slot "a" always wins) and return results. */
function playBracket(seed: string[], thirdPlace: boolean): Record<string, string> {
  const results: Record<string, string> = {};
  for (let i = 0; i < 100; i++) {
    const matches = deriveBracket(seed, results, {}, thirdPlace);
    const ready = matches.filter((m) => m.a && m.b && !results[m.id]);
    if (!ready.length) break;
    for (const m of ready) results[m.id] = m.a as string;
  }
  return results;
}

describe('generateSkeleton — 10 teams (6 byes)', () => {
  const matches = generateSkeleton(teamsFor(10), true);
  const round0 = matches.filter((m) => m.round === 0);

  it('creates exactly two play-in matches: 8v9 and 7v10', () => {
    expect(round0).toHaveLength(2);
    const pairs = round0.map((m) => [seedNum(m.a), seedNum(m.b)].sort((x, y) => x! - y!));
    expect(pairs).toContainEqual([8, 9]);
    expect(pairs).toContainEqual([7, 10]);
  });

  it('has N-1 total matches plus a 3rd-place match', () => {
    expect(matches.filter((m) => m.id !== 'third')).toHaveLength(9);
    expect(matches.some((m) => m.id === 'third')).toBe(true);
  });

  it('names the rounds Play-in → Quarterfinals → Semifinals → Final', () => {
    const b = buildBracket(teamObjs(10), state(10), 'x');
    expect(b.rounds.map((r) => r.name)).toEqual(['Play-in', 'Quarterfinals', 'Semifinals', 'Final']);
    expect(b.thirdPlaceMatch).not.toBeNull();
  });
});

describe('round shapes for various team counts', () => {
  const cases: { n: number; names: string[]; total: number }[] = [
    { n: 2, names: ['Final'], total: 1 },
    { n: 4, names: ['Semifinals', 'Final'], total: 3 },
    { n: 8, names: ['Quarterfinals', 'Semifinals', 'Final'], total: 7 },
    { n: 16, names: ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'], total: 15 },
    { n: 6, names: ['Play-in', 'Semifinals', 'Final'], total: 5 },
  ];
  for (const c of cases) {
    it(`${c.n} teams → ${c.names.join(' / ')}`, () => {
      const b = buildBracket(teamObjs(c.n), state(c.n), 'x');
      expect(b.rounds.map((r) => r.name)).toEqual(c.names);
      expect(b.matches.filter((m) => m.id !== 'third')).toHaveLength(c.total);
    });
  }

  it('omits the 3rd-place match below 4 teams', () => {
    const b = buildBracket(teamObjs(2), state(2), 'x');
    expect(b.thirdPlaceMatch).toBeNull();
  });
});

describe('playing a bracket to completion', () => {
  for (const n of [2, 4, 6, 8, 10, 16, 24]) {
    it(`${n} teams produces a champion`, () => {
      const seed = teamsFor(n);
      const results = playBracket(seed, true);
      const b = buildBracket(teamObjs(n), { seededTeamIds: seed, results, scores: {}, thirdPlace: true }, 'x');
      expect(b.champion).not.toBeNull();
      if (b.thirdPlaceMatch) expect(b.thirdPlaceMatch.winner).not.toBeNull();
    });
  }
});

describe('scores decide + display', () => {
  const seed = teamsFor(8);
  const find = (ms: Match[], id: string) => ms.find((m) => m.id === id)!;

  it('attaches a recorded score to the deciding match', () => {
    const r0m0 = find(generateSkeleton(seed, true), 'r0m0');
    // team in slot a scores 21, slot b scores 15 -> slot a wins
    const b = buildBracket(
      teamObjs(8),
      { seededTeamIds: seed, results: { r0m0: r0m0.a! }, scores: { r0m0: { a: 21, b: 15 } }, thirdPlace: true },
      'x',
    );
    const m = find(b.matches, 'r0m0');
    expect(m.winner).toBe(r0m0.a);
    expect(m.scoreA).toBe(21);
    expect(m.scoreB).toBe(15);
  });

  it('drops a score when its result self-heals away', () => {
    // r1m0 has no participants yet, so a stale result+score is ignored
    const b = buildBracket(
      teamObjs(8),
      { seededTeamIds: seed, results: { r1m0: 't1' }, scores: { r1m0: { a: 21, b: 10 } }, thirdPlace: true },
      'x',
    );
    const m = find(b.matches, 'r1m0');
    expect(m.winner).toBeNull();
    expect(m.scoreA).toBeNull();
    expect(m.scoreB).toBeNull();
  });
});

describe('propagation + self-healing (8 teams)', () => {
  const seed = teamsFor(8);
  const find = (ms: Match[], id: string) => ms.find((m) => m.id === id)!;

  it('advances a winner into the next round', () => {
    const r0m0 = find(generateSkeleton(seed, true), 'r0m0');
    const matches = deriveBracket(seed, { r0m0: r0m0.a! }, {}, true);
    expect(find(matches, 'r0m0').winner).toBe(r0m0.a);
    expect(find(matches, 'r1m0').a).toBe(r0m0.a);
  });

  it('drops downstream results when an earlier winner changes', () => {
    const r0m0 = find(generateSkeleton(seed, true), 'r0m0');
    const a = r0m0.a!;
    const b = r0m0.b!;
    let results: Record<string, string> = { r0m0: a, r1m0: a };
    expect(find(deriveBracket(seed, results, {}, true), 'r1m0').winner).toBe(a);
    results = { r0m0: b, r1m0: a };
    const fixed = deriveBracket(seed, results, {}, true);
    expect(find(fixed, 'r1m0').a).toBe(b);
    expect(find(fixed, 'r1m0').winner).toBeNull();
  });

  it('ignores a result whose winner is not a current participant', () => {
    const matches = deriveBracket(seed, { r1m0: 't1' }, {}, true);
    expect(find(matches, 'r1m0').winner).toBeNull();
  });
});

describe('buildBracket flags', () => {
  it('reports not-seeded for an empty roster', () => {
    const b = buildBracket([], emptyState(true), 'x');
    expect(b.seeded).toBe(false);
    expect(b.teamCount).toBe(0);
    expect(b.rounds).toHaveLength(0);
    expect(b.champion).toBeNull();
  });

  it('reports seeded with a team count', () => {
    const b = buildBracket(teamObjs(12), state(12, {}, {}, false), 'x');
    expect(b.seeded).toBe(true);
    expect(b.teamCount).toBe(12);
    expect(b.thirdPlaceMatch).toBeNull();
  });
});
