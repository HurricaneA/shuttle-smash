import { useEffect, useState } from 'react';
import type { Match, Team } from '../../types/bracket';

interface Props {
  match: Match;
  teams: Record<string, Team | undefined>;
  editable?: boolean;
  busy?: boolean;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
}

/** A horizontal "Team A  VS  Team B" fixture line (with scores + winner highlight). */
export default function FixtureLine({ match, teams, editable, busy, onPick, onScore }: Props) {
  const teamA = match.a ? teams[match.a] ?? null : null;
  const teamB = match.b ? teams[match.b] ?? null : null;
  const ready = Boolean(match.a && match.b);

  const [sa, setSa] = useState('');
  const [sb, setSb] = useState('');
  useEffect(() => {
    setSa(match.scoreA != null ? String(match.scoreA) : '');
    setSb(match.scoreB != null ? String(match.scoreB) : '');
  }, [match.scoreA, match.scoreB, match.a, match.b]);

  const winA = match.winner != null && match.winner === match.a;
  const winB = match.winner != null && match.winner === match.b;
  const nameCls = (win: boolean, tbd: boolean) =>
    `flex-1 truncate font-display text-sm uppercase tracking-tight ${
      tbd ? 'italic text-slate-400' : win ? 'font-extrabold text-brand-navy' : 'text-brand-ink'
    }`;

  const pick = (teamId: string | null) => {
    if (editable && onPick && teamId && ready && !busy) onPick(match.id, teamId);
  };
  const scoresValid = sa.trim() !== '' && sb.trim() !== '' && Number(sa) !== Number(sb);
  const saveScore = () => {
    if (editable && onScore && ready && !busy && scoresValid) onScore(match.id, Number(sa), Number(sb));
  };

  const inputCls =
    'w-9 shrink-0 rounded border border-slate-300 px-1 py-0.5 text-center text-sm tabular-nums focus:border-brand-royal focus:outline-none disabled:bg-slate-50';
  const scoreCls = (win: boolean) =>
    `w-6 shrink-0 text-center tabular-nums text-base font-bold ${win ? 'text-brand-navy' : 'text-brand-ink/40'}`;

  return (
    <div className="min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {(match.label || match.sublabel) && (
        <div className="mb-1">
          {match.label && (
            <div className="text-[11px] font-bold uppercase tracking-wide text-brand-navy">{match.label}</div>
          )}
          {match.sublabel && <div className="text-[10px] text-slate-400">{match.sublabel}</div>}
        </div>
      )}

      <div className="flex items-center gap-2">
        {editable ? (
          <button
            type="button"
            onClick={() => pick(match.a)}
            disabled={!ready || busy || !teamA}
            className={`text-right ${nameCls(winA, !teamA)} ${teamA && ready ? 'hover:text-brand-royal' : ''}`}
          >
            {teamA?.name ?? 'TBD'}
          </button>
        ) : (
          <span className={`text-right ${nameCls(winA, !teamA)}`}>{teamA?.name ?? 'TBD'}</span>
        )}

        {editable ? (
          <input
            value={sa}
            onChange={(e) => setSa(e.target.value)}
            type="number"
            min={0}
            max={99}
            disabled={!ready || busy}
            aria-label={`${teamA?.name ?? 'Team A'} score`}
            className={inputCls}
          />
        ) : match.scoreA != null ? (
          <span className={scoreCls(winA)}>{match.scoreA}</span>
        ) : null}

        <span className="shrink-0 text-[11px] font-bold text-slate-400">VS</span>

        {editable ? (
          <input
            value={sb}
            onChange={(e) => setSb(e.target.value)}
            type="number"
            min={0}
            max={99}
            disabled={!ready || busy}
            aria-label={`${teamB?.name ?? 'Team B'} score`}
            className={inputCls}
          />
        ) : match.scoreB != null ? (
          <span className={scoreCls(winB)}>{match.scoreB}</span>
        ) : null}

        {editable ? (
          <button
            type="button"
            onClick={() => pick(match.b)}
            disabled={!ready || busy || !teamB}
            className={`text-left ${nameCls(winB, !teamB)} ${teamB && ready ? 'hover:text-brand-royal' : ''}`}
          >
            {teamB?.name ?? 'TBD'}
          </button>
        ) : (
          <span className={`text-left ${nameCls(winB, !teamB)}`}>{teamB?.name ?? 'TBD'}</span>
        )}
      </div>

      {editable && ready && (
        <div className="mt-1.5 flex items-center justify-end gap-2">
          {busy && <span className="text-[10px] text-brand-royal">saving…</span>}
          <button
            type="button"
            onClick={saveScore}
            disabled={!scoresValid || busy}
            className="rounded bg-brand-royal px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
