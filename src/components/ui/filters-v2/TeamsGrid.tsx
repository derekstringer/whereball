/**
 * TeamsGrid - Grid of team chips with Popular section
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { NHL_TEAMS } from '../../../constants/teams';

interface TeamsGridProps {
  selectedTeams: string[];
  followedTeams: string[];
  searchQuery: string;
  onToggleTeam: (teamId: string) => void;
}

// Popular teams based on market size and fanbase
const POPULAR_TEAM_IDS = [
  'TOR', 'MTL', 'NYR', 'BOS', 'CHI',
  'DET', 'PHI', 'PIT', 'EDM', 'VAN',
];

export const TeamsGrid: React.FC<TeamsGridProps> = ({
  selectedTeams,
  followedTeams,
  searchQuery,
  onToggleTeam,
}) => {
  const { colors } = useTheme();

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return NHL_TEAMS;
    
    const query = searchQuery.toLowerCase();
    return NHL_TEAMS.filter(team =>
      team.name.toLowerCase().includes(query) ||
      team.market.toLowerCase().includes(query) ||
      team.short_code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Popular teams (only if no search)
  const popularTeams = useMemo(() => {
    if (searchQuery) return [];
    return NHL_TEAMS.filter(team => POPULAR_TEAM_IDS.includes(team.short_code));
  }, [searchQuery]);

  // All other teams
  const allTeams = useMemo(() => {
    if (searchQuery) return filteredTeams;
    return NHL_TEAMS.filter(team => !POPULAR_TEAM_IDS.includes(team.short_code));
  }, [searchQuery, filteredTeams]);

  const renderTeamChip = (team: typeof NHL_TEAMS[0]) => {
    const isSelected = selectedTeams.includes(team.id);
    const isFollowed = followedTeams.includes(team.id);

    return (
      <TouchableOpacity
        key={team.id}
        style={[
          styles.teamChip,
          { backgroundColor: colors.card, borderColor: colors.stroke },
          isSelected && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '15',
          },
        ]}
        onPress={() => onToggleTeam(team.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.teamAbbr, { color: colors.text }]}>
          {team.short_code}
        </Text>
        <Text
          style={[styles.teamName, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {team.name.split(' ').pop()}
        </Text>
        {isFollowed && (
          <View style={[styles.followedBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.followedBadgeText}>★</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (filteredTeams.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noResults, { color: colors.textSecondary }]}>
          No teams found for "{searchQuery}"
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        TEAMS
      </Text>

      {/* Popular Teams */}
      {popularTeams.length > 0 && (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
            Popular
          </Text>
          <View style={styles.teamsGrid}>
            {popularTeams.map(renderTeamChip)}
          </View>
        </View>
      )}

      {/* All Teams or Search Results */}
      {allTeams.length > 0 && (
        <View style={styles.subsection}>
          {!searchQuery && (
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
              All Teams
            </Text>
          )}
          <View style={styles.teamsGrid}>
            {allTeams.map(renderTeamChip)}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  teamAbbr: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  teamName: {
    fontSize: 11,
    textAlign: 'center',
  },
  followedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});
