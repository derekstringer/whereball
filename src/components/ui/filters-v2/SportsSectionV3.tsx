/**
 * SportsSectionV3 - Grid-based sport selection with star + check
 * Simple 2-control system: Star = follow, Check = include in current filter
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { CollapsibleSection } from './CollapsibleSection';
import { SPORTS_CATALOG } from './presets';
import { Sport } from './types';

interface SportsSectionV3Props {
  selectedSports: Sport[]; // Sport IDs included in current filter
  followedSportIds: Sport[]; // Sport IDs user follows (saved to profile)
  onToggleFollow: (sportId: Sport) => void; // Star - saves to profile
  onToggleInclude: (sportId: Sport) => void; // Check - this filter only
  isExpanded: boolean; // Accordion state from parent
  onToggleExpanded: () => void; // Accordion toggle from parent
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 3;
const SCROLLVIEW_PADDING = 48; // 24px on each side from FiltersSheetV2
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - SCROLLVIEW_PADDING - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

export const SportsSectionV3: React.FC<SportsSectionV3Props> = ({
  selectedSports,
  followedSportIds,
  onToggleFollow,
  onToggleInclude,
  isExpanded,
  onToggleExpanded,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter by search query
  const searchFilteredSports = useMemo(() => {
    if (!searchQuery.trim()) {
      return SPORTS_CATALOG;
    }
    const query = searchQuery.toLowerCase();
    return SPORTS_CATALOG.filter(
      (sport) =>
        sport.name.toLowerCase().includes(query) ||
        sport.abbr.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Sort sports: ★ (followed), ✓ (checked but not followed), rest
  const sortedSports = useMemo(() => {
    return [...searchFilteredSports].sort((a, b) => {
      const aFollowed = followedSportIds.includes(a.id);
      const bFollowed = followedSportIds.includes(b.id);
      const aIncluded = selectedSports.includes(a.id);
      const bIncluded = selectedSports.includes(b.id);

      // Priority 1: ALL ★ followed sports (regardless of check state)
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;

      // Priority 2: ✓ only (checked but not followed)
      const aCheckedOnly = !aFollowed && aIncluded;
      const bCheckedOnly = !bFollowed && bIncluded;
      if (aCheckedOnly && !bCheckedOnly) return -1;
      if (!aCheckedOnly && bCheckedOnly) return 1;

      // Alphabetical within same priority
      return a.name.localeCompare(b.name);
    });
  }, [searchFilteredSports, followedSportIds, selectedSports]);

  // Show only 5 rows (15 sports) initially
  const INITIAL_ROWS = 5;
  const SPORTS_PER_ROW = COLUMNS;
  const INITIAL_COUNT = INITIAL_ROWS * SPORTS_PER_ROW;
  const visibleSports = showAll ? sortedSports : sortedSports.slice(0, INITIAL_COUNT);
  const remainingCount = sortedSports.length - INITIAL_COUNT;

  // Badge logic: Show counts with icons (★ for followed, ✓ for total selected)
  const badges = useMemo(() => {
    const followedCount = followedSportIds.length;
    const totalSelectedCount = selectedSports.length;
    
    // Case 1: Nothing selected
    if (totalSelectedCount === 0) {
      return [{ text: 'None' }];
    }
    
    // Case 2: No followed sports (only checked)
    if (followedCount === 0) {
      return [{ text: String(totalSelectedCount), icon: '✓' }];
    }
    
    // Case 3: Has followed sports
    return [
      { text: String(followedCount), icon: '★' },
      { text: String(totalSelectedCount), icon: '✓' },
    ];
  }, [selectedSports, followedSportIds]);

  // Handle follow toggle with auto-check behavior
  const handleFollowToggle = (sportId: Sport) => {
    const isFollowed = followedSportIds.includes(sportId);
    const isIncluded = selectedSports.includes(sportId);

    // Always toggle follow first
    onToggleFollow(sportId);
    
    if (isFollowed) {
      // Unfollowing → auto-uncheck if it's checked
      if (isIncluded) {
        onToggleInclude(sportId); // Remove from filter
      }
    } else {
      // Following → auto-check
      if (!isIncluded) {
        onToggleInclude(sportId); // Add to filter
      }
    }
  };

  return (
    <CollapsibleSection
      title="Sports"
      badges={badges}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search sports… (e.g., NHL, tennis)"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sports Grid */}
      <View style={styles.grid}>
        {visibleSports.map((sport) => {
          const isFollowed = followedSportIds.includes(sport.id);
          const isIncluded = selectedSports.includes(sport.id);
          const isPlaceholder = !sport.enabledForData;

          return (
            <View
              key={sport.id}
              style={[
                styles.sportCard,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                isPlaceholder && { opacity: 0.6 },
              ]}
            >
              {/* Rows 1-2: Sport name (2 lines max) */}
              <Text
                style={[styles.sportName, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {sport.name}
              </Text>

              {/* Row 3: Controls */}
              <View style={styles.controls}>
                {/* Star (Follow) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isFollowed ? colors.primary : colors.border },
                  ]}
                  onPress={() => handleFollowToggle(sport.id)}
                  activeOpacity={0.7}
                  disabled={isPlaceholder}
                >
                  <Text style={{ color: isFollowed ? colors.primary : colors.textSecondary }}>
                    {isFollowed ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>

                {/* Check (Include in filter) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isIncluded ? colors.primary : colors.border },
                  ]}
                  onPress={() => onToggleInclude(sport.id)}
                  activeOpacity={0.7}
                  disabled={isPlaceholder}
                >
                  <Text style={{ color: isIncluded ? colors.primary : colors.textSecondary }}>
                    {isIncluded ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* "Coming soon" indicator for placeholders */}
              {isPlaceholder && (
                <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
                  soon
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* "Show more" button */}
      {!showAll && remainingCount > 0 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.showMoreText, { color: colors.primary }]}>
            Show {remainingCount} more sports...
          </Text>
        </TouchableOpacity>
      )}

      {/* No results */}
      {visibleSports.length === 0 && searchQuery && (
        <Text style={[styles.noResults, { color: colors.textSecondary }]}>
          No sports match "{searchQuery}"
        </Text>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 18,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  sportCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 100, // Ensure consistent height for 2-line names
  },
  sportName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto', // Push to bottom
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
