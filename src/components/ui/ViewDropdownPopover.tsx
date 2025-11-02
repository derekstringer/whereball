/**
 * ViewDropdownPopover - Phase 4 Dropdown System
 * Shows favorited teams (My Teams) or selected teams (Explore)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { CircleCheckBig, Circle, Heart, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { SPORTS } from '../../constants/sports';

interface ViewDropdownPopoverProps {
  visible: boolean;
  onClose: () => void;
  mode: 'my-teams' | 'explore';
}

export const ViewDropdownPopover: React.FC<ViewDropdownPopoverProps> = ({
  visible,
  onClose,
  mode,
}) => {
  const { colors } = useTheme();
  const {
    follows,
    exploreSelections,
    hiddenTeamsInMyTeams,
    toggleTeamVisibilityInMyTeams,
    removeFromExplore,
    addFollow,
    removeFollow,
  } = useAppStore();

  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());

  // Group teams by sport
  const teamsBySport = React.useMemo(() => {
    const teamsToShow = mode === 'my-teams' 
      ? follows.map(f => f.team_id)
      : exploreSelections;

    const grouped: Record<string, string[]> = {};
    
    teamsToShow.forEach(teamId => {
      const follow = follows.find(f => f.team_id === teamId);
      const league = follow?.league || 'unknown';
      
      if (!grouped[league]) {
        grouped[league] = [];
      }
      grouped[league].push(teamId);
    });

    return grouped;
  }, [follows, exploreSelections, mode]);

  const sportKeys = Object.keys(teamsBySport);
  const hasSingleSport = sportKeys.length === 1;

  // Auto-expand if single sport (only once on mount or when visible changes)
  React.useEffect(() => {
    if (visible && hasSingleSport && sportKeys.length > 0) {
      setExpandedSports(new Set([sportKeys[0]]));
    }
  }, [visible]); // Only run when visibility changes

  const toggleSport = (sport: string) => {
    const newExpanded = new Set(expandedSports);
    if (newExpanded.has(sport)) {
      newExpanded.delete(sport);
    } else {
      newExpanded.add(sport);
    }
    setExpandedSports(newExpanded);
  };

  const handleSportVisibilityToggle = (league: string) => {
    if (mode !== 'my-teams') return; // Only works in my-teams mode
    
    const teamsInSport = teamsBySport[league];
    const allVisible = teamsInSport.every(teamId => !hiddenTeamsInMyTeams.includes(teamId));
    
    // Toggle all teams in this sport
    teamsInSport.forEach(teamId => {
      const isCurrentlyVisible = !hiddenTeamsInMyTeams.includes(teamId);
      if (allVisible && isCurrentlyVisible) {
        // Hide all
        toggleTeamVisibilityInMyTeams(teamId);
      } else if (!allVisible && !isCurrentlyVisible) {
        // Show all
        toggleTeamVisibilityInMyTeams(teamId);
      }
    });
  };

  const handleCircleTap = (teamId: string) => {
    if (mode === 'my-teams') {
      toggleTeamVisibilityInMyTeams(teamId);
    } else {
      removeFromExplore(teamId);
    }
  };

  const handleHeartTap = (teamId: string) => {
    const isFollowed = follows.some(f => f.team_id === teamId);
    
    if (isFollowed) {
      // Show unfavorite confirmation with properly formatted team name
      const teamDisplay = getTeamName(teamId);
      const formattedName = `${teamDisplay.cityCode} ${teamDisplay.teamName}`;
      
      Alert.alert(
        'Remove from My Teams?',
        `${formattedName} will no longer appear in your My Teams schedule view.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeFollow(teamId),
          },
        ]
      );
    } else {
      // Add to favorites
      const league = 'NHL'; // TODO: Determine league from teamId
      addFollow({
        user_id: 'temp-user', // TODO: Get from auth
        team_id: teamId,
        league,
        created_at: new Date().toISOString(),
      });
    }
  };

  const getTeamName = (teamId: string): { cityCode: string; teamName: string } => {
    // Import teams constant to look up team data
    const { ALL_TEAMS } = require('../../constants/teams');
    const team = ALL_TEAMS.find((t: any) => t.id === teamId);
    
    if (team) {
      const cityCode = team.short_code; // e.g., "LAK", "DET"
      const teamName = team.mascot || team.name.split(' ').pop(); // Use mascot field, fallback to last word
      return { cityCode, teamName };
    }
    
    return { cityCode: teamId, teamName: '' }; // Fallback
  };

  const getSportName = (league: string): string => {
    const sport = SPORTS.find(s => s.league === league);
    return sport?.name || league.toUpperCase();
  };

  const getSportEmoji = (league: string): string => {
    const sport = SPORTS.find(s => s.league === league);
    return sport?.emoji || '🏆';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Semi-transparent overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.popoverContainer} pointerEvents="box-none">
          <View style={[styles.popover, { backgroundColor: colors.surface }]} pointerEvents="auto">
            {/* Header */}
            <Text style={[styles.header, { color: colors.textSecondary }]}>
              {mode === 'my-teams' ? 'MY TEAMS' : 'EXPLORE'}
            </Text>

            {/* Content */}
            <ScrollView 
              style={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
                {sportKeys.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {mode === 'my-teams' ? 'No teams followed yet' : 'No teams selected'}
                    </Text>
                  </View>
                ) : (
                  sportKeys.map((league) => {
                  const isExpanded = hasSingleSport || expandedSports.has(league);
                  const teamCount = teamsBySport[league].length;

                  return (
                    <View key={league}>
                      {/* Sport Header */}
                      <View style={styles.sportHeader}>
                        <TouchableOpacity
                          style={styles.sportHeaderLeft}
                          onPress={() => !hasSingleSport && toggleSport(league)}
                          disabled={hasSingleSport}
                        >
                          <Text style={[styles.sportName, { color: colors.textSecondary }]}>
                            {getSportEmoji(league)} {getSportName(league)}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.sportHeaderRight}>
                          {!hasSingleSport && (
                            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                              <Text style={styles.countBadgeText}>{teamCount}</Text>
                            </View>
                          )}
                          {mode === 'my-teams' && (
                            <TouchableOpacity
                              style={styles.sportEyeButton}
                              onPress={() => handleSportVisibilityToggle(league)}
                            >
                              {teamsBySport[league].every(teamId => !hiddenTeamsInMyTeams.includes(teamId)) ? (
                                <CircleCheckBig size={20} color="#22c55e" />
                              ) : (
                                <Circle size={20} color={colors.textSecondary} />
                              )}
                            </TouchableOpacity>
                          )}
                          {!hasSingleSport && (
                            <TouchableOpacity onPress={() => toggleSport(league)}>
                              {isExpanded ? (
                                <ChevronDown size={16} color={colors.textSecondary} />
                              ) : (
                                <ChevronRight size={16} color={colors.textSecondary} />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Team Rows */}
                      {isExpanded && teamsBySport[league].map((teamId) => {
                        const isVisible = mode === 'my-teams'
                          ? !hiddenTeamsInMyTeams.includes(teamId)
                          : true;
                        const isFollowed = follows.some(f => f.team_id === teamId);

                        const teamDisplay = getTeamName(teamId);
                        
                        return (
                          <TouchableOpacity
                            key={teamId}
                            style={styles.teamRow}
                            onPress={() => handleCircleTap(teamId)}
                            activeOpacity={0.7}
                          >
                            {/* Team Name - City code larger, team name smaller */}
                            <View style={styles.teamNameContainer}>
                              <Text style={[styles.cityCode, { color: colors.text }]}>
                                {teamDisplay.cityCode}
                              </Text>
                              <Text style={[styles.teamName, { color: colors.textSecondary }]}>
                                {teamDisplay.teamName}
                              </Text>
                            </View>

                            {/* Circle Icon */}
                            <View style={styles.circleIconContainer}>
                              {isVisible ? (
                                <CircleCheckBig size={20} color="#22c55e" />
                              ) : (
                                <Circle size={20} color={colors.textSecondary} />
                              )}
                            </View>

                            {/* Heart Icon - separate touchable to prevent propagation */}
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleHeartTap(teamId);
                              }}
                            >
                              {isFollowed ? (
                                <Heart size={20} color="#ff4444" fill="#ff4444" />
                              ) : (
                                <Heart size={20} color="#666666" />
                              )}
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                  })
                )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingTop: 120, // Position below header
  },
  popoverContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popover: {
    width: 290,
    minHeight: 150,
    maxHeight: 500,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 10,
    paddingBottom: 16,
  },
  header: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    flexGrow: 0,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  sportHeaderLeft: {
    flex: 1,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sportHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportEyeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  teamRowClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityCode: {
    fontSize: 17, // 2 sizes larger than team name (15 + 2 = 17)
    fontWeight: '700',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '400',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
