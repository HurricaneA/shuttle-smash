// Typed fetch wrappers around the same-origin /api functions.

import type { ScheduleRow, Tournament } from '../types/bracket';

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
  getTournament: () => request<{ bracket: Tournament }>('bracket').then((r) => r.bracket),

  getMe: () => request<{ admin: boolean }>('me').then((r) => r.admin),

  login: (password: string) =>
    request<{ admin: boolean }>('login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }).then((r) => r.admin),

  logout: () => request<{ admin: boolean }>('logout', { method: 'POST' }).then((r) => r.admin),

  seed: (tableA: TeamInput[], tableB: TeamInput[]) =>
    request<{ bracket: Tournament }>('seed', {
      method: 'POST',
      body: JSON.stringify({ tableA, tableB }),
    }).then((r) => r.bracket),

  setResult: (matchId: string, winnerId: string) =>
    request<{ bracket: Tournament }>('result', {
      method: 'PATCH',
      body: JSON.stringify({ matchId, winnerId }),
    }).then((r) => r.bracket),

  setScore: (matchId: string, scoreA: number, scoreB: number) =>
    request<{ bracket: Tournament }>('result', {
      method: 'PATCH',
      body: JSON.stringify({ matchId, scoreA, scoreB }),
    }).then((r) => r.bracket),

  clearResult: (matchId: string) =>
    request<{ bracket: Tournament }>('result', {
      method: 'PATCH',
      body: JSON.stringify({ matchId, winnerId: '' }),
    }).then((r) => r.bracket),

  reset: (clearTeams: boolean) =>
    request<{ bracket: Tournament }>('reset', {
      method: 'POST',
      body: JSON.stringify({ clearTeams }),
    }).then((r) => r.bracket),

  saveSchedule: (schedule: ScheduleRow[]) =>
    request<{ bracket: Tournament }>('schedule', {
      method: 'PATCH',
      body: JSON.stringify({ schedule }),
    }).then((r) => r.bracket),
};
