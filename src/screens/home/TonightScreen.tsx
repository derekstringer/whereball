/**
 * Tonight Screen - Main Home Screen (Now using DailyV2)
 * Shows today's NHL games with broadcast info and filters
 */

// Re-export DailyV2 as TonightScreen for backward compatibility
// This allows existing navigation to continue working while we use the new DailyV2 implementation
export { DailyV2 as TonightScreen } from './DailyV2';
