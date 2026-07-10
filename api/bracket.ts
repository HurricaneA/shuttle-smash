// GET /api/bracket — public. Returns the current derived bracket.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, json } from './_lib/http.js';
import { getBracket } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const bracket = await getBracket();
    // Spectators poll this; allow brief CDN/proxy caching without going stale for long.
    res.setHeader('Cache-Control', 'no-store');
    json(res, 200, { bracket });
  } catch (err) {
    console.error('GET /api/bracket failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
