import { describe, it, expect } from 'vitest';
import { generateSkeleton, deriveBracket, buildBracket, emptyState } from './bracket';
import type { Match } from '../../src/types/bracket';

// 10 team ids "t1".."t10", where tN is seed N.
const TEAMS = Array.from({ length: 10 }, (_, i) => `t${i + 1}`);
const byId = (matches: Match[]) => Object.fromEntries(matches.map((m) => [m.id, m]));

describe('generateSkeleton (10 teams, seeds 1-6 bye)', () => {
  const matches = generateSkeleton(TEAMS, true);
  const m = byId(matches);

  it('creates exactly two play-in matches: 8v9 and 7v10', () => {
    const playins = matches.filter((x) => x.round === 'R1');
    expect(playins).toHaveLength(2);
    // R1-1 comes from seed pair (8,9); R1-2 from (7,10).
    expect([m['R1-1'].a, m['R1-1'].b].sort()).toEqual(['t8', 't9']);
    expect([m['R1-2'].a, m['R1-2'].b].sort()).toEqual(['t10', 't7']);
  });

  it('has 4 QFs, 2 SFs, a Final and a 3rd-place match (10 total)', () => {
    expect(matches.filter((x) => x.round === 'QF')).toHaveLength(4);
    expect(matches.filter((x) => x.round === 'SF')).toHaveLength(2);
    expect(matches.filter((x) => x.round === 'F')).toHaveLength(1);
    expect(matches.filter((x) => x.round === '3P')).toHaveLength(1);
    expect(matches).toHaveLength(10);
  });

  it('places bye seeds directly into the correct QF slots', () => {
    // QF1: seed 1 (bye) vs winner(8/9); QF2: 5 vs 4; QF3: 3 vs 6; QF4: winner(7/10) vs 2.
    expect(m['QF-1'].a).toBe('t1');
    expect(m['QF-1'].b).toBeNull(); // awaits play-in winner
    expect(m['QF-2'].a).toBe('t5');
    expect(m['QF-2'].b).toBe('t4');
    expect(m['QF-3'].a).toBe('t3');
    expect(m['QF-3'].b).toBe('t6');
    expect(m['QF-4'].a).toBeNull(); // awaits play-in winner
    expect(m['QF-4'].b).toBe('t2');
  });

  it('routes play-in winners to QF1.b and QF4.a', () => {
    expect(m['R1-1'].next).toEqual({ matchId: 'QF-1', slot: 'b' });
    expect(m['R1-2'].next).toEqual({ matchId: 'QF-4', slot: 'a' });
  });

  it('routes SF losers into the 3rd-place match', () => {
    expect(m['SF-1'].nextLoser).toEqual({ matchId: '3P', slot: 'a' });
    expect(m['SF-2'].nextLoser).toEqual({ matchId: '3P', slot: 'b' });
  });

  it('omits the 3rd-place match when disabled', () => {
    const no3p = generateSkeleton(TEAMS, false);
    expect(no3p.some((x) => x.id === '3P')).toBe(false);
    expect(byId(no3p)['SF-1'].nextLoser).toBeNull();
  });
});

describe('deriveBracket propagation', () => {
  it('advances a play-in winner into the quarterfinal', () => {
    const matches = deriveBracket(TEAMS, { 'R1-1': 't8' }, true);
    const m = byId(matches);
    expect(m['R1-1'].winner).toBe('t8');
    expect(m['QF-1'].b).toBe('t8');
  });

  it('carries winners all the way to a champion and 3rd place', () => {
    const results = {
      'R1-1': 't8', // QF1.b
      'R1-2': 't7', // QF4.a
      'QF-1': 't1',
      'QF-2': 't4',
      'QF-3': 't3',
      'QF-4': 't2',
      'SF-1': 't1', // t1 (QF1) vs t4 (QF2) -> t1
      'SF-2': 't2', // t3 (QF3) vs t2 (QF4) -> t2
      F: 't1',
      '3P': 't4', // SF losers t4 vs t3 -> t4
    };
    const b = buildBracket(
      TEAMS.map((id) => ({ id, name: id, player1: 'a', player2: 'b', seed: Number(id.slice(1)) })),
      { seededTeamIds: TEAMS, results, thirdPlace: true },
      'Test',
    );
    expect(b.champion).toBe('t1');
    const m = byId(b.matches);
    expect(m['F'].a).toBe('t1');
    expect(m['F'].b).toBe('t2');
    expect(m['3P'].a).toBe('t4'); // SF-1 loser
    expect(m['3P'].b).toBe('t3'); // SF-2 loser
    expect(m['3P'].winner).toBe('t4');
  });

  it('ignores a stored result whose winner is no longer a participant (self-heals)', () => {
    // QF-1 result says t8 won, but the play-in was never decided, so QF-1.b is null.
    const matches = deriveBracket(TEAMS, { 'QF-1': 't8' }, true);
    const m = byId(matches);
    expect(m['QF-1'].winner).toBeNull(); // t8 isn't in QF-1 yet -> ignored
    expect(m['SF-1'].a).toBeNull();
  });

  it('drops downstream results when an earlier winner changes', () => {
    // First: t5 wins QF2 and then SF1. Then correct QF2 to t4.
    const withT5 = deriveBracket(TEAMS, { 'QF-2': 't5', 'SF-1': 't5' }, true);
    expect(byId(withT5)['SF-1'].winner).toBe('t5');

    const corrected = deriveBracket(TEAMS, { 'QF-2': 't4', 'SF-1': 't5' }, true);
    const m = byId(corrected);
    expect(m['QF-2'].winner).toBe('t4');
    expect(m['SF-1'].b).toBe('t4'); // QF2 feeds SF1.b
    expect(m['SF-1'].winner).toBeNull(); // t5 no longer in SF-1 -> stale result dropped
  });
});

describe('buildBracket flags', () => {
  it('reports seeded=false and empty rounds before seeding', () => {
    const b = buildBracket([], emptyState(true), 'Test');
    expect(b.seeded).toBe(false);
    expect(b.champion).toBeNull();
    expect(b.rounds.QF.every((qf) => qf.a === null && qf.b === null)).toBe(true);
  });

  it('reports seeded=true with a full roster', () => {
    const b = buildBracket(
      TEAMS.map((id) => ({ id, name: id, player1: 'a', player2: 'b', seed: null })),
      { seededTeamIds: TEAMS, results: {}, thirdPlace: true },
      'Test',
    );
    expect(b.seeded).toBe(true);
    expect(b.rounds.R1).toHaveLength(2);
  });
});
