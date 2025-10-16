/**
 * Quick View Presets - Authoritative preset definitions and state mapping
 */

import { QuickView, QuickViewPreset, Sport } from './types';
import { Follow, UserSubscription } from '../../../types';

export const QUICK_VIEW_PRESETS: Record<Exclude<QuickView, 'custom'>, QuickViewPreset> = {
  preset1: {
    id: 'preset1',
    label: 'My Teams on My Services',
    description: 'Games I follow, on my subscriptions',
  },
  preset2: {
    id: 'preset2',
    label: 'My Teams on My Services + Elsewhere',
    description: 'My teams, with other legal options',
  },
  preset3: {
    id: 'preset3',
    label: 'All Games (All Sports)',
    description: 'Everything, everywhere',
  },
};

/**
 * Extract unique sports from followed teams
 */
export function getSportsFromFollows(follows: Follow[]): Sport[] {
  const sports = new Set<Sport>();
  follows.forEach(follow => {
    // Assuming follow.league is 'nhl', 'nba', etc.
    const sport = follow.league.toLowerCase() as Sport;
    if (['nhl', 'nba', 'nfl', 'mlb'].includes(sport)) {
      sports.add(sport);
    }
  });
  return Array.from(sports);
}

/**
 * Build state from a preset
 */
export function buildStateFromPreset(
  preset: Exclude<QuickView, 'custom'>,
  follows: Follow[],
  subscriptions: UserSubscription[]
) {
  const followedTeamIds = follows.map(f => f.team_id);
  const ownedServiceCodes = subscriptions.map(s => s.service_code);
  const sportsFromFollows = getSportsFromFollows(follows);

  switch (preset) {
    case 'preset1':
      return {
        selectedTeams: followedTeamIds,
        selectedSports: sportsFromFollows.length > 0 ? sportsFromFollows : ['nhl' as Sport],
        selectedServices: ownedServiceCodes,
        includeElsewhereInListings: false,
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    case 'preset2':
      return {
        selectedTeams: followedTeamIds,
        selectedSports: sportsFromFollows.length > 0 ? sportsFromFollows : ['nhl' as Sport],
        selectedServices: ownedServiceCodes,
        includeElsewhereInListings: true, // Key difference from preset1
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    case 'preset3':
      return {
        selectedTeams: [], // Empty = all teams
        selectedSports: ['nhl', 'nba', 'nfl', 'mlb'] as Sport[],
        selectedServices: [], // Empty = all services
        includeElsewhereInListings: true,
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    default:
      // Fallback to preset1
      return buildStateFromPreset('preset1', follows, subscriptions);
  }
}

/**
 * Detect which preset matches current state (for migration from V1)
 */
export function detectPresetFromState(
  state: {
    selectedTeams: string[];
    selectedSports: Sport[];
    selectedServices: string[];
    includeElsewhereInListings: boolean;
  },
  follows: Follow[],
  subscriptions: UserSubscription[]
): QuickView {
  const followedTeamIds = follows.map(f => f.team_id);
  const ownedServiceCodes = subscriptions.map(s => s.service_code);

  // Check preset3: All Games
  if (
    state.selectedTeams.length === 0 &&
    state.selectedSports.length === 4 &&
    state.selectedServices.length === 0 &&
    state.includeElsewhereInListings
  ) {
    return 'preset3';
  }

  // Check preset2: My Teams + Elsewhere
  if (
    arraysEqual(state.selectedTeams, followedTeamIds) &&
    arraysEqual(state.selectedServices, ownedServiceCodes) &&
    state.includeElsewhereInListings
  ) {
    return 'preset2';
  }

  // Check preset1: My Teams on My Services
  if (
    arraysEqual(state.selectedTeams, followedTeamIds) &&
    arraysEqual(state.selectedServices, ownedServiceCodes) &&
    !state.includeElsewhereInListings
  ) {
    return 'preset1';
  }

  // Doesn't match any preset
  return 'custom';
}

/**
 * Helper: Check if two arrays have the same elements (order doesn't matter)
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}
