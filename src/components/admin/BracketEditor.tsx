import { useState } from 'react';
import type { Bracket } from '../../types/bracket';
import { api } from '../../api/client';
import BracketView from '../bracket/BracketView';

export default function BracketEditor({
  bracket,
  onChange,
}: {
  bracket: Bracket;
  onChange: (b: Bracket) => void;
}) {
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (matchId: string, teamId: string) => {
    const match = bracket.matches.find((m) => m.id === matchId);
    if (!match || busyMatchId) return;
    const clearing = match.winner === teamId; // clicking the current winner un-sets it
    setBusyMatchId(matchId);
    setError(null);
    try {
      const updated = clearing
        ? await api.clearResult(matchId)
        : await api.setResult(matchId, teamId);
      onChange(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save result.');
    } finally {
      setBusyMatchId(null);
    }
  };

  const resetResults = async () => {
    if (!window.confirm('Clear all match results? Teams and seeding are kept.')) return;
    try {
      onChange(await api.reset(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset.');
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-brand-navy">Update Results</h2>
      <p className="mt-1 text-sm text-brand-ink/60">
        Tap the winning team in each match — they advance automatically. Tap a winner again to
        undo. Fixing an earlier round clears any now-invalid later matches.
      </p>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-5">
        <BracketView bracket={bracket} editable busyMatchId={busyMatchId} onPick={pick} />
      </div>

      <div className="mt-8 border-t border-slate-200 pt-4">
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
