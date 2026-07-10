// Typed fetch wrappers around the same-origin /api functions.

import type { Bracket } from '../types/bracket';

export interface TeamInput {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body */
  }

  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  getBracket: () => request<{ bracket: Bracket }>('bracket').then((r) => r.bracket),

  getMe: () => request<{ admin: boolean }>('me').then((r) => r.admin),

  login: (password: string) =>
    request<{ admin: boolean }>('login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }).then((r) => r.admin),

  logout: () => request<{ admin: boolean }>('logout', { method: 'POST' }).then((r) => r.admin),

  seed: (teams: TeamInput[]) =>
    request<{ bracket: Bracket }>('seed', {
      method: 'POST',
      body: JSON.stringify({ teams }),
    }).then((r) => r.bracket),

  setResult: (matchId: string, winnerId: string) =>
    request<{ bracket: Bracket }>('result', {
      method: 'PATCH',
      body: JSON.stringify({ matchId, winnerId }),
    }).then((r) => r.bracket),

  clearResult: (matchId: string) =>
    request<{ bracket: Bracket }>('result', {
      method: 'PATCH',
      body: JSON.stringify({ matchId, winnerId: '' }),
    }).then((r) => r.bracket),

  reset: (clearTeams: boolean) =>
    request<{ bracket: Bracket }>('reset', {
      method: 'POST',
      body: JSON.stringify({ clearTeams }),
    }).then((r) => r.bracket),
};
