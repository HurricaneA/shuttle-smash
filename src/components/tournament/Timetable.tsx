import { useEffect, useState } from 'react';
import type { Match, ScheduleRow, Team, Tournament } from '../../types/bracket';
import MatchCard from '../bracket/MatchCard';

interface Props {
  tournament: Tournament;
  teams: Record<string, Team | undefined>;
  editable?: boolean;
  busyMatchId?: string | null;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
  onSaveSchedule?: (rows: ScheduleRow[]) => Promise<void>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function Timetable({
  tournament,
  teams,
  editable,
  busyMatchId,
  onPick,
  onScore,
  onSaveSchedule,
}: Props) {
  const [rows, setRows] = useState<ScheduleRow[]>(tournament.schedule);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Sync from the server whenever there are no unsaved schedule edits.
  useEffect(() => {
    if (!dirty) setRows(tournament.schedule);
  }, [tournament.schedule, dirty]);

  const tableA = tournament.tables.find((t) => t.table === 'A');
  const tableB = tournament.tables.find((t) => t.table === 'B');
  const playoffById: Record<string, Match | undefined> = Object.fromEntries(
    tournament.playoffs.matches.map((m) => [m.id, m]),
  );

  const list = editable ? rows : tournament.schedule;

  const moveRow = (target: number) => {
    if (dragIdx === null || dragIdx === target) return setDragIdx(null);
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDirty(true);
    setDragIdx(null);
  };
  const setTime = (i: number, time: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, time } : r)));
    setDirty(true);
  };
  const save = async () => {
    if (!onSaveSchedule) return;
    setSaving(true);
    try {
      await onSaveSchedule(rows);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const Handle = ({ i }: { i: number }) =>
    editable ? (
      <span
        draggable
        onDragStart={() => setDragIdx(i)}
        className="mt-1 cursor-grab select-none px-1 text-lg leading-none text-slate-400 hover:text-brand-royal"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        ⠿
      </span>
    ) : null;

  const TimeCell = ({ i, time }: { i: number; time: string }) =>
    editable ? (
      <input
        value={time}
        onChange={(e) => setTime(i, e.target.value)}
        placeholder="time"
        className="w-full rounded border border-slate-300 px-1.5 py-1 text-center text-xs font-semibold text-brand-navy focus:border-brand-royal focus:outline-none"
      />
    ) : (
      <div className="font-display text-sm font-bold text-brand-navy">{time || '—'}</div>
    );

  const dropProps = (i: number) =>
    editable ? { onDragOver: (e: React.DragEvent) => e.preventDefault(), onDrop: () => moveRow(i) } : {};

  const groupCard = (m: Match | undefined, tag: string) =>
    m ? (
      <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-royal">{tag}</div>
        <MatchCard
          match={m}
          teams={teams}
          editable={editable}
          busy={busyMatchId === m.id}
          onPick={onPick}
          onScore={onScore}
        />
      </div>
    ) : null;

  let groupNo = 0;
  return (
    <div>
      {editable && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-brand-royal/5 px-3 py-2 text-sm text-brand-ink/70">
          <span>⠿ Drag rows to reorder · edit the times · then save.</span>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="btn-primary ml-auto px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {saving ? 'Saving…' : dirty ? 'Save schedule' : 'Schedule saved'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {list.map((row, i) => {
          if (row.kind === 'break') {
            return (
              <div
                key={row.id}
                {...dropProps(i)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-brand-gold/60 bg-brand-gold/10 px-3 py-2"
              >
                <Handle i={i} />
                <div className="w-24 shrink-0">
                  <TimeCell i={i} time={row.time} />
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-wide text-brand-navy">
                  ☕ {row.label || 'Break'}
                </span>
              </div>
            );
          }

          if (row.kind === 'playoff') {
            const ms = (row.playoffIds ?? []).map((id) => playoffById[id]).filter(Boolean) as Match[];
            return (
              <div
                key={row.id}
                {...dropProps(i)}
                className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <Handle i={i} />
                <div className="w-24 shrink-0">
                  <TimeCell i={i} time={row.time} />
                  <div className="mt-1 text-[11px] font-bold uppercase text-brand-gold">{row.label}</div>
                </div>
                <div className="flex flex-1 flex-wrap gap-3">
                  {ms.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      teams={teams}
                      editable={editable}
                      busy={busyMatchId === m.id}
                      onPick={onPick}
                      onScore={onScore}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // group row
          groupNo += 1;
          const no = groupNo;
          const aMatch = row.pairIndex != null ? tableA?.matches[row.pairIndex] : undefined;
          const bMatch = row.pairIndex != null ? tableB?.matches[row.pairIndex] : undefined;
          return (
            <div
              key={row.id}
              {...dropProps(i)}
              className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <Handle i={i} />
              <div className="w-24 shrink-0">
                <TimeCell i={i} time={row.time} />
                <div className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-slate-500">
                  Match {pad2(no)}
                </div>
              </div>
              <div className="flex flex-1 flex-wrap gap-4">
                {groupCard(aMatch, 'Table A')}
                {groupCard(bMatch, 'Table B')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
