/**
 * Explore Screen - Shows DailyV3 filtered to selected teams/sports
 * Phase 6: Search interface appears when tab is active
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { ExploreSearchOverlay } from '../../components/ui/ExploreSearchOverlay';
import { useAppStore } from '../../store/appStore';

export const ExploreScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const { exploreSelections } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);

  // Show search when tab becomes focused AND no selections
  useEffect(() => {
    if (isFocused && exploreSelections.length === 0) {
      setShowSearch(true);
    }
  }, [isFocused, exploreSelections.length]);

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
