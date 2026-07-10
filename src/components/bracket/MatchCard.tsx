import type { Match, Team } from '../../types/bracket';
import TeamSlot from './TeamSlot';

interface Props {
  match: Match;
  teams: Record<string, Team | undefined>;
  editable?: boolean;
  busy?: boolean;
  onPick?: (matchId: string, teamId: string) => void;
}

export default function MatchCard({ match, teams, editable, busy, onPick }: Props) {
  const teamA = match.a ? teams[match.a] ?? null : null;
  const teamB = match.b ? teams[match.b] ?? null : null;
  // A winner can only be chosen once both participants are known.
  const ready = Boolean(match.a && match.b);

  const handlePick = (teamId: string | null) => {
    if (!editable || !onPick || !teamId || !ready || busy) return;
    onPick(match.id, teamId);
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
          isWinner={match.winner != null && match.winner === match.a}
          editable={editable}
          disabled={!ready || busy}
          onClick={() => handlePick(match.a)}
        />
        <TeamSlot
          team={teamB}
          seed={teamB?.seed}
          isWinner={match.winner != null && match.winner === match.b}
          editable={editable}
          disabled={!ready || busy}
          onClick={() => handlePick(match.b)}
        />
      </div>
    </div>
  );
}
