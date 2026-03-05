import { Platform } from 'react-native';

// Petfinder API - register at https://www.petfinder.com/developers/
export const PETFINDER_API_KEY = process.env.EXPO_PUBLIC_PETFINDER_API_KEY ?? '';
export const PETFINDER_API_SECRET = process.env.EXPO_PUBLIC_PETFINDER_API_SECRET ?? '';
export const PETFINDER_BASE_URL = 'https://api.petfinder.com/v2';

// Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Platform
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
export const IS_WEB = Platform.OS === 'web';
export const IS_DEV = __DEV__;

// Data freshness — auto-sync with Petfinder
export const REFETCH_INTERVAL = 60_000;  // Auto-refresh every 60s
export const STALE_TIME = 30_000;        // Data considered stale after 30s
