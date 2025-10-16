/**
 * FiltersV2 Engine - Apply filters to games list
 */

import { NHLGame } from './nhl-api';
import { FiltersV2State } from '../components/ui/filters-v2/types';
import { getServicesForBroadcast } from './broadcast-mapper';

interface FilterContext {
  filters: FiltersV2State;
  userFollows: string[]; // team IDs (e.g., "nhl_tor")
  userServices: string[]; // service codes (e.g., "espn_plus")
}

/**
 * Apply FiltersV2 to a games array
 */
export function applyFiltersV2(
  games: NHLGame[],
  context: FilterContext
): NHLGame[] {
  const { filters, userFollows, userServices } = context;

  // If preset1 (All Games), return all games
  if (filters.quickView === 'preset1') {
    return games;
  }

  // Get active filters based on preset or custom
  let activeSports: string[] = [];
  let activeTeams: string[] = [];
  let activeServices: string[] = [];

  if (filters.quickView === 'custom' && filters.customSelections) {
    activeSports = filters.customSelections.sports || [];
    activeTeams = filters.customSelections.teams || [];
    activeServices = filters.customSelections.services || [];
  } else if (filters.quickView === 'preset2') {
    // My Stuff: followed teams only
    activeSports = ['NHL']; // Only NHL for now
    activeTeams = userFollows;
    activeServices = userServices;
  } else if (filters.quickView === 'preset3') {
    // Tonight: games today with user's services
    activeSports = ['NHL']; // Only NHL for now
    activeTeams = [];
    activeServices = userServices;
  }

  // Filter games
  return games.filter(game => {
    // 1. Sport filter (NHL only for now, skip check)
    // Future: if (activeSports.length > 0 && !activeSports.includes('NHL')) return false;

    // 2. Team filter (if any teams selected)
    if (activeTeams.length > 0) {
      // Convert NHL team IDs (numbers) to our team ID format (e.g., "nhl_tor")
      const homeTeamId = `nhl_${game.homeTeam.abbreviation.toLowerCase()}`;
      const awayTeamId = `nhl_${game.awayTeam.abbreviation.toLowerCase()}`;
      
      const hasHomeTeam = activeTeams.includes(homeTeamId);
      const hasAwayTeam = activeTeams.includes(awayTeamId);
      
      if (!hasHomeTeam && !hasAwayTeam) {
        return false;
      }
    }

    // 3. Service filter (if any services selected)
    if (activeServices.length > 0) {
      // Map broadcast networks to service codes
      const gameServices: string[] = [];
      game.broadcasts.forEach(b => {
        const services = getServicesForBroadcast(b.network);
        gameServices.push(...services);
      });
      
      const hasMatchingService = gameServices.some(service => 
        activeServices.includes(service)
      );
      
      if (!hasMatchingService) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if game should show "Elsewhere" badge
 */
export function shouldShowElsewhereBadge(
  game: NHLGame,
  userServices: string[],
  showElsewhereBadges: boolean
): boolean {
  if (!showElsewhereBadges) return false;

  // Map broadcast networks to service codes
  const gameServices: string[] = [];
  game.broadcasts.forEach(b => {
    const services = getServicesForBroadcast(b.network);
    gameServices.push(...services);
  });
    
  const hasUserService = gameServices.some(service => userServices.includes(service));
  const hasOtherServices = gameServices.length > 0;

  // Show "elsewhere" if game is available but not on user's services
  return !hasUserService && hasOtherServices;
}

/**
 * Check if game should show "National" badge
 */
export function shouldShowNationalBadge(
  game: NHLGame,
  showNationalBadges: boolean
): boolean {
  if (!showNationalBadges) return false;

  return game.broadcasts.some(b => b.type === 'national');
}
