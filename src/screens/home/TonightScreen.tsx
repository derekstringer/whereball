/**
 * Tonight Screen - Main Home Screen
 * Shows today's NHL games with broadcast info and filters
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { GameCard } from '../../components/game/GameCard';
import { getTodaysGames, type NHLGame } from '../../lib/nhl-api';
import { trackEvent } from '../../lib/analytics';
import { useAppStore } from '../../store/appStore';

interface Filters {
  myTeamsOnly: boolean;
  nationalOnly: boolean;
  availableOnly: boolean;
  liveOnly: boolean;
  showAll: boolean;
}

export const TonightScreen: React.FC = () => {
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    myTeamsOnly: true, // Default ON
    nationalOnly: false,
    availableOnly: false,
    liveOnly: false,
    showAll: false,
  });

  const { subscriptions } = useAppStore();
  const followedTeamCodes = ['ARI']; // TODO: Get from user's actual follows
  const userServiceCodes = subscriptions.map(s => s.service_code);

  // Filter games based on selected filters
  const filteredGames = useMemo(() => {
    let filtered = [...games];

    // If "Show All" is enabled, return all games
    if (filters.showAll) {
      return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    // Filter: My Teams Only
    if (filters.myTeamsOnly) {
      filtered = filtered.filter(game =>
        followedTeamCodes.includes(game.homeTeam.abbreviation) ||
        followedTeamCodes.includes(game.awayTeam.abbreviation)
      );
    }

    // Filter: National Games Only
    if (filters.nationalOnly) {
      filtered = filtered.filter(game =>
        game.broadcasts.some(b => b.type === 'national')
      );
    }

    // Filter: Available on My Services
    if (filters.availableOnly) {
      filtered = filtered.filter(game =>
        game.broadcasts.some(b => {
          // Check if any broadcast network matches user's services
          const network = b.network.toLowerCase();
          return userServiceCodes.some(service => 
            network.includes(service.toLowerCase()) || 
            service.toLowerCase().includes(network)
          );
        })
      );
    }

    // Filter: Live Games Only
    if (filters.liveOnly) {
      filtered = filtered.filter(game => game.gameState === 'LIVE');
    }

    // Sort by time
    return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [games, filters, followedTeamCodes, userServiceCodes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.myTeamsOnly) count++;
    if (filters.nationalOnly) count++;
    if (filters.availableOnly) count++;
    if (filters.liveOnly) count++;
    if (filters.showAll) count++;
    return count;
  }, [filters]);

  const toggleFilter = (filterKey: keyof Filters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      // If toggling "Show All", turn off others
      if (filterKey === 'showAll' && !prev.showAll) {
        return {
          myTeamsOnly: false,
          nationalOnly: false,
          availableOnly: false,
          liveOnly: false,
          showAll: true,
        };
      }
      
      // If toggling any other filter while "Show All" is on, turn off "Show All"
      if (prev.showAll && filterKey !== 'showAll') {
        newFilters.showAll = false;
      }
      
      newFilters[filterKey] = !prev[filterKey];
      return newFilters;
    });
  };

  const loadGames = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const todaysGames = await getTodaysGames();
      setGames(todaysGames);

      // Track page view
      trackEvent({
        name: 'tonight_viewed',
        properties: {
          games_count: todaysGames.length,
        },
      });
    } catch (err: any) {
      console.error('Error loading games:', err);
      setError('Failed to load games. Pull to refresh to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleRefresh = () => {
    loadGames(true);
  };

  const handleGamePress = (game: NHLGame) => {
    trackEvent({
      name: 'game_viewed',
      properties: {
        game_id: game.id,
        home_team: game.homeTeam.abbreviation,
        away_team: game.awayTeam.abbreviation,
      },
    });
    // TODO: Navigate to game details screen
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading today's games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0066CC"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🏒</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Tonight</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterButtonText}>
            {filtersExpanded ? '▼' : '▶'} Filters
          </Text>
        </TouchableOpacity>

        {/* Filter Options */}
        {filtersExpanded && (
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterChip, filters.myTeamsOnly && styles.filterChipActive]}
              onPress={() => toggleFilter('myTeamsOnly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filters.myTeamsOnly && styles.filterChipTextActive]}>
                {filters.myTeamsOnly ? '✓ ' : ''}My Teams Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.nationalOnly && styles.filterChipActive]}
              onPress={() => toggleFilter('nationalOnly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filters.nationalOnly && styles.filterChipTextActive]}>
                {filters.nationalOnly ? '✓ ' : ''}National Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.availableOnly && styles.filterChipActive]}
              onPress={() => toggleFilter('availableOnly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filters.availableOnly && styles.filterChipTextActive]}>
                {filters.availableOnly ? '✓ ' : ''}On My Services
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.liveOnly && styles.filterChipActive]}
              onPress={() => toggleFilter('liveOnly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filters.liveOnly && styles.filterChipTextActive]}>
                {filters.liveOnly ? '✓ ' : ''}Live Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filters.showAll && styles.filterChipActive]}
              onPress={() => toggleFilter('showAll')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filters.showAll && styles.filterChipTextActive]}>
                {filters.showAll ? '✓ ' : ''}Show All Games
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No games scheduled today</Text>
            <Text style={styles.emptyText}>
              Check back during the NHL season for tonight's matchups!
            </Text>
          </View>
        ) : filteredGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No games match your filters</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters to see more games.
            </Text>
          </View>
        ) : (
          <View style={styles.gamesContainer}>
            <Text style={styles.gamesCount}>
              {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} 
              {filteredGames.length !== games.length && ` (${games.length} total)`}
            </Text>
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGamePress(game)}
              />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pull down to refresh • Data from NHL.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666666',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  filterBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    fontSize: 16,
    color: '#666666',
  },
  filterButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#E6F2FF',
    borderColor: '#0066CC',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#0066CC',
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B35',
    lineHeight: 20,
  },
  gamesContainer: {
    paddingHorizontal: 24,
  },
  gamesCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
});
