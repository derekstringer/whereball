/**
 * Game Mapper - Converts NHL API games to FilterableGame format
 * This allows the filtering engine to work with real game data
 */

import { FilterableGame } from './filters-v2-engine';
import { NHLGame } from './nhl-api';
import { Sport } from '../components/ui/filters-v2/types';

/**
 * Convert NHLGame to FilterableGame format for filtering
 */
export function mapNHLGameToFilterable(game: NHLGame): FilterableGame {
  // Convert team IDs from numbers to strings with 'nhl_' prefix
  const homeTeamId = `nhl_${game.homeTeam.id}`;
  const awayTeamId = `nhl_${game.awayTeam.id}`;
  
  // Map broadcasts to broadcastProviders
  // TODO: This is a placeholder - real broadcast mapping needs service codes
  const broadcastProviders = game.broadcasts.map(broadcast => ({
    serviceCode: broadcast.network.toLowerCase().replace(/\s+/g, '_'),
    isBlackedOut: false, // TODO: Implement blackout logic
    isNational: broadcast.type === 'national',
  }));
  
  // Map game state
  const statusMap = {
    'FUT': 'scheduled' as const,
    'LIVE': 'live' as const,
    'FINAL': 'final' as const,
    'OFF': 'final' as const,
  };
  
  return {
    id: game.id,
    sportId: 'nhl' as Sport,
    homeTeamId,
    awayTeamId,
    broadcastProviders,
    status: statusMap[game.gameState] || 'scheduled',
    scheduledAt: new Date(game.gameDate + 'T' + game.startTime),
  };
}

/**
 * Convert array of NHLGames to FilterableGames
 */
export function mapNHLGamesToFilterable(games: NHLGame[]): FilterableGame[] {
  return games.map(mapNHLGameToFilterable);
}
