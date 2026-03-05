import { create } from 'zustand';
import type { User, FavoritePet, SearchFilters, ColorMode } from '../types';
import { DEFAULT_FILTERS } from '../types';

interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;

  // Search
  filters: SearchFilters;
  setFilters: (f: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  // Favorites (local cache — synced to Supabase)
  favorites: FavoritePet[];
  setFavorites: (f: FavoritePet[]) => void;
  addFavorite: (f: FavoritePet) => void;
  removeFavorite: (petId: number) => void;
  isFavorite: (petId: number) => boolean;

  // Theme
  colorMode: ColorMode;
  setColorMode: (m: ColorMode) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Search
  filters: { ...DEFAULT_FILTERS },
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // Favorites
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),
  addFavorite: (fav) =>
    set((s) => ({ favorites: [...s.favorites, fav] })),
  removeFavorite: (petId) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.pet_id !== petId) })),
  isFavorite: (petId) => get().favorites.some((f) => f.pet_id === petId),

  // Theme
  colorMode: 'dark',
  setColorMode: (colorMode) => set({ colorMode }),

  // Reset
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      filters: { ...DEFAULT_FILTERS },
      favorites: [],
      colorMode: 'dark',
    }),
}));
