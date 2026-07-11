import { useState } from 'react';
import type { TableId, Tournament } from '../../types/bracket';
import { MAX_PER_TABLE, MIN_PER_TABLE } from '../../types/bracket';
import { api, type TeamInput } from '../../api/client';

interface Row {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

const DEFAULT_PER_TABLE = 5;
const emptyRow = (): Row => ({ name: '', player1: '', player2: '' });

function initialRows(tournament: Tournament, tableId: TableId): Row[] {
  const rows = tournament.teams
    .filter((t) => t.table === tableId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((t) => ({ id: t.id, name: t.name, player1: t.player1, player2: t.player2 }));
  if (rows.length >= MIN_PER_TABLE) return rows;
  return Array.from({ length: DEFAULT_PER_TABLE }, emptyRow);
}

export default function TableEditor({
  tournament,
  onSeeded,
}: {
  tournament: Tournament;
  onSeeded: (t: Tournament) => void;
}) {
  const [tables, setTables] = useState<Record<TableId, Row[]>>(() => ({
    A: initialRows(tournament, 'A'),
    B: initialRows(tournament, 'B'),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = () => {
    setSaved(false);
    setError(null);
  };
  const setRows = (tid: TableId, fn: (rows: Row[]) => Row[]) => {
    setTables((prev) => ({ ...prev, [tid]: fn(prev[tid]) }));
    dirty();
  };

  const filled = (rows: Row[]) => rows.every((r) => r.name.trim() && r.player1.trim() && r.player2.trim());

  const submit = async () => {
    for (const tid of ['A', 'B'] as TableId[]) {
      if (tables[tid].length < MIN_PER_TABLE || !filled(tables[tid])) {
        setError(`Table ${tid} needs at least ${MIN_PER_TABLE} teams, each fully filled in.`);
        return;
      }
    }
    if (tournament.published && !window.confirm('This restarts the tournament and clears all results. Continue?')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const toInput = (rows: Row[]): TeamInput[] =>
        rows.map((r) => ({ id: r.id, name: r.name.trim(), player1: r.player1.trim(), player2: r.player2.trim() }));
      const updated = await api.seed(toInput(tables.A), toInput(tables.B));
      onSeeded(updated);
      setTables({ A: initialRows(updated, 'A'), B: initialRows(updated, 'B') });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save teams.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-brand-navy">Teams &amp; Tables</h2>
      <p className="mt-1 text-sm text-brand-ink/60">
        Assign teams to Table A and Table B ({MIN_PER_TABLE}–{MAX_PER_TABLE} each). Each table plays
        a round-robin; the top 2 of each advance to the playoffs.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {(['A', 'B'] as TableId[]).map((tid) => {
          const rows = tables[tid];
          return (
            <div key={tid}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-lg font-extrabold uppercase text-brand-navy">
                  Table <span className="text-brand-gold">{tid}</span>
                </h3>
                <span className="text-sm font-semibold text-brand-ink/50">{rows.length} teams</span>
              </div>

              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded bg-brand-navy font-display text-xs font-bold text-white">
                      {tid}
                      {i + 1}
                    </span>
                    <input
                      value={row.name}
                      onChange={(e) =>
                        setRows(tid, (rs) => rs.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))
                      }
                      placeholder="Team"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-brand-royal focus:outline-none"
                    />
                    <input
                      value={row.player1}
                      onChange={(e) =>
                        setRows(tid, (rs) => rs.map((r, idx) => (idx === i ? { ...r, player1: e.target.value } : r)))
                      }
                      placeholder="Player 1"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-brand-royal focus:outline-none"
                    />
                    <input
                      value={row.player2}
                      onChange={(e) =>
                        setRows(tid, (rs) => rs.map((r, idx) => (idx === i ? { ...r, player2: e.target.value } : r)))
                      }
                      placeholder="Player 2"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-brand-royal focus:outline-none"
                    />
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() =>
                          setRows(tid, (rs) => {
                            if (i === 0) return rs;
                            const n = [...rs];
                            [n[i - 1], n[i]] = [n[i], n[i - 1]];
                            return n;
                          })
                        }
                        disabled={i === 0}
                        className="px-1 text-brand-royal disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRows(tid, (rs) => {
                            if (i === rs.length - 1) return rs;
                            const n = [...rs];
                            [n[i], n[i + 1]] = [n[i + 1], n[i]];
                            return n;
                          })
                        }
                        disabled={i === rows.length - 1}
                        className="px-1 text-brand-royal disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => setRows(tid, (rs) => (rs.length <= MIN_PER_TABLE ? rs : rs.filter((_, idx) => idx !== i)))}
                        disabled={rows.length <= MIN_PER_TABLE}
                        className="px-1 text-red-500 hover:text-red-700 disabled:opacity-30"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRows(tid, (rs) => (rs.length >= MAX_PER_TABLE ? rs : [...rs, emptyRow()]))}
                disabled={rows.length >= MAX_PER_TABLE}
                className="btn-ghost mt-2 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ＋ Add to Table {tid}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-sm font-medium text-green-700">Saved — tournament updated.</p>}

      <button type="button" className="btn-primary mt-5" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : tournament.published ? 'Save & restart tournament' : 'Save & start tournament'}
      </button>
    </div>
  );
}
