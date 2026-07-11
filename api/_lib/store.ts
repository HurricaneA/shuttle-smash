// Data-access helpers: read/write the single Tournament row + teams, and assemble the
// derived tournament response. Keeps the endpoint handlers small.

import type { Match, TableId, Team, Tournament, TournamentState } from '../../src/types/bracket';
import { prisma } from './prisma.js';
import { buildTournament, emptyState } from './bracket.js';

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
    tableA: Array.isArray(s.tableA) ? s.tableA : [],
    tableB: Array.isArray(s.tableB) ? s.tableB : [],
    results: s.results && typeof s.results === 'object' ? s.results : {},
    scores: s.scores && typeof s.scores === 'object' ? s.scores : {},
  };
}

/** Persist a new state onto the main tournament row. */
export async function saveState(state: TournamentState) {
  return prisma.tournament.update({
    where: { id: MAIN },
    data: { state: state as unknown as object },
  });
}

/** Load all teams (table/position are filled in later by buildTournament). */
export async function loadTeams(): Promise<Team[]> {
  const teams = await prisma.team.findMany();
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    player1: t.player1,
    player2: t.player2,
    table: null as TableId | null,
    position: null as number | null,
  }));
}

/** Assemble the full public tournament from the DB. */
export async function getTournament(): Promise<Tournament> {
  const [row, teams] = await Promise.all([getTournamentRow(), loadTeams()]);
  return buildTournament(teams, readState(row.state), row.name);
}

/** Flatten every match (group fixtures + playoffs) for id lookups. */
export function allMatches(t: Tournament): Match[] {
  return [...t.tables.flatMap((g) => g.matches), ...t.playoffs.matches];
}

export { emptyState };
