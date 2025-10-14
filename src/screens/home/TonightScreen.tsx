/**
 * Tonight Screen - Main Home Screen (Now using DailyV3)
 * Shows today's NHL games with broadcast info and filters
 */

// Re-export DailyV3 as TonightScreen for backward compatibility
// This allows existing navigation to continue working while we use the new DailyV3 implementation
export { DailyV3 as TonightScreen } from './DailyV3';
