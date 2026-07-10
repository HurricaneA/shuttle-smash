import type { Bracket, Team } from '../../types/bracket';
import MatchCard from './MatchCard';

interface Props {
  bracket: Bracket;
  editable?: boolean;
  busyMatchId?: string | null;
  onPick?: (matchId: string, teamId: string) => void;
}

export default function BracketView({ bracket, editable, busyMatchId, onPick }: Props) {
  const teams: Record<string, Team | undefined> = Object.fromEntries(
    bracket.teams.map((t) => [t.id, t]),
  );

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-6 md:gap-10">
          {bracket.rounds.map((round) => (
            <div key={round.round} className="flex min-w-[220px] flex-col">
              <h3 className="mb-3 text-center text-base font-bold uppercase tracking-wide text-brand-navy">
                {round.name}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {round.matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teams={teams}
                    editable={editable}
                    busy={busyMatchId === m.id}
                    onPick={onPick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {bracket.thirdPlaceMatch && (
        <div className="mt-8 max-w-[240px]">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🥉</span>
            <h3 className="text-base font-bold uppercase tracking-wide text-brand-navy">
              3rd-Place Match
            </h3>
          </div>
          <MatchCard
            match={bracket.thirdPlaceMatch}
            teams={teams}
            editable={editable}
            busy={busyMatchId === bracket.thirdPlaceMatch.id}
            onPick={onPick}
          />
        </div>
      )}
    </div>
  );
}
