// POST /api/reset — admin. Clears match results (keeps teams + seeding by default).
// Body: { clearTeams?: boolean } — if true, also removes all teams and unseeds.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http';
import { requireAdmin } from './_lib/auth';
import { prisma } from './_lib/prisma';
import { getBracket, getTournamentRow, readState, saveState } from './_lib/store';
import { emptyState } from './_lib/bracket';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const clearTeams = body(req).clearTeams === true;

  try {
    const row = await getTournamentRow();
    const state = readState(row.state);

    if (clearTeams) {
      await prisma.team.deleteMany({});
      await saveState(emptyState(state.thirdPlace));
    } else {
      // Keep the roster + seed order; wipe only the recorded results.
      await saveState({ ...state, results: {} });
    }

    json(res, 200, { bracket: await getBracket() });
  } catch (err) {
    console.error('POST /api/reset failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
