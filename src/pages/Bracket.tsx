import { useTournament } from '../hooks/useBracket';
import GroupSection from '../components/tournament/GroupSection';
import PlayoffBracket from '../components/tournament/PlayoffBracket';
import type { Team } from '../types/bracket';

export default function Bracket() {
  const { tournament, loading, error, refresh } = useTournament(15_000);

  const teamMap: Record<string, Team | undefined> = tournament
    ? Object.fromEntries(tournament.teams.map((t) => [t.id, t]))
    : {};
  const champion = tournament?.champion ? teamMap[tournament.champion] : null;

  return (
    <>
      <section className="brand-gradient text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Live Standings &amp; Bracket</h1>
          <p className="text-white/80">
            Two groups · round-robin · Top 4 playoffs (IPL format) · updates automatically
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {loading && <p className="text-center text-brand-ink/60">Loading…</p>}

        {error && !tournament && (
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">Couldn't load the tournament.</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button type="button" className="btn-primary mt-4" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {tournament && !tournament.published && (
          <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-brand-royal/30 bg-white p-8 text-center">
            <p className="text-4xl">🏸</p>
            <h2 className="mt-3 text-2xl font-bold text-brand-navy">Not published yet</h2>
            <p className="mt-2 text-sm text-brand-ink/70">
              The tables and fixtures will appear here once the organizing committee sets the teams.
            </p>
          </div>
        )}

        {tournament && tournament.published && (
          <>
            {champion && (
              <div className="mb-8 rounded-2xl bg-brand-gold/20 p-6 text-center ring-1 ring-brand-gold">
                <p className="text-4xl">🏆</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-royal">Champions</p>
                <p className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-brand-navy">
                  {champion.name}
                </p>
                <p className="mt-1 text-sm text-brand-ink/70">
                  {champion.player1} &amp; {champion.player2}
                </p>
              </div>
            )}

            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-semibold text-brand-royal hover:text-brand-navy"
                onClick={refresh}
              >
                ↻ Refresh
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {tournament.tables.map((table) => (
                <GroupSection key={table.table} table={table} teams={teamMap} />
              ))}
            </div>

            <div className="mt-12">
              <h2 className="text-center text-3xl font-extrabold text-brand-navy">Playoffs</h2>
              <div className="mx-auto mt-2 h-1 w-24 rounded bg-brand-gold" />
              <div className="mt-8">
                <PlayoffBracket
                  playoffs={tournament.playoffs}
                  teams={teamMap}
                  ready={tournament.playoffsReady}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
