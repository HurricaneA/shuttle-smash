import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useTournament } from '../hooks/useBracket';
import LoginForm from '../components/admin/LoginForm';
import TableEditor from '../components/admin/TableEditor';
import ResultsEditor from '../components/admin/ResultsEditor';

type Tab = 'teams' | 'results';

export default function Admin() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('teams');
  const { tournament, loading, error, refresh, setTournament } = useTournament();

  useEffect(() => {
    api
      .getMe()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (tournament?.published) setTab('results');
  }, [tournament?.published]);

  const logout = async () => {
    await api.logout().catch(() => {});
    setIsAdmin(false);
  };

  if (!authChecked) {
    return <p className="py-24 text-center text-brand-ink/60">Checking session…</p>;
  }

  if (!isAdmin) {
    return (
      <LoginForm
        onSuccess={() => {
          setIsAdmin(true);
          refresh();
        }}
      />
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy">Organizer Dashboard</h1>
          <p className="text-sm text-brand-ink/60">Set up the tables and record live results.</p>
        </div>
        <button type="button" onClick={logout} className="btn-ghost">
          Sign out
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'teams'} onClick={() => setTab('teams')}>
          Teams &amp; Tables
        </TabButton>
        <TabButton active={tab === 'results'} onClick={() => setTab('results')}>
          Results &amp; Playoffs
        </TabButton>
      </div>

      <div className="mt-6">
        {loading && <p className="text-brand-ink/60">Loading…</p>}
        {error && !tournament && <p className="text-red-600">{error}</p>}

        {tournament && tab === 'teams' && <TableEditor tournament={tournament} onSeeded={setTournament} />}

        {tournament && tab === 'results' &&
          (tournament.published ? (
            <ResultsEditor tournament={tournament} onChange={setTournament} />
          ) : (
            <div className="card text-center">
              <p className="text-brand-ink/70">
                No tournament yet. Add teams to both tables in the{' '}
                <strong>Teams &amp; Tables</strong> tab first.
              </p>
              <button type="button" className="btn-primary mt-4" onClick={() => setTab('teams')}>
                Go to Teams &amp; Tables
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-brand-royal text-brand-navy'
          : 'border-transparent text-brand-ink/50 hover:text-brand-navy'
      }`}
    >
      {children}
    </button>
  );
}
