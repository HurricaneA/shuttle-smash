import { useState } from 'react';
import type { Bracket } from '../../types/bracket';
import { MAX_TEAMS, MIN_TEAMS, bracketSizeFor, byesFor } from '../../types/bracket';
import { api, type TeamInput } from '../../api/client';

interface Row {
  id?: string;
  name: string;
  player1: string;
  player2: string;
}

const DEFAULT_ROWS = 10; // the tournament's stated format; adjustable below
const emptyRow = (): Row => ({ name: '', player1: '', player2: '' });

function initialRows(bracket: Bracket): Row[] {
  if (bracket.teams.length >= MIN_TEAMS) {
    return bracket.teams.map((t) => ({
      id: t.id,
      name: t.name,
      player1: t.player1,
      player2: t.player2,
    }));
  }
  return Array.from({ length: DEFAULT_ROWS }, emptyRow);
}

export default function SeedEditor({
  bracket,
  onSeeded,
}: {
  bracket: Bracket;
  onSeeded: (b: Bracket) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(bracket));
  const [thirdPlace, setThirdPlace] = useState(bracket.thirdPlace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = () => {
    setSaved(false);
    setError(null);
  };

  const update = (i: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    dirty();
  };
  const swap = (i: number, j: number) => {
    if (j < 0 || j >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    dirty();
  };
  const addRow = () => {
    if (rows.length >= MAX_TEAMS) return;
    setRows((prev) => [...prev, emptyRow()]);
    dirty();
  };
  const removeRow = (i: number) => {
    if (rows.length <= MIN_TEAMS) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    dirty();
  };

  const size = bracketSizeFor(rows.length);
  const byes = byesFor(rows.length);
  const allFilled = rows.every((r) => r.name.trim() && r.player1.trim() && r.player2.trim());

  const submit = async () => {
    if (!allFilled) {
      setError('Please fill in every team (team name + both players), or remove empty rows.');
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
      const updated = await api.seed(payload, thirdPlace && rows.length >= 4);
      onSeeded(updated);
      setRows(initialRows(updated));
      setThirdPlace(updated.thirdPlace);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save teams.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-brand-navy">Teams &amp; Seeding</h2>
        <span className="rounded-full bg-brand-navy/10 px-3 py-1 text-sm font-bold text-brand-navy">
          {rows.length} teams
        </span>
      </div>
      <p className="mt-1 text-sm text-brand-ink/60">
        Enter teams in seed order (1 = top seed). Bracket of {size} —{' '}
        {byes > 0 ? `top ${byes} seed${byes > 1 ? 's' : ''} get a first-round bye.` : 'no byes.'} Use
        ▲▼ to reorder, and add or remove rows ({MIN_TEAMS}–{MAX_TEAMS} teams).
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
            <div className="flex items-center gap-0.5">
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
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length <= MIN_TEAMS}
                className="px-1 text-red-500 hover:text-red-700 disabled:opacity-30"
                aria-label={`Remove seed ${i + 1}`}
                title="Remove team"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= MAX_TEAMS}
          className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
        >
          ＋ Add team
        </button>
        {rows.length >= 4 && (
          <label className="flex items-center gap-2 text-sm font-medium text-brand-navy">
            <input
              type="checkbox"
              checked={thirdPlace}
              onChange={(e) => {
                setThirdPlace(e.target.checked);
                dirty();
              }}
              className="h-4 w-4 accent-brand-royal"
            />
            Include a 3rd-place match
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm font-medium text-green-700">Teams saved — bracket updated.</p>}

      <button type="button" className="btn-primary mt-5" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : bracket.seeded ? 'Save & restart bracket' : 'Save & generate bracket'}
      </button>
    </div>
  );
}
