/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Helper function to check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return (
    ENV.SUPABASE_URL !== 'https://your-project.supabase.co' &&
    ENV.SUPABASE_ANON_KEY !== 'your-supabase-anon-key'
  );
};
