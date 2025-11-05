/**
 * ExploreSearchOverlay - Phase 6 Search Interface
 * Appears when Explore tab is tapped, provides team/sport search
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Search, CircleCheckBig, Heart, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { ALL_TEAMS, getTeamsByLeague } from '../../constants/teams';
import { SPORTS } from '../../constants/sports';

interface ExploreSearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  showGamesBelow?: boolean; // If true, shows DailyV3 games below search
  onScrollPositionChange?: (position: 'past' | 'today' | 'future') => void;
  onScrollToTodayRef?: (fn: () => void) => void;
}

export const ExploreSearchOverlay: React.FC<ExploreSearchOverlayProps> = ({
  visible,
  onClose,
  showGamesBelow = false,
  onScrollPositionChange,
  onScrollToTodayRef,
}) => {
  const { colors } = useTheme();
  const { follows, addToExplore, addFollow, removeFollow, exploreSelections } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackTeam, setFeedbackTeam] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Focus search when visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  // Clear search when team is added to exploreSelections
  const prevSelectionsLength = useRef(exploreSelections.length);
  useEffect(() => {
    // Only clear if length increased (team added, not removed)
    if (exploreSelections.length > prevSelectionsLength.current) {
      // Force immediate clear by setting state multiple times
      setSearchQuery('');
      requestAnimationFrame(() => {
        setSearchQuery('');
        Keyboard.dismiss();
      });
    }
    prevSelectionsLength.current = exploreSelections.length;
  }, [exploreSelections]);

  // Filter teams/sports based on search query, excluding teams already in Explore
  const searchResults = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      return { teams: [], sports: [] };
    }

    // Search teams and EXCLUDE those already in exploreSelections
    const matchedTeams = ALL_TEAMS.filter(team =>
      (team.name.toLowerCase().includes(query) ||
       team.market.toLowerCase().includes(query) ||
       team.short_code.toLowerCase().includes(query)) &&
      !exploreSelections.includes(team.id)
    );

    // Search sports
    const matchedSports = SPORTS.filter(sport =>
      sport.name.toLowerCase().includes(query) ||
      sport.league.toLowerCase().includes(query)
    );

    return { teams: matchedTeams, sports: matchedSports };
  }, [searchQuery, exploreSelections]);

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleQuickView = (teamId: string) => {
    const team = ALL_TEAMS.find(t => t.id === teamId);
    
    // FORCE clear the TextInput directly via ref to bypass React state
    if (searchInputRef.current) {
      searchInputRef.current.clear();
    }
    
    // Also update React state
    setSearchQuery('');
    Keyboard.dismiss();
    
    // Add team to explore
    addToExplore(teamId);
    
    // Show feedback overlay
    if (team) {
      setFeedbackTeam(team.name);
      setTimeout(() => {
        setFeedbackTeam(null);
      }, 800);
    }
  };

  const handleToggleFavorite = (teamId: string) => {
    const isFollowed = follows.some(f => f.team_id === teamId);
    const team = ALL_TEAMS.find(t => t.id === teamId);
    
    if (!team) return;

    if (isFollowed) {
      removeFollow(teamId);
    } else {
      addFollow({
        user_id: 'temp-user', // TODO: Get from auth
        team_id: teamId,
        league: team.league,
        created_at: new Date().toISOString(),
      });
    }
  };

  const handleSportTileTap = (league: string) => {
    setSearchQuery(league.toLowerCase());
    searchInputRef.current?.focus();
  };

  if (!visible) return null;

  const showEmptyState = searchQuery.trim() === '';
  const hasResults = searchResults.teams.length > 0 || searchResults.sports.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Feedback Overlay - Shows briefly when team is selected */}
      {feedbackTeam && (
        <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackCard, { backgroundColor: colors.surface }]}>
            <CircleCheckBig size={48} color="#22c55e" />
            <Text style={[styles.feedbackText, { color: colors.text }]}>
              {feedbackTeam} added
            </Text>
          </View>
        </View>
      )}
      
      {/* Search Bar - Full width, directly under header */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => searchInputRef.current?.focus()}
        style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search teams, sports, matchups…"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleDismissKeyboard}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
      </TouchableOpacity>

      {/* Results / Empty State / Games */}
      {showGamesBelow && exploreSelections.length > 0 && searchQuery.trim() === '' ? (
        // Show games only when not actively searching
        require('./../../screens/home/DailyV3').DailyV3 && 
        React.createElement(require('./../../screens/home/DailyV3').DailyV3, { 
          viewMode: 'explore',
          onScrollPositionChange,
          onScrollToTodayRef,
        })
      ) : (
      <ScrollView 
        style={styles.resultsContainer}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
          {showEmptyState ? (
            <View style={styles.emptyState}>
              <Search size={64} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Explore</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Search for teams or sports
              </Text>

              {/* Browse by Sport Tiles */}
              <Text style={[styles.browseSportHeader, { color: colors.textSecondary }]}>
                Browse by Sport
              </Text>
              <View style={styles.sportGrid}>
                {SPORTS.map(sport => (
                  <TouchableOpacity
                    key={sport.league}
                    style={[styles.sportTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleSportTileTap(sport.league)}
                  >
                    <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                    <Text style={[styles.sportName, { color: colors.text }]}>{sport.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {/* No Results */}
              {!hasResults && (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    No results for "{searchQuery}"
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
                    Try searching for a team name or sport
                  </Text>
                </View>
              )}

              {/* Sports Results */}
              {searchResults.sports.length > 0 && (
                <View style={styles.resultsSection}>
                  <Text style={[styles.resultsSectionHeader, { color: colors.textSecondary }]}>
                    SPORTS
                  </Text>
                  {searchResults.sports.map(sport => {
                    const teamCount = getTeamsByLeague(sport.league).length;
                    return (
                      <TouchableOpacity
                        key={sport.league}
                        style={styles.resultRow}
                        onPress={() => handleQuickView(`sport_${sport.league}`)}
                      >
                        <Text style={[styles.resultText, { color: colors.text }]}>
                          {sport.emoji} {sport.name} ({teamCount} teams)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Teams Results - NO circles, just team name + heart */}
              {searchResults.teams.length > 0 && (
                <View style={styles.resultsSection}>
                  <Text style={[styles.resultsSectionHeader, { color: colors.textSecondary }]}>
                    TEAMS
                  </Text>
                  {searchResults.teams.map(team => {
                    const isFollowed = follows.some(f => f.team_id === team.id);
                    return (
                      <View key={team.id} style={styles.resultRow}>
                        <TouchableOpacity
                          style={styles.resultRowMain}
                          onPress={() => handleQuickView(team.id)}
                        >
                          <Text style={[styles.resultText, { color: colors.text }]}>
                            {team.name}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.heartButton}
                          onPress={() => handleToggleFavorite(team.id)}
                        >
                          {isFollowed ? (
                            <Heart size={20} color="#ff4444" fill="#ff4444" />
                          ) : (
                            <Heart size={20} color="#666666" />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  browseSportHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 40,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  sportTile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sportEmoji: {
    fontSize: 32,
  },
  sportName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  resultsSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    minHeight: 44,
  },
  resultRowMain: {
    flex: 1,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '500',
  },
  heartButton: {
    padding: 8,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  feedbackCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
