// POST /api/seed — admin. Sets the teams IN SEED ORDER and (re)starts the bracket.
//
// Body: { teams: TeamInput[], thirdPlace?: boolean }
//   teams: length MIN_TEAMS..MAX_TEAMS, array order = seed order (index 0 = seed #1).
//   TeamInput = { id?, name, player1, player2 }.
// Existing teams keep their id when supplied (names can be edited without losing
// identity); teams no longer in the roster are removed. Results are reset.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { prisma } from './_lib/prisma.js';
import { getBracket, readState } from './_lib/store.js';
import { MAX_TEAMS, MIN_TEAMS } from './_lib/bracket.js';

interface TeamInput {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

function parseTeams(raw: unknown): TeamInput[] | null {
  if (!Array.isArray(raw) || raw.length < MIN_TEAMS || raw.length > MAX_TEAMS) return null;
  const out: TeamInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const t = item as Record<string, unknown>;
    const name = typeof t.name === 'string' ? t.name.trim() : '';
    const player1 = typeof t.player1 === 'string' ? t.player1.trim() : '';
    const player2 = typeof t.player2 === 'string' ? t.player2.trim() : '';
    if (!name || !player1 || !player2) return null;
    out.push({ id: typeof t.id === 'string' && t.id ? t.id : undefined, name, player1, player2 });
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const data = body(req);
  const teams = parseTeams(data.teams);
  if (!teams) {
    json(res, 400, {
      error: `expected ${MIN_TEAMS}–${MAX_TEAMS} teams, each with a name and two players`,
    });
    return;
  }
  const thirdPlace = typeof data.thirdPlace === 'boolean' ? data.thirdPlace : undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.tournament.findUnique({ where: { id: 'main' } });
      const keepThirdPlace = thirdPlace ?? readState(existing?.state).thirdPlace;

      const orderedIds: string[] = [];
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const teamData = { name: t.name, player1: t.player1, player2: t.player2, seed: i + 1 };
        const saved = t.id
          ? await tx.team.upsert({ where: { id: t.id }, update: teamData, create: { id: t.id, ...teamData } })
          : await tx.team.create({ data: teamData });
        orderedIds.push(saved.id);
      }

      // Drop any teams that are no longer part of the roster.
      await tx.team.deleteMany({ where: { id: { notIn: orderedIds } } });

      const state = { seededTeamIds: orderedIds, results: {}, scores: {}, thirdPlace: keepThirdPlace };
      await tx.tournament.upsert({
        where: { id: 'main' },
        update: { state: state as unknown as object },
        create: { id: 'main', state: state as unknown as object },
      });
    });

    json(res, 200, { bracket: await getBracket() });
  } catch (err) {
    console.error('POST /api/seed failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
