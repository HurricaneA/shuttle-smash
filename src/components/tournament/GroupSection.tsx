import type { GroupTable, Team } from '../../types/bracket';
import StandingsTable from './StandingsTable';

/** A group table's standings card. Fixtures live in the Timetable. */
export default function GroupSection({
  table,
  teams,
}: {
  table: GroupTable;
  teams: Record<string, Team | undefined>;
}) {
  return (
    <section className="card">
      <h3 className="text-xl font-extrabold text-brand-navy">
        Table <span className="text-brand-gold">{table.table}</span>
      </h3>
      <div className="mt-4">
        <StandingsTable table={table} teams={teams} />
      </div>
    </section>
  );
}
