import type { RuleChapter as Chapter } from '../../content/rules';
import Reveal from '../Reveal';
import { VISUALS } from './illustrations';

export default function RuleChapter({ chapter, index }: { chapter: Chapter; index: number }) {
  const Visual = VISUALS[chapter.visual];
  const visualFirst = index % 2 === 1; // alternate sides on desktop

  return (
    // opacity-only reveal (y=0) so it never shifts the anchor target under the navbar
    <Reveal y={0}>
      <article
        id={chapter.id}
        className="scroll-mt-28 grid items-center gap-6 md:grid-cols-2 md:gap-10"
      >
        {/* Text */}
        <div className={visualFirst ? 'md:order-2' : ''}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-navy font-display text-lg font-extrabold text-white">
              {chapter.number}
            </span>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-navy">
              <span aria-hidden>{chapter.icon}</span>
              {chapter.heading}
            </h2>
          </div>

          {chapter.summary && (
            <p className="mt-3 font-display text-lg uppercase tracking-tight text-brand-royal">
              {chapter.summary}
            </p>
          )}

          <ul className="mt-4 space-y-2.5">
            {chapter.items.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-brand-ink/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className={visualFirst ? 'md:order-1' : ''}>
          <Visual />
        </div>
      </article>
    </Reveal>
  );
}
