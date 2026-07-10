// GET /api/me — public. Tells the SPA whether the caller holds a valid admin session.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, json } from './_lib/http';
import { requireAdmin } from './_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  json(res, 200, { admin: requireAdmin(req) });
}
