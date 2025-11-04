/**
 * Explore Screen - Shows DailyV3 filtered to selected teams/sports
 * Phase 6: Search interface appears when tab is active
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ChevronDown, ChevronUp, CalendarArrowDown, CalendarArrowUp } from 'lucide-react-native';
import { DailyV3 } from './DailyV3';
import { ExploreSearchOverlay } from '../../components/ui/ExploreSearchOverlay';
import { ViewDropdownPopover } from '../../components/ui/ViewDropdownPopover';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';

export const ExploreScreen: React.FC = () => {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const { exploreSelections, setExpandedGameId } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<'past' | 'today' | 'future'>('today');
  const hasHandledInitialFocus = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollToTodayRef = useRef<(() => void) | null>(null);

  // Collapse any expanded cards when this screen comes into focus
  React.useEffect(() => {
    if (isFocused) {
      setExpandedGameId('nhl', null);
      setExpandedGameId('nba', null);
      setExpandedGameId('mlb', null);
      setExpandedGameId('nfl', null);
    }
  }, [isFocused, setExpandedGameId]);

  // Animation effects for the Return to Today icon
  useEffect(() => {
    if (scrollPosition === 'today') {
      // Fade out when at today
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade in when away from today
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [scrollPosition, fadeAnim]);

  // Show search when tab focuses OR when selections become empty
  useEffect(() => {
    if (isFocused) {
      if (!hasHandledInitialFocus.current) {
        hasHandledInitialFocus.current = true;
        if (exploreSelections.length === 0) {
          setShowSearch(true);
        }
      }
      
      // Auto-show search if selections become empty, auto-hide if selections exist
      if (exploreSelections.length === 0) {
        setShowSearch(true);
      } else {
        setShowSearch(false);
      }
    }
    
    // Reset flag when tab loses focus
    if (!isFocused) {
      hasHandledInitialFocus.current = false;
    }
  }, [isFocused, exploreSelections.length]); // Watch both focus and selections

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header - Always visible */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoStack}>
            <Text style={[styles.logoLine1, { color: colors.text }]}>Sport</Text>
            <Text style={[styles.logoLine2, { color: colors.text }]}>Stream</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Find Your Game</Text>
        </View>
        
        <View style={styles.headerCenter}>
          <TouchableOpacity 
            style={styles.viewDropdownCenter}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewTitle, { color: colors.text }]}>Explore</Text>
            {showDropdown ? (
              <ChevronUp size={18} color={colors.primary} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          {exploreSelections.length > 0 && scrollPosition !== 'today' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                onPress={() => scrollToTodayRef.current?.()} 
                activeOpacity={0.7} 
                style={styles.returnTodayButton}
                accessibilityLabel={scrollPosition === 'past' ? 'Return to today. Scrolls forward to today\'s games.' : 'Return to today. Scrolls backward to today\'s games.'}
                accessibilityHint="Double-tap to scroll to today"
                accessibilityRole="button"
              >
                {scrollPosition === 'past' ? (
                  <CalendarArrowDown size={24} color="#00D9FF" strokeWidth={2.5} />
                ) : (
                  <CalendarArrowUp size={24} color="#00D9FF" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* ViewDropdownPopover */}
      <ViewDropdownPopover
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        mode="explore"
      />

      {/* Search Bar - Always visible in Explore */}
      <ExploreSearchOverlay
        visible={true}
        onClose={() => {}}
        showGamesBelow={true}
        onScrollPositionChange={setScrollPosition}
        onScrollToTodayRef={(fn) => { scrollToTodayRef.current = fn; }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    minWidth: 100,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  logoStack: {
    marginBottom: 2,
  },
  logoLine1: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  logoLine2: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
  },
  viewDropdownCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  returnTodayButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
