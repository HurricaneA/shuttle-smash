import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { event } from '../content/event';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="brand-gradient relative overflow-hidden text-white">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <Logo className="h-24 w-24 drop-shadow-lg sm:h-28 sm:w-28" />
          <p className="font-display text-lg uppercase tracking-[0.2em] text-brand-gold">
            {event.invite}
          </p>
          <h1 className="text-balance text-4xl font-extrabold leading-[0.95] text-white sm:text-6xl">
            {event.title}
            <span className="mt-2 block text-brand-gold">{event.subtitle}</span>
          </h1>
          <span className="brand-chip text-base">{event.year}</span>
          <p className="max-w-xl text-lg text-white/85">{event.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/bracket" className="btn-gold">
              View the live bracket
            </Link>
            <Link
              to="/rules"
              className="btn-ghost border-white/40 text-white hover:border-white hover:bg-white hover:text-brand-navy"
            >
              Read the rules
            </Link>
          </div>
        </div>
      </section>

      {/* Event details */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-extrabold text-brand-navy">Tournament Details</h2>
        <div className="mx-auto mt-2 h-1 w-24 rounded bg-brand-gold" />

        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {event.facts.map((fact) => (
            <div key={fact.label} className="card flex flex-col gap-1">
              <dt className="text-xs font-bold uppercase tracking-wide text-brand-royal">
                {fact.label}
              </dt>
              <dd className="font-display text-lg font-semibold uppercase tracking-tight text-brand-navy">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-2xl border-2 border-dashed border-brand-gold bg-brand-gold/10 p-6 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-tight text-brand-navy">
            {event.closing}
          </p>
          <p className="mt-1 text-sm text-brand-ink/70">
            Questions? Contact {event.contacts.join(', ')}.
          </p>
        </div>
      </section>
    </>
  );
}
