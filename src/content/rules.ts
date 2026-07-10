// ============================================================================
//  TOURNAMENT RULES — EDIT THIS FILE
//  Change the wording freely. Keep each chapter's `visual` id as-is (it selects
//  the matching illustration/animation). Keep the quotes, commas and brackets.
// ============================================================================

/** Which animated illustration renders beside a chapter. */
export type VisualId =
  | 'objective'
  | 'matchFormat'
  | 'serving'
  | 'scoring'
  | 'faults'
  | 'let'
  | 'doublesCourt';

export interface RuleChapter {
  id: string;
  number: number;
  icon: string;
  heading: string;
  summary?: string;
  items: string[];
  visual: VisualId;
}

export const rulesIntro =
  'Everything you need to play in the Shuttle Smash Championship. Scroll through — each rule ' +
  'comes to life with its own animation, and you can try the serving demo yourself.';

export const rules: RuleChapter[] = [
  {
    id: 'objective',
    number: 1,
    icon: '🎯',
    heading: 'Objective',
    summary: 'Win the rally, win the point.',
    items: [
      "Score points by hitting the shuttlecock over the net and landing it inside your opponent's court.",
    ],
    visual: 'objective',
  },
  {
    id: 'match-format',
    number: 2,
    icon: '🏸',
    heading: 'Match Format',
    summary: 'One game to 15 — win by two.',
    items: [
      'A match is usually a single game.',
      'At the 8th point there is a 2-minute break — teams switch sides during it.',
      'The game is played to 15 points.',
      'A player/team must win by 2 points.',
      'If the score reaches 21–21, the side that scores the 22nd point wins.',
    ],
    visual: 'matchFormat',
  },
  {
    id: 'serving',
    number: 3,
    icon: '👉',
    heading: 'Serving Rules',
    summary: 'Serve low, diagonal, and from the right box on an even score.',
    items: [
      "The serve must be hit below the server's chest.",
      'No foot on the front line.',
      'You cannot double-tap the shuttle.',
      'Both feet must stay in contact with the court until the shuttle is hit.',
      "Serve diagonally into the opponent's service court.",
      'Even score → serve from the right service court.',
      'Odd score → serve from the left service court.',
    ],
    visual: 'serving',
  },
  {
    id: 'scoring',
    number: 4,
    icon: '➕',
    heading: 'Scoring System',
    summary: 'Every rally is a point — rally scoring.',
    items: [
      'A point is scored on every rally, regardless of who served.',
      'The winner of the rally gets the point and serves next.',
    ],
    visual: 'scoring',
  },
  {
    id: 'faults',
    number: 5,
    icon: '🚫',
    heading: 'Faults',
    summary: 'A fault hands the rally to the other side.',
    items: [
      'The shuttle lands outside the court boundaries.',
      'The shuttle fails to cross the net.',
      'The shuttle touches the ceiling or walls.',
      'A player touches the net with their racket or body.',
      'The shuttle is hit twice by the same side.',
      'A player reaches over the net to hit the shuttle before it crosses.',
    ],
    visual: 'faults',
  },
  {
    id: 'let',
    number: 6,
    icon: '🔁',
    heading: 'Let',
    summary: 'The rally is simply replayed — no point.',
    items: [
      'The shuttle gets stuck on the net after crossing it.',
      'A player is not ready when the serve is delivered.',
      'There is an unexpected disturbance during play.',
    ],
    visual: 'let',
  },
  {
    id: 'doubles-court',
    number: 7,
    icon: '📐',
    heading: 'Doubles Court',
    summary: 'Wider sidelines, shorter service box.',
    items: [
      'Doubles uses the wider side boundaries (the outer tramlines are in play).',
      'But the shorter service line applies for servers (the back service box is pulled in).',
    ],
    visual: 'doublesCourt',
  },
];
