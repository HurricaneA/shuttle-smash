import { rules, rulesIntro } from '../content/rules';
import RuleChapter from '../components/rules/RuleChapter';
import { ShuttleIcon } from '../components/rules/primitives';

/** Smooth-scroll to a section, offset by the actual sticky-navbar height. */
function jumpTo(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector('header');
  const offset = (header?.offsetHeight ?? 64) + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}

export default function Rules() {
  return (
    <>
      <section className="brand-gradient text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <span className="brand-chip">Girls Doubles</span>
          <h1 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl">How to Play</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">{rulesIntro}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {rules.map((r) => (
              <a
                key={r.id}
                href={`#${r.id}`}
                onClick={(e) => jumpTo(e, r.id)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 transition-colors hover:bg-brand-gold hover:text-brand-navy"
              >
                {r.number}. {r.heading}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="space-y-16">
          {rules.map((chapter, i) => (
            <RuleChapter key={chapter.id} chapter={chapter} index={i} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-gold bg-brand-gold/10 p-8 text-center">
          <ShuttleIcon className="h-8 w-8" />
          <p className="font-display text-xl font-bold uppercase tracking-tight text-brand-navy">
            Play fair, respect all, enjoy the game
          </p>
          <p className="text-sm text-brand-ink/70">The umpire's decision on court is final.</p>
        </div>
      </section>
    </>
  );
}
