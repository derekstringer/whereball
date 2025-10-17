/**
 * FiltersV2 Engine - Game filtering logic
 * Implements the predicate function per FILTERS_WIRING_PLAN.md
 */

import { FiltersV2State, Sport, TeamsMode } from '../components/ui/filters-v2/types';
import { Follow, UserSubscription } from '../types';

/**
 * User context needed for filtering decisions
 */
export interface UserFilterContext {
  follows: Follow[];
  subscriptions: UserSubscription[];
  location?: {
    zipCode: string;
    dmaCode?: string;
  };
}

/**
 * Game data structure (minimal fields needed for filtering)
 */
export interface FilterableGame {
  id: string;
  sportId: Sport;
  homeTeamId: string;
  awayTeamId: string;
  broadcastProviders: Array<{
    serviceCode: string;
    isBlackedOut?: boolean;
    isNational?: boolean;
  }>;
  status: 'scheduled' | 'live' | 'final';
  scheduledAt: Date;
}

/**
 * Derived helpers from filter state
 */
export class FiltersHelper {
  constructor(
    private filters: FiltersV2State,
    private context: UserFilterContext
  ) {}

  /**
   * Get effective team IDs based on teams mode
   */
  effectiveTeamIds(): Set<string> {
    const customSelections = this.filters.customSelections;
    
    if (!customSelections) {
      // Using a preset - determine from quickView
      if (this.teamScope() === 'MY') {
        // Followed teams mode
        const followedIds = new Set(this.context.follows.map(f => f.team_id));
        return followedIds;
      } else {
        // All teams mode
        return new Set(); // Empty set means "all teams"
      }
    }

    // Custom mode
    const teamsMode = customSelections.teamsMode;
    
    if (teamsMode === 'followed') {
      // Start with followed teams, remove excludes
      const followedIds = new Set(this.context.follows.map(f => f.team_id));
      customSelections.excludedTeams.forEach(id => followedIds.delete(id));
      return followedIds;
    } else {
      // pick_specific mode
      return new Set(customSelections.teams);
    }
  }

  /**
   * Get team scope from quick view
   */
  teamScope(): 'MY' | 'ALL' {
    return this.filters.quickView.startsWith('my_teams') ? 'MY' : 'ALL';
  }

  /**
   * Get service scope from quick view
   */
  serviceScope(): 'MY' | 'ANY' {
    return this.filters.quickView.endsWith('my_services') ? 'MY' : 'ANY';
  }

  /**
   * Get selected sports (empty means all sports)
   */
  selectedSports(): Set<Sport> {
    const customSelections = this.filters.customSelections;
    if (!customSelections || customSelections.sports.length === 0) {
      return new Set(); // Empty = all sports
    }
    return new Set(customSelections.sports);
  }

  /**
   * Get owned service codes
   */
  ownedServiceIds(): Set<string> {
    return new Set(this.context.subscriptions.map(s => s.service_code));
  }
}

/**
 * Build a predicate function that filters games based on current filter state
 * 
 * @param filters - Current filter state
 * @param context - User context (follows, subscriptions, location)
 * @returns A function that returns true if game should be included in results
 */
export function buildMatchPredicate(
  filters: FiltersV2State,
  context: UserFilterContext
): (game: FilterableGame) => boolean {
  const helper = new FiltersHelper(filters, context);
  
  // Pre-compute these once for efficiency
  const selectedSports = helper.selectedSports();
  const effectiveTeams = helper.effectiveTeamIds();
  const teamScope = helper.teamScope();
  const serviceScope = helper.serviceScope();
  const ownedServices = helper.ownedServiceIds();

  return (game: FilterableGame): boolean => {
    // 1. SPORTS FILTER
    if (selectedSports.size > 0) {
      if (!selectedSports.has(game.sportId)) {
        return false; // Game's sport not in selected sports
      }
    }
    // If selectedSports is empty, treat as "all sports" - continue

    // 2. TEAMS FILTER
    if (teamScope === 'MY') {
      // MY TEAMS mode - must include at least one team
      if (effectiveTeams.size > 0) {
        const hasTeam = effectiveTeams.has(game.homeTeamId) || 
                       effectiveTeams.has(game.awayTeamId);
        if (!hasTeam) {
          return false; // Neither team is followed
        }
      }
      // If effectiveTeams is empty in MY TEAMS mode, show nothing (user follows no teams)
      else {
        return false;
      }
    }
    // If teamScope === 'ALL', no team filtering - continue

    // 3. SERVICES FILTER (Watchability)
    if (serviceScope === 'MY') {
      // MY SERVICES mode - must be watchable on at least one owned service
      if (!game.broadcastProviders || game.broadcastProviders.length === 0) {
        return false; // No broadcast info, can't be watchable
      }
      
      const isWatchable = game.broadcastProviders.some(provider => {
        // Check if we own this service AND it's not blacked out
        return ownedServices.has(provider.serviceCode) && 
               !provider.isBlackedOut;
      });
      
      if (!isWatchable) {
        return false; // Not watchable on any owned services
      }
    }
    // If serviceScope === 'ANY', show all legal broadcasts - no filtering

    // Game passed all filters
    return true;
  };
}

/**
 * Apply filters to a list of games
 * 
 * @param games - Array of games to filter
 * @param filters - Current filter state
 * @param context - User context
 * @returns Filtered array of games
 */
export function applyFilters(
  games: FilterableGame[],
  filters: FiltersV2State,
  context: UserFilterContext
): FilterableGame[] {
  const predicate = buildMatchPredicate(filters, context);
  return games.filter(predicate);
}

/**
 * Determine if a game should show the "Available Elsewhere" badge
 * 
 * @param game - The game to check
 * @param context - User context
 * @returns true if badge should be shown
 */
export function shouldShowElsewhereBadge(
  game: FilterableGame,
  context: UserFilterContext
): boolean {
  const ownedServices = new Set(context.subscriptions.map(s => s.service_code));
  
  // Show badge if there are providers we don't own
  return game.broadcastProviders.some(provider => 
    !ownedServices.has(provider.serviceCode) && !provider.isBlackedOut
  );
}

/**
 * Determine if a game should show the "Nationally Televised" badge
 * 
 * @param game - The game to check
 * @returns true if badge should be shown
 */
export function shouldShowNationalBadge(
  game: FilterableGame
): boolean {
  return game.broadcastProviders.some(provider => provider.isNational);
}

/**
 * Get a human-readable summary of current filters
 * 
 * @param filters - Current filter state
 * @param context - User context
 * @returns Description string
 */
export function getFiltersSummary(
  filters: FiltersV2State,
  context: UserFilterContext
): string {
  const helper = new FiltersHelper(filters, context);
  const parts: string[] = [];

  // Quick View
  if (filters.quickView !== 'custom') {
    const qvMap = {
      'my_teams_my_services': 'My Teams • My Services',
      'my_teams_any_service': 'My Teams • Any Service',
      'all_games_my_services': 'All Games • My Services',
      'all_games_any_service': 'All Games • Any Service',
    };
    parts.push(qvMap[filters.quickView] || filters.quickView);
  } else {
    parts.push('Custom');
  }

  // Sports
  const selectedSports = helper.selectedSports();
  if (selectedSports.size > 0) {
    parts.push(`${selectedSports.size} sport${selectedSports.size === 1 ? '' : 's'}`);
  }

  // Teams
  const effectiveTeams = helper.effectiveTeamIds();
  if (helper.teamScope() === 'MY' && effectiveTeams.size > 0) {
    parts.push(`${effectiveTeams.size} team${effectiveTeams.size === 1 ? '' : 's'}`);
  }

  return parts.join(' • ');
}
