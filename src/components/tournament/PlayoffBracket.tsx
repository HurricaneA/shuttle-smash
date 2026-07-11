import type { Playoffs, Team } from '../../types/bracket';
import MatchCard from '../bracket/MatchCard';

interface Props {
  playoffs: Playoffs;
  teams: Record<string, Team | undefined>;
  ready: boolean;
  editable?: boolean;
  busyMatchId?: string | null;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
}

/** IPL Top-4 playoffs: Qualifier 1 + Eliminator → Qualifier 2 → Final. */
export default function PlayoffBracket({ playoffs, teams, ready, editable, busyMatchId, onPick, onScore }: Props) {
  const byId = Object.fromEntries(playoffs.matches.map((m) => [m.id, m]));
  const card = (id: string) => {
    const m = byId[id];
    if (!m) return null;
    return (
      <MatchCard
        match={m}
        teams={teams}
        editable={editable}
        busy={busyMatchId === m.id}
        onPick={onPick}
        onScore={onScore}
      />
    );
  };

  if (!ready) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-brand-royal/30 bg-white p-6 text-center text-sm text-brand-ink/70">
        The playoffs unlock once both tables have their top 2 — Qualifier 1 (A1 vs B1), Eliminator
        (A2 vs B2), then Qualifier 2 and the Final.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-6 md:gap-10">
        {/* Column 1: Qualifier 1 (top) + Eliminator (bottom) */}
        <div className="flex min-w-[220px] flex-col justify-around gap-6">
          {card('q1')}
          {card('elim')}
        </div>
        {/* Column 2: Qualifier 2 */}
        <div className="flex min-w-[220px] flex-col justify-center">{card('q2')}</div>
        {/* Column 3: Final */}
        <div className="flex min-w-[220px] flex-col justify-center">{card('final')}</div>
      </div>
    </div>
  );
}
