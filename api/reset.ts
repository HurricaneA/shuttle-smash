// POST /api/reset — admin. Clears match results + scores (keeps the rosters by default).
// Body: { clearTeams?: boolean } — if true, also removes all teams and empties the tables.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { prisma } from './_lib/prisma.js';
import { emptyState, getTournament, getTournamentRow, readState, saveState } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const clearTeams = body(req).clearTeams === true;

  try {
    if (clearTeams) {
      await prisma.team.deleteMany({});
      await saveState(emptyState());
    } else {
      const row = await getTournamentRow();
      const state = readState(row.state);
      // Keep the rosters; wipe only the recorded results + scores.
      await saveState({ ...state, results: {}, scores: {} });
    }

    json(res, 200, { bracket: await getTournament() });
  } catch (err) {
    console.error('POST /api/reset failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
