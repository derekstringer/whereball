/**
 * FiltersSheet - Smart wrapper that uses feature flag to toggle between V1 and V2
 * This is the new single import point for filters
 */

import React from 'react';
import { FEATURES } from '../../config/features';
import { FilterBottomSheet } from './FilterBottomSheet';
import { FiltersSheetV2 } from './filters-v2/FiltersSheetV2';

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  hideLiveFilter?: boolean;
}

export const FiltersSheet: React.FC<FiltersSheetProps> = (props) => {
  // Use feature flag to choose implementation
  if (FEATURES.USE_FILTERS_V2) {
    return <FiltersSheetV2 visible={props.visible} onClose={props.onClose} />;
  }
  
  // Fall back to legacy implementation
  return <FilterBottomSheet {...props} />;
};
