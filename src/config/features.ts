/**
 * Feature Flags - Control rollout of new features
 */

export const FEATURES = {
  /**
   * Use FiltersSheetV2 instead of legacy FilterBottomSheet
   * Toggle this to false for instant rollback to old filters
   */
  USE_FILTERS_V2: true,
} as const;

export type FeatureFlags = typeof FEATURES;
