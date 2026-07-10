import { useBracket } from '../hooks/useBracket';
import BracketView from '../components/bracket/BracketView';

export default function Bracket() {
  // Poll every 15s so spectators see live updates without refreshing.
  const { bracket, loading, error, refresh } = useBracket(15_000);

  const champion =
    bracket?.champion != null ? bracket.teams.find((t) => t.id === bracket.champion) : null;

  return (
    <>
      <section className="brand-gradient text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Live Bracket</h1>
          <p className="text-white/80">Single elimination · updates automatically</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {loading && <p className="text-center text-brand-ink/60">Loading bracket…</p>}

        {error && !bracket && (
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">Couldn't load the bracket.</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button type="button" className="btn-primary mt-4" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {bracket && !bracket.seeded && (
          <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-brand-royal/30 bg-white p-8 text-center">
            <p className="text-4xl">🏸</p>
            <h2 className="mt-3 text-2xl font-bold text-brand-navy">Not published yet</h2>
            <p className="mt-2 text-sm text-brand-ink/70">
              The bracket will appear here once the organizing committee sets the teams. Check
              back soon!
            </p>
          </div>
        )}

        {bracket && bracket.seeded && (
          <>
            {champion && (
              <div className="mb-8 rounded-2xl bg-brand-gold/20 p-6 text-center ring-1 ring-brand-gold">
                <p className="text-4xl">🏆</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-royal">
                  Champions
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-brand-navy">
                  {champion.name}
                </p>
                <p className="mt-1 text-sm text-brand-ink/70">
                  {champion.player1} &amp; {champion.player2}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-ink/50">Tap a match to see the result.</p>
              <button
                type="button"
                className="text-sm font-semibold text-brand-royal hover:text-brand-navy"
                onClick={refresh}
              >
                ↻ Refresh
              </button>
            </div>

            <div className="mt-4">
              <BracketView bracket={bracket} />
            </div>
          </>
        )}
      </section>
    </>
  );
}
