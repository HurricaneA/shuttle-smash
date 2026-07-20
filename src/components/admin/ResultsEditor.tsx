import { useState } from 'react';
import type { ScheduleRow, Team, Tournament } from '../../types/bracket';
import { api } from '../../api/client';
import GroupSection from '../tournament/GroupSection';
import Timetable from '../tournament/Timetable';

export default function ResultsEditor({
  tournament,
  onChange,
}: {
  tournament: Tournament;
  onChange: (t: Tournament) => void;
}) {
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamMap: Record<string, Team | undefined> = Object.fromEntries(
    tournament.teams.map((t) => [t.id, t]),
  );
  const allMatches = [...tournament.tables.flatMap((g) => g.matches), ...tournament.playoffs.matches];

  const run = async (matchId: string, fn: () => Promise<Tournament>) => {
    if (busyMatchId) return;
    setBusyMatchId(matchId);
    setError(null);
    try {
      onChange(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setBusyMatchId(null);
    }
  };

  const pick = (matchId: string, teamId: string) => {
    const m = allMatches.find((x) => x.id === matchId);
    const clearing = m?.winner === teamId;
    run(matchId, () => (clearing ? api.clearResult(matchId) : api.setResult(matchId, teamId)));
  };
  const score = (matchId: string, a: number, b: number) => run(matchId, () => api.setScore(matchId, a, b));

  const saveSchedule = async (rows: ScheduleRow[]) => {
    try {
      onChange(await api.saveSchedule(rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save schedule.');
      throw e;
    }
  };

  const resetResults = async () => {
    if (!window.confirm('Clear all match results and scores? Teams, tables and schedule are kept.')) return;
    try {
      onChange(await api.reset(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset.');
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand-ink/60">
        Enter each match score and hit <strong>Save</strong> — the higher score wins, standings and
        the playoffs update automatically. Reorder or re-time matches by dragging rows, then{' '}
        <strong>Save schedule</strong>.
      </p>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {tournament.tables.map((table) => (
          <GroupSection key={table.table} table={table} teams={teamMap} />
        ))}
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-brand-navy">Schedule &amp; Results</h3>
        <div className="mt-4">
          <Timetable
            tournament={tournament}
            teams={teamMap}
            editable
            busyMatchId={busyMatchId}
            onPick={pick}
            onScore={score}
            onSaveSchedule={saveSchedule}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={resetResults}
          className="text-sm font-semibold text-red-600 hover:text-red-700"
        >
          Clear all results
        </button>
      </div>
    </div>
  );
}
