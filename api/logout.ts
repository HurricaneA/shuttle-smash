// POST /api/logout — clears the session cookie.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, json } from './_lib/http';
import { clearSessionCookie } from './_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  res.setHeader('Set-Cookie', clearSessionCookie());
  json(res, 200, { admin: false });
}
