/**
 * FiltersV2 Types - Type definitions for the new filter system
 * Updated to match SportStream spec
 */

// Quick View IDs now match the 2x2 grid format
export type QuickView = 
  | 'my_teams_my_services'     // MY TEAMS / ON / MY SERVICES (default)
  | 'my_teams_any_service'     // MY TEAMS / ON / ANY SERVICE
  | 'all_games_my_services'    // ALL GAMES / ON / MY SERVICES
  | 'all_games_any_service'    // ALL GAMES / ON / ANY SERVICE
  | 'custom';

// Expanded sport list for MVP + placeholders
export type Sport = 
  // US Core (enabled)
  | 'nhl' | 'nba' | 'nfl' | 'mlb' 
  // US Core (placeholders)
  | 'mls' | 'wnba' | 'nwsl' | 'ncaa_football' | 'ncaa_mens_basketball' | 'ncaa_womens_basketball'
  // Soccer (placeholders)
  | 'uefa_champions_league' | 'uefa_europa_league' | 'premier_league' | 'la_liga' 
  | 'serie_a' | 'bundesliga' | 'ligue_1' | 'eredivisie' | 'copa_libertadores'
  | 'concacaf_champions_cup' | 'fa_cup' | 'efl_cup'
  // Motorsport (placeholders)
  | 'formula_1' | 'nascar' | 'indycar' | 'motogp'
  // Fight/Strength (placeholders)
  | 'ufc' | 'pfl' | 'bellator' | 'boxing' | 'wwe'
  // Cricket (placeholders)
  | 'icc_internationals' | 'ipl' | 'bbl' | 'the_hundred' | 'psl' | 'cpl'
  // Rugby (placeholders)
  | 'rugby_union' | 'rugby_league' | 'super_rugby'
  // Tennis (placeholders)
  | 'atp_tour' | 'wta_tour' | 'grand_slams' | 'davis_cup' | 'bjk_cup'
  // Golf (placeholders)
  | 'pga_tour' | 'lpga' | 'dp_world_tour' | 'the_masters' | 'pga_championship' | 'us_open_golf' | 'the_open'
  // Cycling (placeholders)
  | 'tour_de_france' | 'giro_italia' | 'vuelta_espana'
  // Basketball global (placeholders)
  | 'euroleague' | 'fiba_internationals'
  // Hockey global (placeholders)
  | 'ahl' | 'khl' | 'iihf_internationals'
  // Other (placeholders)
  | 'olympics_summer' | 'olympics_winter' | 'xfl_ufl';

export interface SportMetadata {
  id: Sport;
  name: string;
  abbr: string;
  iconKey?: string;
  sortOrder: number;
  visibleInUI: boolean;
  enabledForData: boolean; // false for placeholders
  category: 'us_core' | 'soccer' | 'motorsport' | 'combat' | 'cricket' | 'rugby' | 'tennis' | 'golf' | 'cycling' | 'other';
}

/**
 * Quick View Preset definition
 */
export interface QuickViewPreset {
  id: Exclude<QuickView, 'custom'>;
  line1: string; // "MY TEAMS" or "ALL GAMES"
  line2: string; // "ON"
  line3: string; // "MY SERVICES" or "ANY SERVICE"
  description?: string; // Optional helper text
}

/**
 * Working state within the FiltersSheet (before Apply)
 */
export interface FiltersWorkingState {
  quickView: QuickView;
  lastPreset: Exclude<QuickView, 'custom'>;
  
  // Teams - just an array of selected team IDs (checked in filter)
  selectedTeams: string[];
  
  // Sports & Services
  selectedSports: Sport[];
  selectedServices: string[]; // service codes
}

/**
 * Persisted filter state in the store
 */
export interface FiltersV2State {
  quickView: QuickView;
  lastPreset: Exclude<QuickView, 'custom'>;
  
  // Custom selections (only when quickView === 'custom')
  customSelections?: {
    sports: Sport[];
    teams: string[]; // Team IDs to include in filter
    services: string[];
  };
}

/**
 * Team data structure
 */
export interface Team {
  id: string;
  sportId: Sport;
  name: string;
  shortName: string;
  abbreviation: string;
  market: string;
  isFollowed: boolean; // derived from user's follows
}

/**
 * Service data structure
 */
export interface Service {
  id: string;
  code: string;
  name: string;
  brandColor?: string;
  isOwned: boolean; // derived from user's subscriptions
}

/**
 * Analytics event payloads
 */
export interface FiltersApplyEvent {
  quickView: QuickView;
  sportsCount: number;
  teamsCountEffective: number;
  servicesOwnedCount: number;
  changedKeys: string[];
}

export interface TeamFollowToggleEvent {
  teamId: string;
  newState: boolean;
}

export interface ServiceOwnershipToggleEvent {
  serviceId: string;
  newState: boolean;
}

/**
 * Elsewhere nudge state (for no-options scenarios)
 */
export interface ElsewhereNudgeState {
  dismissed: boolean;
  noOptionsGamesSeen: number;
  lastNoOptionsDate: string | null;
}
