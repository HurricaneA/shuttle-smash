import { event } from '../content/event';

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-brand-gold">
          {event.closing}
        </p>
        <p className="mt-1 text-sm text-white/80">We look forward to your participation!</p>
        <p className="mt-4 text-sm text-white/70">
          Contacts: {event.contacts.join(', ')}
        </p>
        <p className="mt-4 text-xs text-white/50">
          {event.title} {event.year} · {event.facts.find((f) => f.label === 'Venue')?.value}
        </p>
      </div>
    </footer>
  );
}
