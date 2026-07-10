// Tiny HTTP helpers shared by the serverless functions.

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Send a JSON response with a status code. */
export function json(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

/**
 * Guard the HTTP method. Returns true if the request should proceed; otherwise it has
 * already sent a 405 and the handler must return.
 */
export function allowMethods(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
): boolean {
  if (req.method && methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  json(res, 405, { error: 'method_not_allowed' });
  return false;
}

/** Vercel parses JSON bodies for us; normalize to a plain object. */
export function body(req: VercelRequest): Record<string, unknown> {
  const b = req.body;
  if (b && typeof b === 'object' && !Array.isArray(b)) return b as Record<string, unknown>;
  if (typeof b === 'string') {
    try {
      const parsed = JSON.parse(b);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}
