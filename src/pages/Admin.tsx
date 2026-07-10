import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useBracket } from '../hooks/useBracket';
import LoginForm from '../components/admin/LoginForm';
import SeedEditor from '../components/admin/SeedEditor';
import BracketEditor from '../components/admin/BracketEditor';

type Tab = 'teams' | 'results';

export default function Admin() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('teams');
  const { bracket, loading, error, refresh, setBracket } = useBracket();

  useEffect(() => {
    api
      .getMe()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setAuthChecked(true));
  }, []);

  // Default to the results tab once a bracket exists.
  useEffect(() => {
    if (bracket?.seeded) setTab('results');
  }, [bracket?.seeded]);

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
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy">Organizer Dashboard</h1>
          <p className="text-sm text-brand-ink/60">Set up teams and update live results.</p>
        </div>
        <button type="button" onClick={logout} className="btn-ghost">
          Sign out
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'teams'} onClick={() => setTab('teams')}>
          Teams &amp; Seeding
        </TabButton>
        <TabButton active={tab === 'results'} onClick={() => setTab('results')}>
          Update Results
        </TabButton>
      </div>

      <div className="mt-6">
        {loading && <p className="text-brand-ink/60">Loading…</p>}
        {error && !bracket && <p className="text-red-600">{error}</p>}

        {bracket && tab === 'teams' && <SeedEditor bracket={bracket} onSeeded={setBracket} />}

        {bracket && tab === 'results' &&
          (bracket.seeded ? (
            <BracketEditor bracket={bracket} onChange={setBracket} />
          ) : (
            <div className="card text-center">
              <p className="text-brand-ink/70">
                No bracket yet. Add your {`teams`} in the <strong>Teams &amp; Seeding</strong> tab
                first.
              </p>
              <button type="button" className="btn-primary mt-4" onClick={() => setTab('teams')}>
                Go to Teams &amp; Seeding
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
