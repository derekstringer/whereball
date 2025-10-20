/**
 * Game Mapper - Converts NHL API games to FilterableGame format
 * This allows the filtering engine to work with real game data
 */

import { FilterableGame } from './filters-v2-engine';
import { NHLGame } from './nhl-api';
import { Sport } from '../components/ui/filters-v2/types';
import { getServicesForBroadcast } from './broadcast-mapper';

/**
 * Convert NHLGame to FilterableGame format for filtering
 */
export function mapNHLGameToFilterable(game: NHLGame): FilterableGame {
  // Convert team abbreviations to our team ID format (e.g., 'PHI' -> 'nhl_phi')
  const homeTeamId = `nhl_${game.homeTeam.abbreviation.toLowerCase()}`;
  const awayTeamId = `nhl_${game.awayTeam.abbreviation.toLowerCase()}`;
  
  // Map broadcasts to broadcastProviders
  // For each broadcast network, get ALL services that carry it
  const broadcastProviders: FilterableGame['broadcastProviders'] = [];
  
  game.broadcasts.forEach(broadcast => {
    const serviceCodes = getServicesForBroadcast(broadcast.network);
    
    // Create a provider entry for each service
    serviceCodes.forEach(serviceCode => {
      broadcastProviders.push({
        serviceCode,
        isBlackedOut: false, // TODO: Implement blackout logic based on location
        isNational: broadcast.type === 'national',
      });
    });
  });
  
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
