// GET /api/bracket — public. Returns the current derived bracket.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, json } from './_lib/http.js';
import { getTournament } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const bracket = await getTournament();
    // Spectators poll this a lot. Cache at Vercel's edge for a few seconds so 40 people
    // polling collapse to ~1 function+DB hit per 5s, and serve stale briefly while
    // revalidating. Admins see their own edits instantly (mutation responses bypass this).
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=25');
    json(res, 200, { bracket });
  } catch (err) {
    console.error('GET /api/bracket failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
