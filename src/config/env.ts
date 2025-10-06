/**
 * Environment Configuration
 * 
 * TODO: Before running the app, you need to:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Copy your Supabase URL and anon key
 * 3. Create a RevenueCat account at https://www.revenuecat.com
 * 4. Copy your RevenueCat API key
 * 5. Set up PostHog at https://posthog.com
 * 6. Get Grok API access at https://x.ai
 * 
 * For development, replace the placeholders below with your actual keys.
 * For production, use environment variables or secure secret management.
 */

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: 'https://jmyqhkxdhxawvwbixpay.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteXFoa3hkaHhhd3Z3Yml4cGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTU1MDQsImV4cCI6MjA3NTI5MTUwNH0.630_DHt0ffatA979XopSWLusIYCzySJcPe4cjbUauKg',
  
  // RevenueCat Configuration
  // TODO: Complete RevenueCat setup once you have:
  // 1. Apple Developer account ($99/year) for iOS
  // 2. Google Play Developer account ($25 one-time) for Android
  // For now, we'll build the IAP flow to be ready when you add these.
  REVENUECAT_API_KEY: {
    ios: 'REVENUECAT_IOS_KEY_PENDING', // Set after App Store Connect setup
    android: 'REVENUECAT_ANDROID_KEY_PENDING', // Set after Play Console setup
  },
  
  // PostHog Configuration
  POSTHOG_API_KEY: 'phc_nqY4Ey9dCBnuBP4afiYMXXm1NRGdW6fRK2YzN2kgL7M',
  POSTHOG_HOST: 'https://us.i.posthog.com',
  
  // AI Configuration (Grok-4 Fast Reasoning)
  GROK_API_KEY: 'xai-XV46KDsOZZu8MkPD9rsk9OlYi598qpoQ08LTW0QqTQOEVWY4sQOTpIRDC6kpRtwTGSVEcj0h8370i4Je',
  GROK_API_URL: 'https://api.x.ai/v1/chat/completions',
  
  // Feature Flags (defaults, will be overridden by PostHog)
  FEATURES: {
    CONCIERGE_ENABLED: true,
    ADS_ENABLED: false, // Enable once AdMob is configured
    SPORTSBOOK_ENABLED: false,
    NBA_ENABLED: false, // NHL only for MVP
    THEME_AUTO_CONTEXT: true,
  },
  
  // App Configuration
  APP_VERSION: '1.0.0',
  API_TIMEOUT: 10000,
  
  // Subscription Product IDs (set these in RevenueCat dashboard)
  SUBSCRIPTION_PRODUCTS: {
    MONTHLY: 'whereball_premium_monthly',
    ANNUAL: 'whereball_premium_annual',
  },
  
  // External URLs
  PRIVACY_POLICY_URL: 'https://whereball.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://whereball.com/terms',
  SUPPORT_URL: 'https://whereball.com/support',
};

// Development mode flag
export const IS_DEV = __DEV__;

// Platform detection
import { Platform } from 'react-native';
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
