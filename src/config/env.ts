import { Platform } from 'react-native';

// RescueGroups.org API v5 (primary)
// Get your free key at: https://rescuegroups.org/services/request-an-api-key/
// When no key is set, falls back to Austin Animal Center open data (no key needed)
export const PETFINDER_API_KEY = process.env.EXPO_PUBLIC_RESCUEGROUPS_API_KEY ?? '';
export const PETFINDER_BASE_URL = 'https://api.rescuegroups.org/v5';

// Supabase (optional — for user accounts)
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Platform
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
export const IS_WEB = Platform.OS === 'web';
export const IS_DEV = __DEV__;

// Data freshness — auto-sync
export const REFETCH_INTERVAL = 60_000;
export const STALE_TIME = 30_000;
