/**
 * Global App State Management (Zustand)
 */

import { create } from 'zustand';
import { AppState, User, UserSubscription, Follow, ThemeState } from '../types';
import { ColorMode } from '../styles/tokens';

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
  // Color Mode
  colorMode: ColorMode;
  systemThemeUpdateTrigger: number;
  setColorMode: (mode: ColorMode) => void;
  triggerSystemThemeUpdate: () => void;
  
  // Filters
  filters: GameFilters;
  setFilters: (filters: GameFilters) => void;
  toggleFilter: (filterKey: keyof GameFilters) => void;
  toggleSportFilter: (sport: string) => void;
  toggleTeamFilter: (teamId: string) => void;
  toggleServiceFilter: (serviceCode: string) => void;
  resetFilters: () => void;
  
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

// Default filters
const DEFAULT_FILTERS: GameFilters = {
  sports: ['nhl'], // Default to NHL only
  myTeamsOnly: false, // Don't restrict to teams by default
  selectedTeams: [],
  myServicesOnly: false,
  showAllServices: true, // Display toggle: ON by default to show affiliate opportunities
  selectedServices: [],
  liveOnly: false,
  nationalOnly: false,
  showAll: false,
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

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  filters: DEFAULT_FILTERS,
  colorMode: 'dark', // Default to dark mode
  systemThemeUpdateTrigger: 0,

  setColorMode: (mode) => set({ colorMode: mode }),

  triggerSystemThemeUpdate: () =>
    set((state) => ({ systemThemeUpdateTrigger: state.systemThemeUpdateTrigger + 1 })),

  setFilters: (filters) => set({ filters }),

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
      
      // Toggle boolean filters
      const currentValue = state.filters[filterKey];
      if (typeof currentValue === 'boolean') {
        (newFilters[filterKey] as boolean) = !currentValue;
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

  setSubscriptions: (subscriptions) => set({ subscriptions }),

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

  setFollows: (follows) => set({ follows }),

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
