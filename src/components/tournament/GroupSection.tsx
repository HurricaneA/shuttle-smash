import type { GroupTable, Team } from '../../types/bracket';
import StandingsTable from './StandingsTable';
import MatchCard from '../bracket/MatchCard';

interface Props {
  table: GroupTable;
  teams: Record<string, Team | undefined>;
  editable?: boolean;
  busyMatchId?: string | null;
  onPick?: (matchId: string, teamId: string) => void;
  onScore?: (matchId: string, scoreA: number, scoreB: number) => void;
}

export default function GroupSection({ table, teams, editable, busyMatchId, onPick, onScore }: Props) {
  // group fixtures by round ("day")
  const rounds = [...new Set(table.matches.map((m) => m.round ?? 0))].sort((a, b) => a - b);

  return (
    <section className="card">
      <h3 className="text-xl font-extrabold text-brand-navy">
        Table <span className="text-brand-gold">{table.table}</span>
      </h3>

      <div className="mt-4">
        <StandingsTable table={table} teams={teams} />
      </div>

      {table.matches.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold uppercase tracking-wide text-brand-royal">Fixtures &amp; Results</h4>
          <div className="mt-3 space-y-5">
            {rounds.map((round) => (
              <div key={round}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Day {round}</div>
                <div className="flex flex-wrap gap-4">
                  {table.matches
                    .filter((m) => (m.round ?? 0) === round)
                    .map((m) => (
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
