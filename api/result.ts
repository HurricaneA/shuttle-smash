// PATCH /api/result — admin. Set a match score/winner, or clear it. Works for any
// match id (group fixture or playoff tie).
//
// Body: { matchId: string, winnerId?: string, scoreA?: number, scoreB?: number }
//   - scoreA & scoreB present -> record the score; the higher score is the winner
//     (must not be equal, and both teams must be known).
//   - winnerId present (no scores) -> set the winner directly (walkover/quick pick).
//   - nothing set -> clears that match's result + score.
// The winner is validated against the freshly DERIVED tournament, so the stored state
// can never be pushed into an inconsistent shape.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { buildTournament } from './_lib/bracket.js';
import { allMatches, getTournament, getTournamentRow, loadTeams, readState, saveState } from './_lib/store.js';

function toScore(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['PATCH', 'POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const data = body(req);
  const matchId = typeof data.matchId === 'string' ? data.matchId : '';
  const winnerId = typeof data.winnerId === 'string' ? data.winnerId : '';
  const hasScoreKeys = 'scoreA' in data || 'scoreB' in data;
  if (!matchId) {
    json(res, 400, { error: 'matchId is required' });
    return;
  }

  try {
    const [row, teams] = await Promise.all([getTournamentRow(), loadTeams()]);
    const state = readState(row.state);

    const tournament = buildTournament(teams, state, row.name);
    const match = allMatches(tournament).find((m) => m.id === matchId);
    if (!match) {
      json(res, 400, { error: 'unknown match' });
      return;
    }

    if (hasScoreKeys) {
      const sa = toScore(data.scoreA);
      const sb = toScore(data.scoreB);
      if (sa === null || sb === null) {
        json(res, 400, { error: 'scores must be whole numbers between 0 and 99' });
        return;
      }
      if (!match.a || !match.b) {
        json(res, 400, { error: 'both teams must be set before recording a score' });
        return;
      }
      if (sa === sb) {
        json(res, 400, { error: 'scores cannot be equal — there must be a winner' });
        return;
      }
      state.results[matchId] = sa > sb ? match.a : match.b;
      state.scores[matchId] = { a: sa, b: sb };
    } else if (winnerId) {
      if (match.a !== winnerId && match.b !== winnerId) {
        json(res, 400, { error: 'winner is not a participant of that match' });
        return;
      }
      state.results[matchId] = winnerId;
      delete state.scores[matchId];
    } else {
      delete state.results[matchId];
      delete state.scores[matchId];
    }

    await saveState(state);
    json(res, 200, { bracket: await getTournament() });
  } catch (err) {
    console.error('PATCH /api/result failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
