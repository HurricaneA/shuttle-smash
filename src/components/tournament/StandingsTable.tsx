import type { GroupTable, Team } from '../../types/bracket';

/** A group table's standings — ranked by wins, then point difference (winning margins). */
export default function StandingsTable({
  table,
  teams,
}: {
  table: GroupTable;
  teams: Record<string, Team | undefined>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse text-sm">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th className="px-2 py-2 text-left font-bold uppercase tracking-wide">#</th>
            <th className="px-2 py-2 text-left font-bold uppercase tracking-wide">Team {table.table}</th>
            <th className="px-2 py-2 text-center font-bold" title="Played">P</th>
            <th className="px-2 py-2 text-center font-bold" title="Won">W</th>
            <th className="px-2 py-2 text-center font-bold" title="Lost">L</th>
            <th className="px-2 py-2 text-center font-bold" title="Points">Pts</th>
            <th className="px-2 py-2 text-center font-bold" title="Point difference (points won − points lost)">PD</th>
          </tr>
        </thead>
        <tbody>
          {table.standings.map((s) => {
            const t = teams[s.teamId];
            return (
              <tr
                key={s.teamId}
                className={`border-b border-slate-200 ${
                  s.qualified ? 'bg-brand-gold/15' : 'bg-white'
                }`}
              >
                <td className="px-2 py-2">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded font-display text-xs font-bold ${
                      s.qualified ? 'bg-brand-gold text-brand-navy' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.rank}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="font-display font-semibold uppercase tracking-tight text-brand-navy">
                    {t ? `${table.table}${t.position} · ${t.name}` : 'TBD'}
                  </div>
                  {t && (
                    <div className="text-[11px] text-brand-ink/50">
                      {t.player1} &amp; {t.player2}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-center tabular-nums text-brand-ink/70">{s.played}</td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-brand-navy">{s.won}</td>
                <td className="px-2 py-2 text-center tabular-nums text-brand-ink/70">{s.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums font-bold text-brand-navy">{s.points}</td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-brand-royal">
                  {s.diff > 0 ? `+${s.diff}` : s.diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 px-1 text-[11px] text-brand-ink/50">
        Top 2 advance to the playoffs (highlighted once the group is complete). Ties broken by point
        difference (PD).
      </p>
    </div>
  );
}
