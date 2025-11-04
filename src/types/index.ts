/**
 * TypeScript Type Definitions for WhereBall
 */

// ============================================================================
// Database Types (matches Supabase schema)
// ============================================================================

export interface User {
  id: string;
  email: string;
  created_at: string;
  zip: string | null;
  platform: 'ios' | 'android' | null;
  marketing_opt_in: boolean;
  revenuecat_user_id: string | null;
}

export interface UserSubscription {
  user_id: string;
  service_code: string;
  created_at: string;
}

export interface Team {
  id: string;
  league: 'NHL' | 'NBA' | 'MLB' | 'NCAA';
  name: string;
  mascot: string; // Team mascot name only (e.g., "Kings", "Bruins", "Cowboys")
  market: string;
  short_code: string;
  rsn_strings: string[];
  primary_colors: TeamColors | null;
  secondary_colors: TeamColors | null;
  logo_url: string | null;
}

export interface TeamColors {
  light: string;
  dark: string;
}

export interface Game {
  id: string;
  league: 'NHL' | 'NBA' | 'MLB' | 'NCAA';
  start_ts: string;
  home_team_id: string;
  away_team_id: string;
  venue: string | null;
  broadcasters: GameBroadcasters;
  national: boolean;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
}

export interface GameBroadcasters {
  national: string[];
  rsn: string[];
}

export interface Service {
  code: string;
  name: string;
  type: 'streaming' | 'cable' | 'satellite';
  deep_link_scheme: string | null;
  channel_matrix: ChannelMatrix;
  provider_lookup_url: string | null;
}

export interface ChannelMatrix {
  channels: string[];
  notes?: string;
}

export interface Follow {
  user_id: string;
  team_id: string;
  league: 'NHL' | 'NBA' | 'MLB' | 'NCAA';
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  game_id: string;
  type: 'game_start' | 'national_flip' | 'score_updates';
  scheduled_ts: string;
  sent_ts: string | null;
  status: 'pending' | 'sent' | 'failed';
}

export interface ConciergeUsage {
  user_id: string;
  date: string;
  messages_count: number;
  tokens_est: number;
  upsell_shown_count: number;
}

export interface ConciergeMemory {
  user_id: string;
  running_summary: string | null;
  banter_tone_ok: boolean;
  last_successful_watch: LastSuccessfulWatch | null;
  theme_prefs: ThemePreferences | null;
  updated_at: string;
}

export interface LastSuccessfulWatch {
  game_id: string;
  service_code: string;
  timestamp: string;
}

export interface ThemePreferences {
  auto_context_enabled: boolean;
  selections: Record<string, string>; // league/team -> theme_id
  custom_overrides: Record<string, TeamColors>;
}

export interface BlackoutReport {
  id: string;
  user_id: string | null;
  game_id: string;
  zip: string;
  reported_status: 'incorrect_blackout' | 'incorrect_available' | 'other';
  user_comment: string | null;
  created_at: string;
  resolved: boolean;
}

// ============================================================================
// App State Types
// ============================================================================

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  subscriptions: UserSubscription[];
  follows: Follow[];
  preferredServices: string[]; // Service codes user marks as "favorites"
  theme: ThemeState;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  safeAccent: string;
  currentContext: {
    league?: string;
    teamId?: string;
  } | null;
}

// ============================================================================
// Blackout Logic Types
// ============================================================================

export interface BlackoutResult {
  isBlackedOut: boolean;
  confidence: 'likely' | 'possible' | 'unlikely';
  reason: string;
  affectedServices: string[];
  alternatives: BlackoutAlternative[];
}

export interface BlackoutAlternative {
  service_code: string;
  service_name: string;
  channel: string;
  isAffiliate: boolean;
  affiliateUrl?: string;
}

// ============================================================================
// Watch Route Types
// ============================================================================

export interface WatchRoute {
  service_code: string;
  service_name: string;
  channel: string;
  deep_link: string | null;
  userHasAccess: boolean;
  isNational: boolean;
  isRSN: boolean;
}

export interface GameWithRoutes {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  watchRoutes: WatchRoute[];
  blackoutInfo: BlackoutResult | null;
  userCanWatch: boolean;
}

// ============================================================================
// AI Concierge Types
// ============================================================================

export interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokenEstimate?: number;
}

export interface ConciergeContext {
  userProfile: {
    zip: string | null;
    subscriptions: string[];
    followedTeams: string[];
    isPremium: boolean;
  };
  runningSummary: string | null;
  recentTurns: ConciergeMessage[];
  factPack: {
    todayGames: GameWithRoutes[];
  };
}

export interface ConciergeResponse {
  message: string;
  tokenEstimate: number;
  showUpsell: boolean;
  upsellMessage?: string;
}

// ============================================================================
// Subscription Types (RevenueCat)
// ============================================================================

export interface SubscriptionPackage {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
}

export interface SubscriptionStatus {
  isPremium: boolean;
  plan: 'free' | 'monthly' | 'annual' | null;
  expirationDate: string | null;
  willRenew: boolean;
}

// ============================================================================
// Analytics Event Types
// ============================================================================

export type AnalyticsEvent =
  | { name: 'onboarding_start' }
  | { name: 'onboarding_complete'; properties: { zip_present: boolean; services_count: number; teams_selected: number } }
  | { name: 'tonight_viewed'; properties: { games_count: number } }
  | { name: 'game_viewed'; properties: { game_id: string; home_team: string; away_team: string } }
  | { name: 'watch_now_clicked'; properties: { service_code: string; game_id: string } }
  | { name: 'paywall_viewed'; properties: { placement: string; variant: string } }
  | { name: 'subscribe_success'; properties: { plan: 'monthly' | 'annual' } }
  | { name: 'concierge_msg'; properties: { token_estimate: number; league?: string; team_id?: string } }
  | { name: 'theme_changed'; properties: { scope: 'global' | 'sport' | 'team'; auto_context_on: boolean } };

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
  GameDetails: { gameId: string };
  Paywall: { placement: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Tonight: undefined;
  Concierge: undefined;
  Settings: undefined;
};
