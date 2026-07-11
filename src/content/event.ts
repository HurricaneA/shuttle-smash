// Home-page event facts. Edit these freely — no code knowledge needed.

export interface EventFact {
  label: string;
  value: string;
}

export const event = {
  title: 'Shuttle Smash Championship',
  subtitle: 'Girls Badminton Tournament',
  year: '2026',
  tagline: 'Fellowship, Fun and Good Time',
  invite: 'Welcome to the',
  closing: 'Come, Play, Compete & Create Memories!',
  facts: [
    { label: 'Date', value: '2026' },
    { label: 'Time', value: '9:00 AM – 5:00 PM' },
    { label: 'Venue', value: 'Sigma Badminton Court, Rathmalana' },
    { label: 'Format', value: 'Doubles · 2 groups · Top 4 (IPL format)' },
    { label: 'Players per team', value: 'Two' },
    { label: 'Number of teams', value: '10 Teams · 2 tables of 5' },
    { label: 'Team selection', value: 'Confirmed by the organizing committee' },
    { label: 'Entry fee', value: 'Rs. 1500' },
    { label: 'Prizes', value: 'Trophies and medals' },
    { label: 'Refreshments', value: 'Provided by the organizing committee' },
  ] as EventFact[],
  contacts: ['Ebi', 'Siva', 'Lita'],
} as const;
