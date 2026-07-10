// General single-elimination bracket logic for any team count (MIN_TEAMS..MAX_TEAMS).
//
// State is minimal: the seeded team order + a map of matchId -> winnerId. The full
// tree is DERIVED on read, so correcting an earlier result automatically drops any
// now-invalid downstream slots (self-healing). No node/browser APIs here -> unit-
// testable and safe to import anywhere.
//
// Byes: the bracket size is the next power of two >= N, so seeds 1..(size-N) receive
// a first-round bye. Bye teams are seated directly into the second round; only pairs
// of two real teams become actual first-round ("Play-in") matches.

import type { Bracket, BracketRound, Match, SlotKey, Team, TournamentState } from '../../src/types/bracket';

// Self-contained constants. Vercel bundles each function individually and cannot pull
// runtime values across the src/ boundary, so these live here (types above are erased
// at runtime, so type-only imports are fine). Keep in sync with src/types/bracket.ts.
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 32;

function bracketSizeFor(n: number): number {
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard bracket seed order for a bracket of `size` slots (a power of two).
 * Produces the classic separation where seed 1 and 2 can only meet in the final.
 */
function seedOrder(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s, sum - s);
    }
    seeds = next;
  }
  return seeds;
}

const slotOf = (pos: number): SlotKey => (pos % 2 === 0 ? 'a' : 'b');

/**
 * Build a fresh match graph from the seed order. Bye teams are seated directly into
 * their second-round slot; a first-round match is created only where two real teams meet.
 */
export function generateSkeleton(seededTeamIds: string[], thirdPlace: boolean): Match[] {
  const n = seededTeamIds.length;
  if (n < MIN_TEAMS) return [];

  const size = bracketSizeFor(n);
  const rounds = Math.round(Math.log2(size)); // total rounds (final is round `rounds - 1`)
  const order = seedOrder(size);
  const hasByes = n < size;
  const enable3P = thirdPlace && size >= 4;
  const teamOf = (seed: number): string | null =>
    seed >= 1 && seed <= n ? seededTeamIds[seed - 1] : null;

  const nameFor = (round: number): string => {
    if (round === 0 && hasByes) return 'Play-in';
    const distance = rounds - 1 - round; // rounds until the final
    if (distance === 0) return 'Final';
    if (distance === 1) return 'Semifinals';
    if (distance === 2) return 'Quarterfinals';
    return `Round of ${Math.pow(2, distance + 1)}`;
  };
  // Winner of match `pos` in `round` feeds match floor(pos/2) of the next round.
  const feederOf = (round: number, pos: number): Match['next'] =>
    round >= rounds - 1 ? null : { matchId: `r${round + 1}m${Math.floor(pos / 2)}`, slot: slotOf(pos) };

  const matches: Match[] = [];
  const byId: Record<string, Match> = {};
  const add = (m: Match) => {
    matches.push(m);
    byId[m.id] = m;
  };

  const semiRound = rounds - 2; // the round with exactly 2 matches (semifinals)

  // Rounds 1..final: created empty; filled by byes and (later) winners.
  for (let r = 1; r <= rounds - 1; r++) {
    const count = size / Math.pow(2, r + 1);
    for (let pos = 0; pos < count; pos++) {
      add({
        id: `r${r}m${pos}`,
        round: r,
        roundName: nameFor(r),
        label: `Match ${pos + 1}`,
        a: null,
        b: null,
        winner: null,
        scoreA: null,
        scoreB: null,
        next: feederOf(r, pos),
        nextLoser: enable3P && r === semiRound ? { matchId: 'third', slot: slotOf(pos) } : null,
      });
    }
  }

  // Round 0: collapse byes into round 1; keep only real two-team matches.
  const firstRoundMatches = size / 2;
  for (let pos = 0; pos < firstRoundMatches; pos++) {
    const t1 = teamOf(order[pos * 2]);
    const t2 = teamOf(order[pos * 2 + 1]);
    const dest = feederOf(0, pos);
    if (t1 && t2) {
      add({
        id: `r0m${pos}`,
        round: 0,
        roundName: nameFor(0),
        label: `Match ${pos + 1}`,
        a: t1,
        b: t2,
        winner: null,
        scoreA: null,
        scoreB: null,
        next: dest,
        nextLoser: enable3P && semiRound === 0 ? { matchId: 'third', slot: slotOf(pos) } : null,
      });
    } else {
      // Bye: seat the single real team straight into its second-round slot.
      const real = t1 ?? t2;
      if (real && dest) byId[dest.matchId][dest.slot] = real;
    }
  }

  if (enable3P) {
    add({
      id: 'third',
      round: rounds - 1,
      roundName: '3rd-Place Match',
      label: '3rd Place',
      a: null,
      b: null,
      winner: null,
      scoreA: null,
      scoreB: null,
      next: null,
      nextLoser: null,
    });
  }

  return matches;
}

/**
 * Replay stored results over a fresh skeleton, propagating winners into their next
 * slots and semifinal losers into the 3rd-place match. A result whose winner is no
 * longer a participant is ignored -> the bracket self-heals after a correction.
 */
export function deriveBracket(
  seededTeamIds: string[],
  results: Record<string, string>,
  scores: Record<string, { a: number; b: number }>,
  thirdPlace: boolean,
): Match[] {
  const matches = generateSkeleton(seededTeamIds, thirdPlace);
  const byId: Record<string, Match> = Object.fromEntries(matches.map((m) => [m.id, m]));

  // Apply earliest rounds first so every feeder is resolved before its target.
  for (const m of [...matches].sort((x, y) => x.round - y.round)) {
    const w = results[m.id];
    if (!w || (m.a !== w && m.b !== w)) continue; // no/invalid result -> leave TBD (scores dropped too)
    m.winner = w;
    const s = scores[m.id];
    if (s) {
      m.scoreA = s.a;
      m.scoreB = s.b;
    }
    const loser = m.a === w ? m.b : m.a;
    if (m.next) byId[m.next.matchId][m.next.slot] = w;
    if (m.nextLoser && loser) byId[m.nextLoser.matchId][m.nextLoser.slot] = loser;
  }
  return matches;
}

/** Assemble the full public bracket response from teams + persisted state. */
export function buildBracket(teams: Team[], state: TournamentState, name: string): Bracket {
  const matches = deriveBracket(state.seededTeamIds, state.results, state.scores ?? {}, state.thirdPlace);
  const n = state.seededTeamIds.length;
  const seeded = n >= MIN_TEAMS;

  // Group the main tree by round (excluding the 3rd-place match), and renumber the
  // per-round match labels sequentially (byes leave gaps in the raw positions).
  const roundMap = new Map<number, BracketRound>();
  for (const m of matches) {
    if (m.id === 'third') continue;
    if (!roundMap.has(m.round)) roundMap.set(m.round, { round: m.round, name: m.roundName, matches: [] });
    roundMap.get(m.round)!.matches.push(m);
  }
  const rounds = [...roundMap.values()].sort((a, b) => a.round - b.round);
  for (const r of rounds) r.matches.forEach((m, i) => (m.label = `Match ${i + 1}`));

  const finalMatch = rounds.length ? rounds[rounds.length - 1].matches[0] : null;
  const thirdPlaceMatch = matches.find((m) => m.id === 'third') ?? null;

  return {
    name,
    teams,
    rounds,
    thirdPlaceMatch,
    matches,
    thirdPlace: state.thirdPlace,
    seeded,
    teamCount: n,
    champion: finalMatch?.winner ?? null,
  };
}

/** Default state for a brand-new / reset tournament. */
export function emptyState(thirdPlace = true): TournamentState {
  return { seededTeamIds: [], results: {}, scores: {}, thirdPlace };
}
