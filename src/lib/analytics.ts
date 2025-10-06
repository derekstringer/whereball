/**
 * Analytics Wrapper (PostHog)
 */

import PostHog from 'posthog-react-native';
import { ENV } from '../config/env';
import type { AnalyticsEvent } from '../types';

// Initialize PostHog
export const posthog = new PostHog(
  ENV.POSTHOG_API_KEY,
  {
    host: ENV.POSTHOG_HOST,
    captureAppLifecycleEvents: true,
  }
);

/**
 * Track an analytics event
 */
export const trackEvent = (event: AnalyticsEvent) => {
  try {
    if ('properties' in event) {
      posthog.capture(event.name, event.properties);
    } else {
      posthog.capture(event.name);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Identify a user
 */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    posthog.identify(userId, traits);
  } catch (error) {
    console.error('Analytics identify error:', error);
  }
};

/**
 * Reset analytics (on logout)
 */
export const resetAnalytics = () => {
  try {
    posthog.reset();
  } catch (error) {
    console.error('Analytics reset error:', error);
  }
};
