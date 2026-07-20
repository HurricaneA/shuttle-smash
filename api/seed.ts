// POST /api/seed — admin. Sets the two group-table rosters and (re)starts everything.
//
// Body: { tableA: TeamInput[], tableB: TeamInput[] }
//   Each table: MIN_PER_TABLE..MAX_PER_TABLE teams, in table order (A1, A2, ...).
//   TeamInput = { id?, name, player1, player2 }.
// Existing teams keep their id when supplied; teams in neither table are removed.
// All results + scores are reset.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { prisma } from './_lib/prisma.js';
import { getTournament } from './_lib/store.js';
import { MAX_PER_TABLE, MIN_PER_TABLE } from './_lib/bracket.js';

interface TeamInput {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

function parseTable(raw: unknown): TeamInput[] | null {
  if (!Array.isArray(raw) || raw.length < MIN_PER_TABLE || raw.length > MAX_PER_TABLE) return null;
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
  const tableA = parseTable(data.tableA);
  const tableB = parseTable(data.tableB);
  if (!tableA || !tableB) {
    json(res, 400, {
      error: `each table needs ${MIN_PER_TABLE}–${MAX_PER_TABLE} teams, each with a name and two players`,
    });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const save = async (t: TeamInput) => {
        const teamData = { name: t.name, player1: t.player1, player2: t.player2, seed: null };
        const row = t.id
          ? await tx.team.upsert({ where: { id: t.id }, update: teamData, create: { id: t.id, ...teamData } })
          : await tx.team.create({ data: teamData });
        return row.id;
      };

      const idsA: string[] = [];
      for (const t of tableA) idsA.push(await save(t));
      const idsB: string[] = [];
      for (const t of tableB) idsB.push(await save(t));

      await tx.team.deleteMany({ where: { id: { notIn: [...idsA, ...idsB] } } });

      // schedule left empty -> buildTournament re-defaults it for the new rosters
      const state = { tableA: idsA, tableB: idsB, results: {}, scores: {}, schedule: [] };
      await tx.tournament.upsert({
        where: { id: 'main' },
        update: { state: state as unknown as object },
        create: { id: 'main', state: state as unknown as object },
      });
    });

    json(res, 200, { bracket: await getTournament() });
  } catch (err) {
    console.error('POST /api/seed failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
