// Data-access helpers: read/write the single Tournament row + teams, and assemble the
// derived bracket response. Keeps the endpoint handlers small.

import type { Bracket, Team, TournamentState } from '../../src/types/bracket';
import { prisma } from './prisma.js';
import { buildBracket, emptyState } from './bracket.js';

const MAIN = 'main';

/** Ensure the single "main" tournament row exists and return it. */
export async function getTournamentRow() {
  return prisma.tournament.upsert({
    where: { id: MAIN },
    update: {},
    create: { id: MAIN },
  });
}

/** Cast the stored JSON into a well-formed TournamentState, filling defaults. */
export function readState(raw: unknown): TournamentState {
  const s = (raw ?? {}) as Partial<TournamentState>;
  return {
    seededTeamIds: Array.isArray(s.seededTeamIds) ? s.seededTeamIds : [],
    results: s.results && typeof s.results === 'object' ? s.results : {},
    thirdPlace: typeof s.thirdPlace === 'boolean' ? s.thirdPlace : true,
  };
}

/** Persist a new state onto the main tournament row. */
export async function saveState(state: TournamentState) {
  return prisma.tournament.update({
    where: { id: MAIN },
    // Cast through unknown: Prisma's Json input type doesn't accept our interface directly.
    data: { state: state as unknown as object },
  });
}

/** Load all teams, sorted by seed (unseeded last), then name. */
export async function loadTeams(): Promise<Team[]> {
  const teams = await prisma.team.findMany();
  return teams
    .map((t) => ({ id: t.id, name: t.name, player1: t.player1, player2: t.player2, seed: t.seed }))
    .sort((a, b) => {
      if (a.seed != null && b.seed != null) return a.seed - b.seed;
      if (a.seed != null) return -1;
      if (b.seed != null) return 1;
      return a.name.localeCompare(b.name);
    });
}

/** Assemble the full public bracket response from the DB. */
export async function getBracket(): Promise<Bracket> {
  const [row, teams] = await Promise.all([getTournamentRow(), loadTeams()]);
  const state = readState(row.state);
  return buildBracket(teams, state, row.name);
}

export { emptyState };
