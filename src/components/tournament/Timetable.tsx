import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Match, ScheduleRow, Team, Tournament } from '../../types/bracket';
import FixtureLine from './FixtureLine';

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

interface RowProps {
  row: ScheduleRow;
  matchNo?: number;
  aMatch?: Match;
  bMatch?: Match;
  playoffMatches?: Match[];
  editable?: boolean;
  teams: Record<string, Team | undefined>;
  busyMatchId?: string | null;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
  onTime: (time: string) => void;
}

/** One sortable schedule row. Dragging is initiated only from the ⠿ handle. */
function SortableRow(props: RowProps) {
  const { row, editable, teams, busyMatchId, onPick, onScore, onTime } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !editable,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const handle = editable ? (
    <span
      {...attributes}
      {...listeners}
      className="mt-1 cursor-grab touch-none select-none px-1 text-xl leading-none text-slate-400 hover:text-brand-royal active:cursor-grabbing"
      title="Drag to reorder"
      aria-label="Drag to reorder"
    >
      ⠿
    </span>
  ) : null;

  const timeCell = editable ? (
    <input
      value={row.time}
      onChange={(e) => onTime(e.target.value)}
      placeholder="time"
      className="w-full rounded border border-slate-300 px-1.5 py-1 text-center text-xs font-semibold text-brand-navy focus:border-brand-royal focus:outline-none"
    />
  ) : (
    <div className="font-display text-sm font-bold text-brand-navy">{row.time || '—'}</div>
  );

  const fixture = (m: Match | undefined, tag?: string) =>
    m ? (
      <div>
        {tag && <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-royal">{tag}</div>}
        <FixtureLine
          match={m}
          teams={teams}
          editable={editable}
          busy={busyMatchId === m.id}
          onPick={onPick}
          onScore={onScore}
        />
      </div>
    ) : null;

  if (row.kind === 'break') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-xl border border-dashed border-brand-gold/60 bg-brand-gold/10 px-3 py-2"
      >
        {handle}
        <div className="w-24 shrink-0">{timeCell}</div>
        <span className="font-display text-sm font-bold uppercase tracking-wide text-brand-navy">
          ☕ {row.label || 'Break'}
        </span>
      </div>
    );
  }

  if (row.kind === 'playoff') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        {handle}
        <div className="w-24 shrink-0">
          {timeCell}
          <div className="mt-1 text-[11px] font-bold uppercase text-brand-gold">{row.label}</div>
        </div>
        <div className="flex flex-1 flex-wrap gap-3">{(props.playoffMatches ?? []).map((m) => fixture(m))}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      {handle}
      <div className="w-24 shrink-0">
        {timeCell}
        <div className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-slate-500">
          Match {pad2(props.matchNo ?? 0)}
        </div>
      </div>
      <div className="flex flex-1 flex-wrap gap-4">
        {fixture(props.aMatch, 'Table A')}
        {fixture(props.bMatch, 'Table B')}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (!dirty) setRows(tournament.schedule);
  }, [tournament.schedule, dirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tableA = tournament.tables.find((t) => t.table === 'A');
  const tableB = tournament.tables.find((t) => t.table === 'B');
  const playoffById: Record<string, Match | undefined> = Object.fromEntries(
    tournament.playoffs.matches.map((m) => [m.id, m]),
  );

  const list = editable ? rows : tournament.schedule;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const oldI = prev.findIndex((r) => r.id === active.id);
      const newI = prev.findIndex((r) => r.id === over.id);
      return oldI < 0 || newI < 0 ? prev : arrayMove(prev, oldI, newI);
    });
    setDirty(true);
  };
  const setTime = (id: string, time: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, time } : r)));
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

  let groupNo = 0;
  const items = list.map((row) => {
    const common = { row, editable, teams, busyMatchId, onPick, onScore, onTime: (v: string) => setTime(row.id, v) };
    if (row.kind === 'group') {
      groupNo += 1;
      const aMatch = row.pairIndex != null ? tableA?.matches[row.pairIndex] : undefined;
      const bMatch = row.pairIndex != null ? tableB?.matches[row.pairIndex] : undefined;
      return <SortableRow key={row.id} {...common} matchNo={groupNo} aMatch={aMatch} bMatch={bMatch} />;
    }
    if (row.kind === 'playoff') {
      const ms = (row.playoffIds ?? []).map((id) => playoffById[id]).filter(Boolean) as Match[];
      return <SortableRow key={row.id} {...common} playoffMatches={ms} />;
    }
    return <SortableRow key={row.id} {...common} />;
  });

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{items}</div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
