/**
 * Global App State Management (Zustand)
 */

import { create } from 'zustand';
import { AppState, User, UserSubscription, Follow, ThemeState, Alert } from '../types';
import { ColorMode } from '../styles/tokens';
import { FiltersV2State, ElsewhereNudgeState } from '../components/ui/filters-v2/types';

export interface GameFilters {
  // Sport filtering
  sports: string[]; // ['nhl', 'nba', 'nfl', 'mlb', 'ncaaf']
  
  // Team filtering
  myTeamsOnly: boolean;
  selectedTeams: string[]; // Team IDs
  
  // Service filtering
  myServicesOnly: boolean;
  showAllServices: boolean; // Discovery mode
  selectedServices: string[]; // Service codes
  
  // Game state
  liveOnly: boolean;
  nationalOnly: boolean;
  
  // Override
  showAll: boolean;
}

interface AppStore extends AppState {
  // Alerts (Reminders & Score Notifications)
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (gameId: string, offsetMinutes: number) => void;
  removeAlertsForGame: (gameId: string) => void;
  hasReminders: (gameId: string) => boolean;
  addScoreAlert: (gameId: string) => void;
  removeScoreAlertsForGame: (gameId: string) => void;
  hasScoreNotifications: (gameId: string) => boolean;
  
  // Color Mode
  colorMode: ColorMode;
  systemThemeUpdateTrigger: number;
  setColorMode: (mode: ColorMode) => void;
  triggerSystemThemeUpdate: () => void;
  
  // Filters (Legacy)
  filters: GameFilters;
  setFilters: (filters: GameFilters) => void;
  toggleFilter: (filterKey: keyof GameFilters) => void;
  toggleSportFilter: (sport: string) => void;
  toggleTeamFilter: (teamId: string) => void;
  toggleServiceFilter: (serviceCode: string) => void;
  resetFilters: () => void;
  
  // FiltersV2 (New - Backward Compatible)
  filtersV2: FiltersV2State;
  setFiltersV2: (state: FiltersV2State) => void;
  elsewhereNudge: ElsewhereNudgeState;
  setElsewhereNudge: (state: Partial<ElsewhereNudgeState>) => void;
  incrementNoOptionsGamesSeen: () => void;
  
  // DailyV2 Expansion State
  expandedGameIdBySport: Record<string, string | null>;
  setExpandedGameId: (sport: string, gameId: string | null) => void;
  
  // Phase 4: Dropdown Session State
  hiddenTeamsInMyTeams: string[]; // Team IDs hidden via dropdown (session only)
  exploreSelections: string[]; // Team IDs selected in Explore (session only)
  toggleTeamVisibilityInMyTeams: (teamId: string) => void;
  addToExplore: (teamId: string) => void;
  removeFromExplore: (teamId: string) => void;
  clearExploreSelections: () => void;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setPremium: (isPremium: boolean) => void;
  setSubscriptions: (subscriptions: UserSubscription[]) => void;
  addSubscription: (subscription: UserSubscription) => void;
  removeSubscription: (serviceCode: string) => void;
  setFollows: (follows: Follow[]) => void;
  addFollow: (follow: Follow) => void;
  removeFollow: (teamId: string) => void;
  setPreferredServices: (services: string[]) => void;
  togglePreferredService: (serviceCode: string) => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  setThemeContext: (league?: string, teamId?: string) => void;
  reset: () => void;
}

// Default theme (dark mode, electric cyan)
const DEFAULT_THEME: ThemeState = {
  mode: 'dark',
  primary: '#00E5FF',
  accent: '#22D1EE',
  background: '#0B0D12',
  surface: '#11151C',
  text: '#E6EAF2',
  safeAccent: '#00B8CC',
  currentContext: null,
};

// Default filters (Legacy)
const DEFAULT_FILTERS: GameFilters = {
  sports: ['nhl'], // Default to NHL only
  myTeamsOnly: true, // Default ON: Show followed teams' games (that's why they followed them!)
  selectedTeams: [],
  myServicesOnly: true, // Default ON: Show only watchable games (much more intuitive!)
  showAllServices: true, // Display toggle: ON by default to show affiliate opportunities
  selectedServices: [],
  liveOnly: false,
  nationalOnly: false,
  showAll: false,
};

// Default FiltersV2 state (updated to new preset IDs)
const DEFAULT_FILTERS_V2: FiltersV2State = {
  quickView: 'my_teams_my_services',
  lastPreset: 'my_teams_my_services',
  customSelections: undefined,
};

// Default Elsewhere Nudge state
const DEFAULT_ELSEWHERE_NUDGE: ElsewhereNudgeState = {
  dismissed: false,
  noOptionsGamesSeen: 0,
  lastNoOptionsDate: null,
};

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isPremium: false,
  subscriptions: [],
  follows: [],
  preferredServices: [], // Service codes user marks as "favorites"
  theme: DEFAULT_THEME,
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  alerts: [],
  filters: DEFAULT_FILTERS,
  filtersV2: DEFAULT_FILTERS_V2,
  elsewhereNudge: DEFAULT_ELSEWHERE_NUDGE,
  colorMode: 'dark', // Default to dark mode
  systemThemeUpdateTrigger: 0,
  expandedGameIdBySport: {},
  hiddenTeamsInMyTeams: [],
  exploreSelections: [],
  
  // Alert actions
  setAlerts: (alerts) => set({ alerts }),
  
  addAlert: (gameId, offsetMinutes) =>
    set((state) => {
      // TODO: In real implementation, get game from API and calculate scheduled_ts
      // For now, create a placeholder alert
      const newAlert: Alert = {
        id: `${gameId}-${offsetMinutes}-${Date.now()}`,
        user_id: state.user?.id || 'temp-user',
        game_id: gameId,
        type: 'game_start',
        scheduled_ts: new Date(Date.now() + offsetMinutes * 60000).toISOString(),
        sent_ts: null,
        status: 'pending',
      };
      return { alerts: [...state.alerts, newAlert] };
    }),
  
  removeAlertsForGame: (gameId) =>
    set((state) => ({
      alerts: state.alerts.filter(
        alert => !(alert.game_id === gameId && alert.type === 'game_start')
      ),
    })),
  
  hasReminders: (gameId) => {
    const alerts = get().alerts;
    return alerts.some(
      alert => alert.game_id === gameId && alert.type === 'game_start' && alert.status === 'pending'
    );
  },
  
  addScoreAlert: (gameId) =>
    set((state) => {
      // Create score updates alert
      const newAlert: Alert = {
        id: `${gameId}-score-${Date.now()}`,
        user_id: state.user?.id || 'temp-user',
        game_id: gameId,
        type: 'score_updates',
        scheduled_ts: new Date().toISOString(), // Score updates don't need a specific time
        sent_ts: null,
        status: 'pending',
      };
      return { alerts: [...state.alerts, newAlert] };
    }),
  
  removeScoreAlertsForGame: (gameId) =>
    set((state) => ({
      alerts: state.alerts.filter(
        alert => !(alert.game_id === gameId && alert.type === 'score_updates')
      ),
    })),
  
  hasScoreNotifications: (gameId) => {
    const alerts = get().alerts;
    return alerts.some(
      alert => alert.game_id === gameId && alert.type === 'score_updates' && alert.status === 'pending'
    );
  },

  setColorMode: (mode) => set({ colorMode: mode }),

  triggerSystemThemeUpdate: () =>
    set((state) => ({ systemThemeUpdateTrigger: state.systemThemeUpdateTrigger + 1 })),

  setExpandedGameId: (sport, gameId) =>
    set((state) => ({
      expandedGameIdBySport: {
        ...state.expandedGameIdBySport,
        [sport]: gameId,
      },
    })),
  
  // Phase 4: Dropdown Session State Actions
  toggleTeamVisibilityInMyTeams: (teamId) =>
    set((state) => ({
      hiddenTeamsInMyTeams: state.hiddenTeamsInMyTeams.includes(teamId)
        ? state.hiddenTeamsInMyTeams.filter(id => id !== teamId)
        : [...state.hiddenTeamsInMyTeams, teamId],
    })),
  
  addToExplore: (teamId) =>
    set((state) => ({
      exploreSelections: state.exploreSelections.includes(teamId)
        ? state.exploreSelections
        : [...state.exploreSelections, teamId],
    })),
  
  removeFromExplore: (teamId) =>
    set((state) => ({
      exploreSelections: state.exploreSelections.filter(id => id !== teamId),
    })),
  
  clearExploreSelections: () => set({ exploreSelections: [] }),

  setFilters: (filters) => set({ filters }),
  
  // FiltersV2 actions
  setFiltersV2: (filtersV2) => set({ filtersV2 }),
  
  setElsewhereNudge: (nudge) =>
    set((state) => ({
      elsewhereNudge: { ...state.elsewhereNudge, ...nudge },
    })),
  
  incrementNoOptionsGamesSeen: () =>
    set((state) => ({
      elsewhereNudge: {
        ...state.elsewhereNudge,
        noOptionsGamesSeen: state.elsewhereNudge.noOptionsGamesSeen + 1,
        lastNoOptionsDate: new Date().toISOString().split('T')[0],
      },
    })),

  toggleFilter: (filterKey) =>
    set((state) => {
      const newFilters = { ...state.filters };
      
      // If toggling "Show All", turn off others
      if (filterKey === 'showAll' && !state.filters.showAll) {
        return {
          filters: {
            ...DEFAULT_FILTERS,
            showAll: true,
          },
        };
      }
      
      // If toggling any other filter while "Show All" is on, turn off "Show All"
      if (state.filters.showAll && filterKey !== 'showAll') {
        newFilters.showAll = false;
      }
      
      // Special handling for myTeamsOnly toggle
      if (filterKey === 'myTeamsOnly') {
        const willBeOn = !state.filters.myTeamsOnly;
        newFilters.myTeamsOnly = willBeOn;
        
        // If turning ON myTeamsOnly, auto-select all followed teams
        if (willBeOn) {
          newFilters.selectedTeams = state.follows.map(f => f.team_id);
        }
        // If turning OFF myTeamsOnly, clear selected teams
        else {
          newFilters.selectedTeams = [];
        }
      }
      // Special handling for myServicesOnly toggle
      else if (filterKey === 'myServicesOnly') {
        const willBeOn = !state.filters.myServicesOnly;
        newFilters.myServicesOnly = willBeOn;
        
        // If turning ON myServicesOnly, auto-select all subscribed services
        if (willBeOn) {
          newFilters.selectedServices = state.subscriptions.map(s => s.service_code);
        }
        // If turning OFF myServicesOnly, clear selected services
        else {
          newFilters.selectedServices = [];
        }
      }
      // Toggle other boolean filters
      else {
        const currentValue = state.filters[filterKey];
        if (typeof currentValue === 'boolean') {
          (newFilters[filterKey] as boolean) = !currentValue;
        }
      }
      
      return { filters: newFilters };
    }),

  toggleSportFilter: (sport: string) =>
    set((state) => {
      const sports = state.filters.sports.includes(sport)
        ? state.filters.sports.filter(s => s !== sport)
        : [...state.filters.sports, sport];
      return { filters: { ...state.filters, sports } };
    }),

  toggleTeamFilter: (teamId: string) =>
    set((state) => {
      const selectedTeams = state.filters.selectedTeams.includes(teamId)
        ? state.filters.selectedTeams.filter(t => t !== teamId)
        : [...state.filters.selectedTeams, teamId];
      return { filters: { ...state.filters, selectedTeams } };
    }),

  toggleServiceFilter: (serviceCode: string) =>
    set((state) => {
      const selectedServices = state.filters.selectedServices.includes(serviceCode)
        ? state.filters.selectedServices.filter(s => s !== serviceCode)
        : [...state.filters.selectedServices, serviceCode];
      return { filters: { ...state.filters, selectedServices } };
    }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setUser: (user) => set({ user }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setPremium: (isPremium) => set({ isPremium }),

  setSubscriptions: (subscriptions) => 
    set((state) => {
      // If myServicesOnly is on, auto-select all new subscriptions in the filter
      if (state.filters.myServicesOnly) {
        const newServiceCodes = subscriptions.map(s => s.service_code);
        return {
          subscriptions,
          filters: {
            ...state.filters,
            selectedServices: newServiceCodes,
          },
        };
      }
      return { subscriptions };
    }),

  addSubscription: (subscription) =>
    set((state) => ({
      subscriptions: [...state.subscriptions, subscription],
    })),

  removeSubscription: (serviceCode) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter(
        (sub) => sub.service_code !== serviceCode
      ),
    })),

  setFollows: (follows) => 
    set((state) => {
      // If myTeamsOnly is on, auto-select all followed teams in the filter
      if (state.filters.myTeamsOnly) {
        const newTeamIds = follows.map(f => f.team_id);
        return {
          follows,
          filters: {
            ...state.filters,
            selectedTeams: newTeamIds,
          },
        };
      }
      return { follows };
    }),

  addFollow: (follow) =>
    set((state) => ({
      follows: [...state.follows, follow],
    })),

  removeFollow: (teamId) =>
    set((state) => ({
      follows: state.follows.filter((f) => f.team_id !== teamId),
    })),

  setPreferredServices: (services) => set({ preferredServices: services }),

  togglePreferredService: (serviceCode) =>
    set((state) => ({
      preferredServices: state.preferredServices.includes(serviceCode)
        ? state.preferredServices.filter((s) => s !== serviceCode)
        : [...state.preferredServices, serviceCode],
    })),

  setTheme: (theme) =>
    set((state) => ({
      theme: { ...state.theme, ...theme },
    })),

  setThemeContext: (league, teamId) =>
    set((state) => ({
      theme: {
        ...state.theme,
        currentContext: league || teamId ? { league, teamId } : null,
      },
    })),

  reset: () => set(initialState),
}));
