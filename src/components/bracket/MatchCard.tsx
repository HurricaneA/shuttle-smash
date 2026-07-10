import { useEffect, useState } from 'react';
import type { Match, Team } from '../../types/bracket';
import TeamSlot from './TeamSlot';

interface Props {
  match: Match;
  teams: Record<string, Team | undefined>;
  editable?: boolean;
  busy?: boolean;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
}

export default function MatchCard({ match, teams, editable, busy, onPick, onScore }: Props) {
  const teamA = match.a ? teams[match.a] ?? null : null;
  const teamB = match.b ? teams[match.b] ?? null : null;
  // A winner/score can only be chosen once both participants are known.
  const ready = Boolean(match.a && match.b);

  const [sa, setSa] = useState('');
  const [sb, setSb] = useState('');
  useEffect(() => {
    setSa(match.scoreA != null ? String(match.scoreA) : '');
    setSb(match.scoreB != null ? String(match.scoreB) : '');
  }, [match.scoreA, match.scoreB, match.a, match.b]);

  const handlePick = (teamId: string | null) => {
    if (!editable || !onPick || !teamId || !ready || busy) return;
    onPick(match.id, teamId);
  };

  const scoresValid = sa.trim() !== '' && sb.trim() !== '' && Number(sa) !== Number(sb);
  const saveScore = () => {
    if (!editable || !onScore || !ready || busy || !scoresValid) return;
    onScore(match.id, Number(sa), Number(sb));
  };

  return (
    <div className="w-[220px]">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {match.label}
        </span>
        {busy && <span className="text-[10px] text-brand-royal">saving…</span>}
      </div>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <TeamSlot
          team={teamA}
          seed={teamA?.seed}
          score={editable ? null : match.scoreA}
          isWinner={match.winner != null && match.winner === match.a}
          editable={editable}
          disabled={!ready || busy}
          onClick={() => handlePick(match.a)}
        />
        <TeamSlot
          team={teamB}
          seed={teamB?.seed}
          score={editable ? null : match.scoreB}
          isWinner={match.winner != null && match.winner === match.b}
          editable={editable}
          disabled={!ready || busy}
          onClick={() => handlePick(match.b)}
        />
      </div>

      {editable && ready && (
        <div className="mt-1.5 flex items-center gap-1.5 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Score</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={sa}
            onChange={(e) => setSa(e.target.value)}
            aria-label={`${teamA?.name ?? 'Team A'} score`}
            className="w-11 rounded border border-slate-300 px-1.5 py-1 text-center text-sm tabular-nums focus:border-brand-royal focus:outline-none"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={sb}
            onChange={(e) => setSb(e.target.value)}
            aria-label={`${teamB?.name ?? 'Team B'} score`}
            className="w-11 rounded border border-slate-300 px-1.5 py-1 text-center text-sm tabular-nums focus:border-brand-royal focus:outline-none"
          />
          <button
            type="button"
            onClick={saveScore}
            disabled={!scoresValid || busy}
            className="ml-auto rounded bg-brand-royal px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
