/**
 * SportsChipsV2 - Sports selection with collapsible header and search
 * Includes full catalog with placeholders
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Sport } from './types';
import { SPORTS_CATALOG } from './presets';
import { CollapsibleSection } from './CollapsibleSection';

interface SportsChipsV2Props {
  selectedSports: Sport[];
  onToggleSport: (sport: Sport) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const SportsChipsV2: React.FC<SportsChipsV2Props> = ({
  selectedSports,
  onToggleSport,
  isExpanded,
  onToggleExpanded,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sports by search query
  const filteredSports = useMemo(() => {
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

  // Compute badges
  const badges = selectedSports.length === 0 
    ? [{ text: 'ALL' }] 
    : [{ text: String(selectedSports.length) }];

  // Handle "All Sports" toggle
  const handleToggleAll = () => {
    if (selectedSports.length === SPORTS_CATALOG.length) {
      // Deselect all
      selectedSports.forEach((sport) => onToggleSport(sport));
    } else {
      // Select all
      SPORTS_CATALOG.forEach((sport) => {
        if (!selectedSports.includes(sport.id)) {
          onToggleSport(sport.id);
        }
      });
    }
  };

  const allSelected = selectedSports.length === SPORTS_CATALOG.length;

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
        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>
          🔍
        </Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search sports… (e.g., NHL, tennis)"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state hint (first-time only) */}
      {selectedSports.length === 0 && !searchQuery && (
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          You haven't selected any sports yet.
        </Text>
      )}

      {/* "All Sports" chip */}
      <View style={styles.chipsContainer}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: allSelected ? colors.primary : colors.card,
              borderColor: allSelected ? colors.primary : colors.border,
            },
          ]}
          onPress={handleToggleAll}
        >
          <Text
            style={[
              styles.chipText,
              { color: allSelected ? '#FFFFFF' : colors.text },
            ]}
          >
            All Sports
          </Text>
        </TouchableOpacity>

        {/* Individual sport chips */}
        {filteredSports.map((sport) => {
          const isSelected = selectedSports.includes(sport.id);
          const isPlaceholder = !sport.enabledForData;

          return (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isPlaceholder && { opacity: 0.6 },
              ]}
              onPress={() => onToggleSport(sport.id)}
              onLongPress={() => {
                if (isPlaceholder) {
                  // TODO: Show tooltip "Coming soon"
                }
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {sport.name}
              </Text>
              {isPlaceholder && (
                <Text style={styles.comingSoon}>(soon)</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* No results */}
      {filteredSports.length === 0 && searchQuery && (
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
    marginBottom: 12,
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
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
