import type { Team } from '../../types/bracket';

interface Props {
  team: Team | null;
  isWinner: boolean;
  seed?: number | null;
  editable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TeamSlot({ team, isWinner, seed, editable, disabled, onClick }: Props) {
  const base =
    'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors';
  const tone = team
    ? isWinner
      ? 'bg-brand-gold/25 font-bold text-brand-navy'
      : 'text-brand-ink'
    : 'text-slate-400 italic';
  const interactive =
    editable && team && !disabled
      ? 'cursor-pointer hover:bg-brand-royal/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-royal'
      : editable
        ? 'cursor-not-allowed'
        : '';

  const content = (
    <>
      {seed != null && (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-brand-navy/10 text-[10px] font-bold text-brand-navy">
          {seed}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-display text-sm uppercase tracking-tight">
        {team ? team.name : 'TBD'}
      </span>
      {isWinner && (
        <span className="shrink-0 text-brand-orange" title="Winner">
          <CheckIcon />
        </span>
      )}
    </>
  );

  if (editable) {
    return (
      <button
        type="button"
        className={`${base} ${tone} ${interactive}`}
        onClick={onClick}
        disabled={disabled || !team}
        aria-pressed={isWinner}
      >
        {content}
      </button>
    );
  }

  return <div className={`${base} ${tone}`}>{content}</div>;
}
