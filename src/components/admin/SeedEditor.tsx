import { useState } from 'react';
import type { Bracket } from '../../types/bracket';
import { TEAM_COUNT } from '../../types/bracket';
import { api, type TeamInput } from '../../api/client';

interface Row {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

function initialRows(bracket: Bracket): Row[] {
  const rows: Row[] =
    bracket.teams.length === TEAM_COUNT
      ? bracket.teams.map((t) => ({ id: t.id, name: t.name, player1: t.player1, player2: t.player2 }))
      : [];
  while (rows.length < TEAM_COUNT) rows.push({ name: '', player1: '', player2: '' });
  return rows.slice(0, TEAM_COUNT);
}

export default function SeedEditor({
  bracket,
  onSeeded,
}: {
  bracket: Bracket;
  onSeeded: (b: Bracket) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(bracket));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (i: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    setSaved(false);
  };

  const swap = (i: number, j: number) => {
    if (j < 0 || j >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSaved(false);
  };

  const allFilled = rows.every((r) => r.name.trim() && r.player1.trim() && r.player2.trim());

  const submit = async () => {
    if (!allFilled) {
      setError(`Please fill in all ${TEAM_COUNT} teams (team name + both players).`);
      return;
    }
    if (bracket.seeded && !window.confirm('This will (re)start the bracket and clear all recorded results. Continue?')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: TeamInput[] = rows.map((r) => ({
        id: r.id,
        name: r.name.trim(),
        player1: r.player1.trim(),
        player2: r.player2.trim(),
      }));
      const updated = await api.seed(payload);
      onSeeded(updated);
      setRows(initialRows(updated));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save teams.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-brand-navy">Teams &amp; Seeding</h2>
      <p className="mt-1 text-sm text-brand-ink/60">
        Enter all {TEAM_COUNT} teams in seed order (1 = top seed). Seeds 1–6 get a first-round bye;
        seeds 7–10 play the two play-in matches. Use ▲▼ to reorder.
      </p>

      <div className="mt-5 space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-navy font-display text-sm font-bold text-white">
              {i + 1}
            </span>
            <input
              value={row.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              placeholder="Team name"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-royal focus:outline-none"
            />
            <input
              value={row.player1}
              onChange={(e) => update(i, 'player1', e.target.value)}
              placeholder="Player 1"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-royal focus:outline-none"
            />
            <input
              value={row.player2}
              onChange={(e) => update(i, 'player2', e.target.value)}
              placeholder="Player 2"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-royal focus:outline-none"
            />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => swap(i, i - 1)}
                disabled={i === 0}
                className="px-1 text-brand-royal disabled:opacity-30"
                aria-label={`Move seed ${i + 1} up`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => swap(i, i + 1)}
                disabled={i === rows.length - 1}
                className="px-1 text-brand-royal disabled:opacity-30"
                aria-label={`Move seed ${i + 1} down`}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm font-medium text-green-700">Teams saved — bracket updated.</p>}

      <button type="button" className="btn-primary mt-5" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : bracket.seeded ? 'Save & restart bracket' : 'Save & generate bracket'}
      </button>
    </div>
  );
}
