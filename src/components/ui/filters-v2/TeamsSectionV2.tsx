/**
 * TeamsSectionV2 - Teams selection with mode switcher
 * Supports: Followed teams (with excludes) vs Pick specific teams
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { TeamsMode } from './types';
import { CollapsibleSection } from './CollapsibleSection';

interface TeamsSectionV2Props {
  teamsMode: TeamsMode;
  selectedTeams: string[]; // includes for pick_specific, or includes in followed mode
  excludedTeams: string[]; // excludes for followed mode
  followedTeamIds: string[]; // from user's follows
  onToggleMode: (mode: TeamsMode) => void;
  onToggleFollow: (teamId: string) => void; // Star - persists to profile
  onToggleInclude: (teamId: string) => void; // Plus - this view only
  onToggleExclude: (teamId: string) => void; // Minus - followed mode only
}

export const TeamsSectionV2: React.FC<TeamsSectionV2Props> = ({
  teamsMode,
  selectedTeams,
  excludedTeams,
  followedTeamIds,
  onToggleMode,
  onToggleFollow,
  onToggleInclude,
  onToggleExclude,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock teams data (in real app, this would come from constants/teams.ts)
  const allTeams = useMemo(() => [
    // NHL teams
    { id: 'nhl_bos', sport: 'nhl', name: 'Boston Bruins', market: 'Boston', abbr: 'BOS' },
    { id: 'nhl_dal', sport: 'nhl', name: 'Dallas Stars', market: 'Dallas', abbr: 'DAL' },
    { id: 'nhl_nyr', sport: 'nhl', name: 'New York Rangers', market: 'New York', abbr: 'NYR' },
    { id: 'nhl_tor', sport: 'nhl', name: 'Toronto Maple Leafs', market: 'Toronto', abbr: 'TOR' },
    { id: 'nhl_mtl', sport: 'nhl', name: 'Montreal Canadiens', market: 'Montreal', abbr: 'MTL' },
    // NBA teams
    { id: 'nba_dal', sport: 'nba', name: 'Dallas Mavericks', market: 'Dallas', abbr: 'DAL' },
    { id: 'nba_lal', sport: 'nba', name: 'Los Angeles Lakers', market: 'Los Angeles', abbr: 'LAL' },
    { id: 'nba_bos', sport: 'nba', name: 'Boston Celtics', market: 'Boston', abbr: 'BOS' },
  ], []);

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTeams;
    }

    const query = searchQuery.toLowerCase();
    return allTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.market.toLowerCase().includes(query) ||
        team.abbr.toLowerCase().includes(query)
    );
  }, [allTeams, searchQuery]);

  // Compute badge text
  const badgeText = useMemo(() => {
    if (teamsMode === 'followed') {
      if (excludedTeams.length === 0) {
        return 'FOLLOWED';
      }
      const effectiveCount = followedTeamIds.length - excludedTeams.length;
      return String(effectiveCount);
    } else {
      // pick_specific mode
      return selectedTeams.length === 0 ? 'ALL' : String(selectedTeams.length);
    }
  }, [teamsMode, selectedTeams.length, excludedTeams.length, followedTeamIds.length]);

  // Summary text
  const summaryText = useMemo(() => {
    if (teamsMode === 'followed') {
      if (excludedTeams.length > 0) {
        return `Followed teams (−${excludedTeams.length} excluded)`;
      }
      return 'Followed teams';
    } else {
      if (selectedTeams.length === 0) {
        return 'All teams';
      }
      return `Specific teams (${selectedTeams.length})`;
    }
  }, [teamsMode, selectedTeams.length, excludedTeams.length]);

  // Empty state (no followed teams in MY TEAMS mode)
  const showEmptyState = teamsMode === 'followed' && followedTeamIds.length === 0;

  return (
    <CollapsibleSection
      title="Teams"
      badge={badgeText}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      {/* Mode Switcher */}
      <View style={styles.modeSwitcher}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: teamsMode === 'followed' ? colors.primary : colors.card,
              borderColor: teamsMode === 'followed' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onToggleMode('followed')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: teamsMode === 'followed' ? '#FFFFFF' : colors.text },
            ]}
          >
            Followed teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: teamsMode === 'pick_specific' ? colors.primary : colors.card,
              borderColor: teamsMode === 'pick_specific' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onToggleMode('pick_specific')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: teamsMode === 'pick_specific' ? '#FFFFFF' : colors.text },
            ]}
          >
            Pick specific teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <Text style={[styles.summary, { color: colors.textSecondary }]}>
        {summaryText}
      </Text>

      {/* Empty state */}
      {showEmptyState ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You're not following any teams yet.
          </Text>
          <View style={styles.emptyButtons}>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                // Keep search open for user to follow teams
              }}
            >
              <Text style={styles.emptyButtonText}>Follow Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.emptyButton,
                { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary },
              ]}
              onPress={() => onToggleMode('pick_specific')}
            >
              <Text style={[styles.emptyButtonTextAlt, { color: colors.primary }]}>
                See All Games
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
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
              placeholder="Search teams… (name, city, or abbr: 'DAL', 'NYR')"
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

          {/* Teams Grid */}
          <View style={styles.teamsGrid}>
            {filteredTeams.map((team) => {
              const isFollowed = followedTeamIds.includes(team.id);
              const isIncluded =
                teamsMode === 'pick_specific' ? selectedTeams.includes(team.id) : false;
              const isExcluded =
                teamsMode === 'followed' ? excludedTeams.includes(team.id) : false;

              return (
                <View
                  key={team.id}
                  style={[
                    styles.teamCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    isExcluded && { opacity: 0.5 },
                  ]}
                >
                  {/* Team info */}
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamAbbr, { color: colors.text }]}>
                      {team.abbr}
                    </Text>
                    <Text style={[styles.teamName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {team.name}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.teamActions}>
                    {/* Star (Follow) */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { borderColor: isFollowed ? colors.primary : colors.border },
                      ]}
                      onPress={() => onToggleFollow(team.id)}
                    >
                      <Text style={{ color: isFollowed ? colors.primary : colors.textSecondary }}>
                        {isFollowed ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>

                    {/* Plus/Minus (Include/Exclude) */}
                    {teamsMode === 'pick_specific' && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { borderColor: isIncluded ? colors.primary : colors.border },
                        ]}
                        onPress={() => onToggleInclude(team.id)}
                      >
                        <Text style={{ color: isIncluded ? colors.primary : colors.textSecondary }}>
                          +
                        </Text>
                      </TouchableOpacity>
                    )}

                    {teamsMode === 'followed' && isFollowed && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { borderColor: isExcluded ? '#FF4444' : colors.border },
                        ]}
                        onPress={() => onToggleExclude(team.id)}
                      >
                        <Text style={{ color: isExcluded ? '#FF4444' : colors.textSecondary }}>
                          −
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* No results */}
          {filteredTeams.length === 0 && searchQuery && (
            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
              No teams match "{searchQuery}"
            </Text>
          )}
        </>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  modeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyButtonTextAlt: {
    fontSize: 14,
    fontWeight: '600',
  },
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
  teamsGrid: {
    gap: 8,
  },
  teamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  teamInfo: {
    flex: 1,
  },
  teamAbbr: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  teamName: {
    fontSize: 13,
  },
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
