// PATCH /api/schedule — admin. Saves the day's running order + times.
// Reordering/retiming never touches teams or results — only the schedule.
//
// Body: { schedule: ScheduleRow[] }
//   Group rows must together cover every fixture exactly once (a permutation of the
//   pair indexes), so no fixture is lost or duplicated.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ScheduleRow } from '../src/types/bracket';
import { allowMethods, body, json } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { groupFixtureCount } from './_lib/bracket.js';
import { getTournament, getTournamentRow, readState, saveState } from './_lib/store.js';

const PLAYOFF_IDS = ['q1', 'elim', 'q2', 'final'];

function parseSchedule(raw: unknown, expectedGroupCount: number): ScheduleRow[] | null {
  if (!Array.isArray(raw)) return null;
  const rows: ScheduleRow[] = [];
  const pairIndexes: number[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const r = item as Record<string, unknown>;
    const kind = r.kind;
    const time = typeof r.time === 'string' ? r.time : '';
    const id = typeof r.id === 'string' && r.id ? r.id : `${kind}-${rows.length}`;
    if (kind === 'group') {
      if (!Number.isInteger(r.pairIndex)) return null;
      pairIndexes.push(r.pairIndex as number);
      rows.push({ id, kind: 'group', time, pairIndex: r.pairIndex as number });
    } else if (kind === 'break') {
      rows.push({ id, kind: 'break', time, label: typeof r.label === 'string' ? r.label : 'Break' });
    } else if (kind === 'playoff') {
      const ids = Array.isArray(r.playoffIds) ? r.playoffIds.filter((x) => PLAYOFF_IDS.includes(x as string)) : [];
      rows.push({
        id,
        kind: 'playoff',
        time,
        label: typeof r.label === 'string' ? r.label : '',
        playoffIds: ids as string[],
      });
    } else {
      return null;
    }
  }
  // group rows must be a permutation of 0..expectedGroupCount-1
  const set = new Set(pairIndexes);
  if (pairIndexes.length !== expectedGroupCount || set.size !== expectedGroupCount) return null;
  for (let i = 0; i < expectedGroupCount; i++) if (!set.has(i)) return null;
  return rows;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['PATCH', 'POST'])) return;
  if (!requireAdmin(req)) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  try {
    const row = await getTournamentRow();
    const state = readState(row.state);
    const expected = Math.max(groupFixtureCount(state.tableA.length), groupFixtureCount(state.tableB.length));

    const schedule = parseSchedule(body(req).schedule, expected);
    if (!schedule) {
      json(res, 400, { error: 'invalid schedule' });
      return;
    }

    await saveState({ ...state, schedule });
    json(res, 200, { bracket: await getTournament() });
  } catch (err) {
    console.error('PATCH /api/schedule failed', err);
    json(res, 500, { error: 'internal_error' });
  }
}
