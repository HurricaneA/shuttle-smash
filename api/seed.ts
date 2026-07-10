// POST /api/seed — admin. Sets the 10 teams IN SEED ORDER and (re)starts the bracket.
//
// Body: { teams: TeamInput[] }  where the array order is the seed order
//   (index 0 = seed #1) and TeamInput = { id?, name, player1, player2 }.
// Existing teams keep their id when one is supplied (so names can be edited without
// losing identity); teams no longer in the roster are removed. Results are reset.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http';
import { requireAdmin } from './_lib/auth';
import { prisma } from './_lib/prisma';
import { getBracket, readState } from './_lib/store';
import { TEAM_COUNT } from '../src/types/bracket';

interface TeamInput {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

function parseTeams(raw: unknown): TeamInput[] | null {
  if (!Array.isArray(raw) || raw.length !== TEAM_COUNT) return null;
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

  const teams = parseTeams(body(req).teams);
  if (!teams) {
    json(res, 400, { error: `expected exactly ${TEAM_COUNT} teams with name + two players` });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.tournament.findUnique({ where: { id: 'main' } });
      const thirdPlace = readState(existing?.state).thirdPlace;

      const orderedIds: string[] = [];
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const data = { name: t.name, player1: t.player1, player2: t.player2, seed: i + 1 };
        const saved = t.id
          ? await tx.team.upsert({ where: { id: t.id }, update: data, create: { id: t.id, ...data } })
          : await tx.team.create({ data });
        orderedIds.push(saved.id);
      }

      // Drop any teams that are no longer part of the roster.
      await tx.team.deleteMany({ where: { id: { notIn: orderedIds } } });

      const state = { seededTeamIds: orderedIds, results: {}, thirdPlace };
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
