/**
 * Authentication Helper (Supabase)
 */

import { supabase } from './supabase';
import { identifyUser, resetAnalytics } from './analytics';
import { useAppStore } from '../store/appStore';

/**
 * Sign in with email
 */
export const signInWithEmail = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Apple
 */
export const signInWithApple = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign out
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    useAppStore.getState().reset();
    resetAnalytics();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      // Identify user in analytics
      identifyUser(user.id, {
        email: user.email,
        created_at: user.created_at,
      });
    }
    
    return { user };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
};
