/**
 * Explore Screen - Shows DailyV3 filtered to selected teams/sports
 * Phase 6: Search interface appears when tab is active
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { ExploreSearchOverlay } from '../../components/ui/ExploreSearchOverlay';
import { useAppStore } from '../../store/appStore';

export const ExploreScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const { exploreSelections } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);
  const hasHandledInitialFocus = useRef(false);

  // Show search ONCE when tab first focuses with no selections
  useEffect(() => {
    if (isFocused && !hasHandledInitialFocus.current) {
      hasHandledInitialFocus.current = true;
      if (exploreSelections.length === 0) {
        setShowSearch(true);
      }
    }
    
    // Reset flag when tab loses focus
    if (!isFocused) {
      hasHandledInitialFocus.current = false;
    }
  }, [isFocused]); // Only depend on isFocused, not exploreSelections.length

  return (
    <View style={styles.container}>
      <DailyV3 viewMode="explore" />
      <ExploreSearchOverlay
        visible={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
