// POST /api/login — public. { password } -> sets an HttpOnly session cookie on success.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, body, json } from './_lib/http';
import { checkPassword, createToken, setSessionCookie } from './_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;

  const { password } = body(req);
  if (!checkPassword(password)) {
    json(res, 401, { admin: false, error: 'invalid_password' });
    return;
  }

  res.setHeader('Set-Cookie', setSessionCookie(createToken()));
  json(res, 200, { admin: true });
}
