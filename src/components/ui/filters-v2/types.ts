/**
 * FiltersV2 Types - Type definitions for the new filter system
 */

export type QuickView = 'preset1' | 'preset2' | 'preset3' | 'custom';

export type Sport = 'nhl' | 'nba' | 'nfl' | 'mlb';

/**
 * Quick View Presets
 */
export interface QuickViewPreset {
  id: QuickView;
  label: string;
  description: string;
}

/**
 * Working state within the FiltersSheet (before Apply)
 */
export interface FiltersWorkingState {
  quickView: QuickView;
  lastPreset: Exclude<QuickView, 'custom'>;
  selectedSports: Sport[];
  selectedTeams: string[]; // team IDs
  selectedServices: string[]; // service codes
  includeElsewhereInListings: boolean;
  showElsewhereBadges: boolean;
  showNationalBadges: boolean;
}

/**
 * Persisted filter state in the store
 */
export interface FiltersV2State {
  quickView: QuickView;
  lastPreset: Exclude<QuickView, 'custom'>;
  includeElsewhereInListings: boolean;
  showElsewhereBadges: boolean;
  showNationalBadges: boolean;
  // Custom selections (only when quickView === 'custom')
  customSelections?: {
    sports: Sport[];
    teams: string[];
    services: string[];
  };
}

/**
 * Elsewhere nudge tracking
 */
export interface ElsewhereNudgeState {
  dismissed: boolean;
  noOptionsGamesSeen: number;
  lastNoOptionsDate: string | null; // ISO date
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
  teamsCount: number;
  servicesCount: number;
  includeElsewhereInListings: boolean;
  showElsewhereBadges: boolean;
  showNationalBadges: boolean;
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
