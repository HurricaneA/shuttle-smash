// PATCH /api/result — admin. Set (or clear) the winner of a single match.
//
// Body: { matchId: string, winnerId?: string }
//   - winnerId present  -> must be a current participant of that match, else 400
//   - winnerId empty/omitted -> clears that match's result (for corrections)
// The winner is validated against a freshly DERIVED bracket, so the stored state can
// never be pushed into an inconsistent shape.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { deriveBracket } from './_lib/bracket.js';
import { getBracket, getTournamentRow, readState, saveState } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['PATCH', 'POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const data = body(req);
  const matchId = typeof data.matchId === 'string' ? data.matchId : '';
  const winnerId = typeof data.winnerId === 'string' ? data.winnerId : '';
  if (!matchId) {
    json(res, 400, { error: 'matchId is required' });
    return;
  }

  try {
    const row = await getTournamentRow();
    const state = readState(row.state);

    const matches = deriveBracket(state.seededTeamIds, state.results, state.thirdPlace);
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      json(res, 400, { error: 'unknown match' });
      return;
    }

    if (winnerId) {
      if (match.a !== winnerId && match.b !== winnerId) {
        json(res, 400, { error: 'winner is not a participant of that match' });
        return;
      }
      state.results[matchId] = winnerId;
    } else {
      delete state.results[matchId];
    }

    await saveState(state);
    json(res, 200, { bracket: await getBracket() });
  } catch (err) {
    console.error('PATCH /api/result failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
