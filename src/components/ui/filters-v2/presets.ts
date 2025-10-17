/**
 * Quick View Presets - Authoritative preset definitions and state mapping
 * Updated to match SportStream spec (2x2 grid format)
 */

import { QuickView, QuickViewPreset, Sport, TeamsMode, SportMetadata } from './types';
import { Follow, UserSubscription } from '../../../types';

/**
 * Sports Catalog - Complete list with metadata
 */
export const SPORTS_CATALOG: SportMetadata[] = [
  // US Core (enabled)
  { id: 'nhl', name: 'NHL', abbr: 'NHL', sortOrder: 1, visibleInUI: true, enabledForData: true, category: 'us_core' },
  { id: 'nba', name: 'NBA', abbr: 'NBA', sortOrder: 2, visibleInUI: true, enabledForData: true, category: 'us_core' },
  { id: 'nfl', name: 'NFL', abbr: 'NFL', sortOrder: 3, visibleInUI: true, enabledForData: true, category: 'us_core' },
  { id: 'mlb', name: 'MLB', abbr: 'MLB', sortOrder: 4, visibleInUI: true, enabledForData: true, category: 'us_core' },
  
  // US Core (placeholders)
  { id: 'mls', name: 'MLS', abbr: 'MLS', sortOrder: 5, visibleInUI: true, enabledForData: false, category: 'us_core' },
  { id: 'wnba', name: 'WNBA', abbr: 'WNBA', sortOrder: 6, visibleInUI: true, enabledForData: false, category: 'us_core' },
  { id: 'nwsl', name: 'NWSL', abbr: 'NWSL', sortOrder: 7, visibleInUI: true, enabledForData: false, category: 'us_core' },
  { id: 'ncaa_football', name: 'NCAA Football', abbr: 'NCAAF', sortOrder: 8, visibleInUI: true, enabledForData: false, category: 'us_core' },
  { id: 'ncaa_mens_basketball', name: "NCAA Men's Basketball", abbr: 'NCAAM', sortOrder: 9, visibleInUI: true, enabledForData: false, category: 'us_core' },
  { id: 'ncaa_womens_basketball', name: "NCAA Women's Basketball", abbr: 'NCAAW', sortOrder: 10, visibleInUI: true, enabledForData: false, category: 'us_core' },
  
  // Soccer
  { id: 'uefa_champions_league', name: 'UEFA Champions League', abbr: 'UCL', sortOrder: 20, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'uefa_europa_league', name: 'UEFA Europa League', abbr: 'UEL', sortOrder: 21, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'premier_league', name: 'Premier League', abbr: 'EPL', sortOrder: 22, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'la_liga', name: 'La Liga', abbr: 'LIGA', sortOrder: 23, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'serie_a', name: 'Serie A', abbr: 'SA', sortOrder: 24, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'bundesliga', name: 'Bundesliga', abbr: 'BUN', sortOrder: 25, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'ligue_1', name: 'Ligue 1', abbr: 'L1', sortOrder: 26, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'eredivisie', name: 'Eredivisie', abbr: 'ERE', sortOrder: 27, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'copa_libertadores', name: 'Copa Libertadores', abbr: 'LIB', sortOrder: 28, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'concacaf_champions_cup', name: 'CONCACAF Champions Cup', abbr: 'CCL', sortOrder: 29, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'fa_cup', name: 'FA Cup', abbr: 'FAC', sortOrder: 30, visibleInUI: true, enabledForData: false, category: 'soccer' },
  { id: 'efl_cup', name: 'EFL Cup', abbr: 'EFL', sortOrder: 31, visibleInUI: true, enabledForData: false, category: 'soccer' },
  
  // Motorsport
  { id: 'formula_1', name: 'Formula 1', abbr: 'F1', sortOrder: 40, visibleInUI: true, enabledForData: false, category: 'motorsport' },
  { id: 'nascar', name: 'NASCAR', abbr: 'NAS', sortOrder: 41, visibleInUI: true, enabledForData: false, category: 'motorsport' },
  { id: 'indycar', name: 'IndyCar', abbr: 'IND', sortOrder: 42, visibleInUI: true, enabledForData: false, category: 'motorsport' },
  { id: 'motogp', name: 'MotoGP', abbr: 'MGP', sortOrder: 43, visibleInUI: true, enabledForData: false, category: 'motorsport' },
  
  // Combat Sports
  { id: 'ufc', name: 'UFC', abbr: 'UFC', sortOrder: 50, visibleInUI: true, enabledForData: false, category: 'combat' },
  { id: 'pfl', name: 'PFL', abbr: 'PFL', sortOrder: 51, visibleInUI: true, enabledForData: false, category: 'combat' },
  { id: 'bellator', name: 'Bellator', abbr: 'BEL', sortOrder: 52, visibleInUI: true, enabledForData: false, category: 'combat' },
  { id: 'boxing', name: 'Boxing (Pro)', abbr: 'BOX', sortOrder: 53, visibleInUI: true, enabledForData: false, category: 'combat' },
  { id: 'wwe', name: 'WWE', abbr: 'WWE', sortOrder: 54, visibleInUI: true, enabledForData: false, category: 'combat' },
  
  // Cricket
  { id: 'icc_internationals', name: 'ICC Internationals', abbr: 'ICC', sortOrder: 60, visibleInUI: true, enabledForData: false, category: 'cricket' },
  { id: 'ipl', name: 'IPL', abbr: 'IPL', sortOrder: 61, visibleInUI: true, enabledForData: false, category: 'cricket' },
  { id: 'bbl', name: 'BBL', abbr: 'BBL', sortOrder: 62, visibleInUI: true, enabledForData: false, category: 'cricket' },
  { id: 'the_hundred', name: 'The Hundred', abbr: 'HUN', sortOrder: 63, visibleInUI: true, enabledForData: false, category: 'cricket' },
  { id: 'psl', name: 'PSL', abbr: 'PSL', sortOrder: 64, visibleInUI: true, enabledForData: false, category: 'cricket' },
  { id: 'cpl', name: 'CPL', abbr: 'CPL', sortOrder: 65, visibleInUI: true, enabledForData: false, category: 'cricket' },
  
  // Rugby
  { id: 'rugby_union', name: 'Rugby Union (Intl + Six Nations)', abbr: 'RU', sortOrder: 70, visibleInUI: true, enabledForData: false, category: 'rugby' },
  { id: 'rugby_league', name: 'Rugby League', abbr: 'RL', sortOrder: 71, visibleInUI: true, enabledForData: false, category: 'rugby' },
  { id: 'super_rugby', name: 'Super Rugby', abbr: 'SR', sortOrder: 72, visibleInUI: true, enabledForData: false, category: 'rugby' },
  
  // Tennis
  { id: 'atp_tour', name: 'ATP Tour', abbr: 'ATP', sortOrder: 80, visibleInUI: true, enabledForData: false, category: 'tennis' },
  { id: 'wta_tour', name: 'WTA Tour', abbr: 'WTA', sortOrder: 81, visibleInUI: true, enabledForData: false, category: 'tennis' },
  { id: 'grand_slams', name: 'Grand Slams (AO, RG, Wimbledon, US Open)', abbr: 'GS', sortOrder: 82, visibleInUI: true, enabledForData: false, category: 'tennis' },
  { id: 'davis_cup', name: 'Davis Cup', abbr: 'DC', sortOrder: 83, visibleInUI: true, enabledForData: false, category: 'tennis' },
  { id: 'bjk_cup', name: 'BJK Cup', abbr: 'BJK', sortOrder: 84, visibleInUI: true, enabledForData: false, category: 'tennis' },
  
  // Golf
  { id: 'pga_tour', name: 'PGA Tour', abbr: 'PGA', sortOrder: 90, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'lpga', name: 'LPGA', abbr: 'LPGA', sortOrder: 91, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'dp_world_tour', name: 'DP World Tour', abbr: 'DP', sortOrder: 92, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'the_masters', name: 'The Masters', abbr: 'MAST', sortOrder: 93, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'pga_championship', name: 'PGA Championship', abbr: 'PGAC', sortOrder: 94, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'us_open_golf', name: 'US Open (Golf)', abbr: 'USO', sortOrder: 95, visibleInUI: true, enabledForData: false, category: 'golf' },
  { id: 'the_open', name: 'The Open', abbr: 'OPEN', sortOrder: 96, visibleInUI: true, enabledForData: false, category: 'golf' },
  
  // Cycling
  { id: 'tour_de_france', name: 'Tour de France', abbr: 'TDF', sortOrder: 100, visibleInUI: true, enabledForData: false, category: 'cycling' },
  { id: 'giro_italia', name: "Giro d'Italia", abbr: 'GIRO', sortOrder: 101, visibleInUI: true, enabledForData: false, category: 'cycling' },
  { id: 'vuelta_espana', name: 'Vuelta a España', abbr: 'VUEL', sortOrder: 102, visibleInUI: true, enabledForData: false, category: 'cycling' },
  
  // Basketball (global)
  { id: 'euroleague', name: 'EuroLeague', abbr: 'EL', sortOrder: 110, visibleInUI: true, enabledForData: false, category: 'other' },
  { id: 'fiba_internationals', name: 'FIBA Internationals', abbr: 'FIBA', sortOrder: 111, visibleInUI: true, enabledForData: false, category: 'other' },
  
  // Hockey (global)
  { id: 'ahl', name: 'AHL', abbr: 'AHL', sortOrder: 120, visibleInUI: true, enabledForData: false, category: 'other' },
  { id: 'khl', name: 'KHL', abbr: 'KHL', sortOrder: 121, visibleInUI: true, enabledForData: false, category: 'other' },
  { id: 'iihf_internationals', name: 'IIHF Internationals', abbr: 'IIHF', sortOrder: 122, visibleInUI: true, enabledForData: false, category: 'other' },
  
  // Other
  { id: 'olympics_summer', name: 'Olympics (Summer)', abbr: 'OLY-S', sortOrder: 130, visibleInUI: true, enabledForData: false, category: 'other' },
  { id: 'olympics_winter', name: 'Olympics (Winter)', abbr: 'OLY-W', sortOrder: 131, visibleInUI: true, enabledForData: false, category: 'other' },
  { id: 'xfl_ufl', name: 'XFL/UFL', abbr: 'XFL', sortOrder: 132, visibleInUI: true, enabledForData: false, category: 'other' },
];

/**
 * Quick View Presets - 2x2 Grid
 */
export const QUICK_VIEW_PRESETS: Record<Exclude<QuickView, 'custom'>, QuickViewPreset> = {
  my_teams_my_services: {
    id: 'my_teams_my_services',
    line1: 'MY TEAMS',
    line2: 'ON',
    line3: 'MY SERVICES',
    description: 'Games I follow, watchable on my subscriptions',
  },
  my_teams_any_service: {
    id: 'my_teams_any_service',
    line1: 'MY TEAMS',
    line2: 'ON',
    line3: 'ANY SERVICE',
    description: 'My teams, all legal options',
  },
  all_games_my_services: {
    id: 'all_games_my_services',
    line1: 'ALL GAMES',
    line2: 'ON',
    line3: 'MY SERVICES',
    description: "Everything I can watch on what I've got",
  },
  all_games_any_service: {
    id: 'all_games_any_service',
    line1: 'ALL GAMES',
    line2: 'ON',
    line3: 'ANY SERVICE',
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
    // Only include if it's in our catalog
    if (SPORTS_CATALOG.find(s => s.id === sport)) {
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
    case 'my_teams_my_services':
      return {
        teamsMode: 'followed' as TeamsMode,
        selectedTeams: [], // Empty in followed mode = use all followed
        excludedTeams: [], // No excludes
        selectedSports: sportsFromFollows.length > 0 ? sportsFromFollows : ['nhl' as Sport],
        selectedServices: ownedServiceCodes,
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    case 'my_teams_any_service':
      return {
        teamsMode: 'followed' as TeamsMode,
        selectedTeams: [], // Empty in followed mode = use all followed
        excludedTeams: [],
        selectedSports: sportsFromFollows.length > 0 ? sportsFromFollows : ['nhl' as Sport],
        selectedServices: [], // Empty = any service
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    case 'all_games_my_services':
      return {
        teamsMode: 'pick_specific' as TeamsMode,
        selectedTeams: [], // Empty in pick_specific = all teams
        excludedTeams: [],
        selectedSports: [], // Empty = all sports
        selectedServices: ownedServiceCodes,
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    case 'all_games_any_service':
      return {
        teamsMode: 'pick_specific' as TeamsMode,
        selectedTeams: [], // Empty in pick_specific = all teams
        excludedTeams: [],
        selectedSports: [], // Empty = all sports
        selectedServices: [], // Empty = any service
        showElsewhereBadges: true,
        showNationalBadges: true,
      };

    default:
      // Fallback to default
      return buildStateFromPreset('my_teams_my_services', follows, subscriptions);
  }
}

/**
 * Detect which preset matches current state
 */
export function detectPresetFromState(
  state: {
    teamsMode: TeamsMode;
    selectedTeams: string[];
    excludedTeams: string[];
    selectedSports: Sport[];
    selectedServices: string[];
  },
  follows: Follow[],
  subscriptions: UserSubscription[]
): QuickView {
  const followedTeamIds = follows.map(f => f.team_id);
  const ownedServiceCodes = subscriptions.map(s => s.service_code);
  const sportsFromFollows = getSportsFromFollows(follows);

  // Check all_games_any_service: pick_specific mode, no teams, no sports, no services
  if (
    state.teamsMode === 'pick_specific' &&
    state.selectedTeams.length === 0 &&
    state.selectedSports.length === 0 &&
    state.selectedServices.length === 0
  ) {
    return 'all_games_any_service';
  }

  // Check all_games_my_services: pick_specific mode, no teams, no sports, has owned services
  if (
    state.teamsMode === 'pick_specific' &&
    state.selectedTeams.length === 0 &&
    state.selectedSports.length === 0 &&
    arraysEqual(state.selectedServices, ownedServiceCodes)
  ) {
    return 'all_games_my_services';
  }

  // Check my_teams_any_service: followed mode, no excludes, sports match follows, no services
  if (
    state.teamsMode === 'followed' &&
    state.selectedTeams.length === 0 &&
    state.excludedTeams.length === 0 &&
    arraysEqual(state.selectedSports, sportsFromFollows) &&
    state.selectedServices.length === 0
  ) {
    return 'my_teams_any_service';
  }

  // Check my_teams_my_services: followed mode, no excludes, sports match follows, has owned services
  if (
    state.teamsMode === 'followed' &&
    state.selectedTeams.length === 0 &&
    state.excludedTeams.length === 0 &&
    arraysEqual(state.selectedSports, sportsFromFollows) &&
    arraysEqual(state.selectedServices, ownedServiceCodes)
  ) {
    return 'my_teams_my_services';
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
