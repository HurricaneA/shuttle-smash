// Simple admin auth — no JWT, no session table.
//
// Login constant-time-compares the submitted password to ADMIN_PASSWORD, then issues
// an HMAC-signed token stored in an HttpOnly cookie. requireAdmin() verifies the
// signature + expiry with no DB read, so it survives serverless cold starts.

import crypto from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

const COOKIE = 'ssc_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const isProd = process.env.NODE_ENV === 'production';

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set');
  return s;
}

const toB64 = (b: Buffer): string => b.toString('base64url');
const sign = (payload: string): string =>
  toB64(crypto.createHmac('sha256', secret()).update(payload).digest());

/** Create a signed session token that expires MAX_AGE_SECONDS from now. */
export function createToken(): string {
  const payload = toB64(Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 })));
  return `${payload}.${sign(payload)}`;
}

/** Verify a token's signature (timing-safe) and expiry. */
export function verifyToken(token?: string): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time comparison of the submitted password to ADMIN_PASSWORD. */
export function checkPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  const a = Buffer.from(typeof input === 'string' ? input : '');
  const b = Buffer.from(expected);
  // Compare against a fixed-length digest so length differences don't leak or throw.
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return expected.length > 0 && crypto.timingSafeEqual(ha, hb);
}

/** True if the request carries a valid admin session cookie. */
export function requireAdmin(req: VercelRequest): boolean {
  return verifyToken(req.cookies?.[COOKIE]);
}

// `Secure` only over HTTPS; skip it locally so `vercel dev` on http://localhost works.
const secureFlag = isProd ? ' Secure;' : '';

export const setSessionCookie = (token: string): string =>
  `${COOKIE}=${token}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;

export const clearSessionCookie = (): string =>
  `${COOKIE}=; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=0`;
