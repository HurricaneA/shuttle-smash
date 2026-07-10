// Pure single-elimination bracket logic for exactly 10 doubles teams.
//
// 10 teams -> 16-slot bracket -> 6 byes to seeds 1-6, so seeds 7-10 play the two
// play-in matches (8v9 and 7v10). Rounds: R1 (2 play-ins) -> QF (4) -> SF (2) ->
// Final (1), plus an optional 3rd-place match. Total 9 matches (10 with 3rd-place).
//
// State is minimal: seeded team order + a map of matchId -> winnerId. The full tree
// is DERIVED on read, so correcting an earlier result automatically drops any now-
// invalid downstream slots (self-healing). No node/browser APIs here -> unit-testable
// and safe to import anywhere.

import type { Bracket, Match, Round, SlotKey, Team, TournamentState } from '../../src/types/bracket';
import { TEAM_COUNT } from '../../src/types/bracket';

// Standard 16-team seed slot order. Each adjacent pair is a Round-1 matchup.
const SEED_SLOTS_16 = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];

// Which QF slot each of the 8 seed pairs feeds into.
const QF_DEST: { qf: string; slot: SlotKey }[] = [
  { qf: 'QF-1', slot: 'a' },
  { qf: 'QF-1', slot: 'b' },
  { qf: 'QF-2', slot: 'a' },
  { qf: 'QF-2', slot: 'b' },
  { qf: 'QF-3', slot: 'a' },
  { qf: 'QF-3', slot: 'b' },
  { qf: 'QF-4', slot: 'a' },
  { qf: 'QF-4', slot: 'b' },
];

/**
 * Build a fresh match graph from the seed order. Bye teams are placed directly into
 * their QF slot; a play-in match is created only where two real teams meet.
 */
export function generateSkeleton(seededTeamIds: string[], thirdPlace: boolean): Match[] {
  const teamOf = (seed: number): string | null =>
    seed >= 1 && seed <= seededTeamIds.length ? seededTeamIds[seed - 1] : null;

  // Quarterfinals: created empty, filled below by byes and (later) play-in winners.
  const QF: Record<string, Match> = {};
  for (let i = 1; i <= 4; i++) {
    QF[`QF-${i}`] = {
      id: `QF-${i}`,
      round: 'QF',
      label: `Quarterfinal ${i}`,
      a: null,
      b: null,
      winner: null,
      next: { matchId: i <= 2 ? 'SF-1' : 'SF-2', slot: i % 2 === 1 ? 'a' : 'b' },
      nextLoser: null,
    };
  }

  const playins: Match[] = [];
  for (let i = 0; i < 8; i++) {
    const s1 = SEED_SLOTS_16[i * 2];
    const s2 = SEED_SLOTS_16[i * 2 + 1];
    const t1 = teamOf(s1);
    const t2 = teamOf(s2);
    const dest = QF_DEST[i];

    if (t1 && t2) {
      // Two real teams -> an actual play-in match feeding the QF slot.
      const n = playins.length + 1;
      playins.push({
        id: `R1-${n}`,
        round: 'R1',
        label: `Play-in ${n}`,
        a: t1,
        b: t2,
        winner: null,
        next: { matchId: dest.qf, slot: dest.slot },
        nextLoser: null,
      });
    } else {
      // Bye: the single real team (if any) advances straight into the QF slot.
      QF[dest.qf][dest.slot] = t1 ?? t2;
    }
  }

  const sf1: Match = {
    id: 'SF-1',
    round: 'SF',
    label: 'Semifinal 1',
    a: null,
    b: null,
    winner: null,
    next: { matchId: 'F', slot: 'a' },
    nextLoser: thirdPlace ? { matchId: '3P', slot: 'a' } : null,
  };
  const sf2: Match = {
    id: 'SF-2',
    round: 'SF',
    label: 'Semifinal 2',
    a: null,
    b: null,
    winner: null,
    next: { matchId: 'F', slot: 'b' },
    nextLoser: thirdPlace ? { matchId: '3P', slot: 'b' } : null,
  };
  const fin: Match = {
    id: 'F',
    round: 'F',
    label: 'Final',
    a: null,
    b: null,
    winner: null,
    next: null,
    nextLoser: null,
  };

  const out: Match[] = [...playins, QF['QF-1'], QF['QF-2'], QF['QF-3'], QF['QF-4'], sf1, sf2, fin];
  if (thirdPlace) {
    out.push({
      id: '3P',
      round: '3P',
      label: '3rd-Place Match',
      a: null,
      b: null,
      winner: null,
      next: null,
      nextLoser: null,
    });
  }
  return out;
}

// Order in which results are applied so every feeder is resolved before its target.
const APPLY_ORDER: Round[] = ['R1', 'QF', 'SF', 'F', '3P'];

/**
 * Replay stored results over a fresh skeleton, propagating winners into their next
 * slots and SF losers into the 3rd-place match. A result whose winner is no longer a
 * participant of that match is ignored -> the bracket self-heals after a correction.
 */
export function deriveBracket(
  seededTeamIds: string[],
  results: Record<string, string>,
  thirdPlace: boolean,
): Match[] {
  const matches = generateSkeleton(seededTeamIds, thirdPlace);
  const byId: Record<string, Match> = Object.fromEntries(matches.map((m) => [m.id, m]));

  for (const round of APPLY_ORDER) {
    for (const m of matches) {
      if (m.round !== round) continue;
      const w = results[m.id];
      // Only honour a result if the recorded winner is actually in this match now.
      if (!w || (m.a !== w && m.b !== w)) continue;
      m.winner = w;
      const loser = m.a === w ? m.b : m.a;
      if (m.next) byId[m.next.matchId][m.next.slot] = w;
      if (m.nextLoser && loser) byId[m.nextLoser.matchId][m.nextLoser.slot] = loser;
    }
  }
  return matches;
}

/** Group a flat match list into a per-round record for column rendering. */
function groupByRound(matches: Match[]): Record<Round, Match[]> {
  const rounds: Record<Round, Match[]> = { R1: [], QF: [], SF: [], F: [], '3P': [] };
  for (const m of matches) rounds[m.round].push(m);
  return rounds;
}

/** Assemble the full public bracket response from teams + persisted state. */
export function buildBracket(teams: Team[], state: TournamentState, name: string): Bracket {
  const matches = deriveBracket(state.seededTeamIds, state.results, state.thirdPlace);
  const seeded = state.seededTeamIds.length === TEAM_COUNT;
  const final = matches.find((m) => m.id === 'F');
  return {
    name,
    teams,
    rounds: groupByRound(matches),
    matches,
    thirdPlace: state.thirdPlace,
    seeded,
    champion: final?.winner ?? null,
  };
}

/** Default state for a brand-new / reset tournament. */
export function emptyState(thirdPlace = true): TournamentState {
  return { seededTeamIds: [], results: {}, thirdPlace };
}
