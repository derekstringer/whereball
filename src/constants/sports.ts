/**
 * Sports Constants
 * Sport definitions with emojis, colors, and metadata
 */

export interface Sport {
  id: string;
  name: string;
  emoji: string;
  league: 'NHL' | 'NBA' | 'MLB' | 'NCAA';
  teamCount: number;
  color: string; // Primary brand color
}

export const SPORTS: Sport[] = [
  {
    id: 'hockey',
    name: 'Hockey',
    emoji: '🏒',
    league: 'NHL',
    teamCount: 32,
    color: '#003087',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    emoji: '🏀',
    league: 'NBA',
    teamCount: 30,
    color: '#C8102E',
  },
  {
    id: 'football',
    name: 'Football',
    emoji: '🏈',
    league: 'NCAA', // Using NCAA as placeholder for NFL
    teamCount: 32,
    color: '#002244',
  },
  {
    id: 'baseball',
    name: 'Baseball',
    emoji: '⚾',
    league: 'MLB',
    teamCount: 30,
    color: '#041E42',
  },
];

// Helper to get sport by league
export const getSportByLeague = (league: string): Sport | undefined => {
  return SPORTS.find(sport => sport.league === league);
};

// Helper to get sport emoji by league
export const getSportEmoji = (league: string): string => {
  const sport = getSportByLeague(league);
  return sport?.emoji || '🏆';
};
