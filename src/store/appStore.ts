/**
 * Global App State Management (Zustand)
 */

import { create } from 'zustand';
import { AppState, User, UserSubscription, Follow, ThemeState } from '../types';

interface AppStore extends AppState {
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

// Default theme (light mode, neutral colors)
const DEFAULT_THEME: ThemeState = {
  mode: 'light',
  primary: '#0066CC',
  accent: '#FF6B35',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  safeAccent: '#0052A3',
  currentContext: null,
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
