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
import { getGamesForDate, type NHLGame } from '../../lib/nhl-api';
import { trackEvent } from '../../lib/analytics';
import { Tooltip } from '../../components/ui/ServiceBadge';
import { useAppStore } from '../../store/appStore';
import { WeeklyView } from './WeeklyView';
import { TeamScheduleView } from './TeamScheduleView';
import { SettingsScreen } from '../settings/SettingsScreen';
import { FilterBottomSheet } from '../../components/ui/FilterBottomSheet';
import { Modal } from 'react-native';
import { NHL_TEAMS } from '../../constants/teams';

type TabView = 'daily' | 'weekly' | 'team';

export const TonightScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');

  const { subscriptions, follows, filters } = useAppStore();
  
  // Map team IDs to short codes (e.g., 'nhl_bos' -> 'BOS')
  const followedTeamCodes = follows.map(f => {
    const team = NHL_TEAMS.find(t => t.id === f.team_id);
    return team?.short_code || '';
  }).filter(Boolean);
  
  const userServiceCodes = subscriptions.map(s => s.service_code);

  const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  }, [selectedDate]);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

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

    // Filter: Available on ANY Streaming Services
    if (filters.streamingOnly) {
      filtered = filtered.filter(game =>
        game.broadcasts.some(b => {
          const network = b.network.toLowerCase();
          // Check if available on any known streaming service
          return ['espn+', 'hulu', 'youtube', 'fubo', 'paramount', 'sling', 'directv', 'max', 'peacock'].some(service =>
            network.includes(service)
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
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  const loadGames = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const gamesForDate = await getGamesForDate(selectedDate);
      setGames(gamesForDate);

      // Track page view
      trackEvent({
        name: 'tonight_viewed',
        properties: {
          games_count: gamesForDate.length,
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
  }, [selectedDate]); // Reload when date changes

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

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'weekly':
        return (
          <WeeklyView
            followedTeamCodes={followedTeamCodes}
            userServiceCodes={userServiceCodes}
          />
        );
      case 'team':
        return (
          <TeamScheduleView
            followedTeamCodes={followedTeamCodes}
            userServiceCodes={userServiceCodes}
          />
        );
      default:
        return renderDailyView();
    }
  };

  const renderDailyView = () => (
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
        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToPreviousDay}
            activeOpacity={0.7}
          >
            <Text style={styles.dateArrowText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCenter}
            onPress={isToday ? undefined : goToToday}
            activeOpacity={isToday ? 1 : 0.7}
          >
            <Text style={[styles.dateRange, isToday && styles.dateRangeCurrent]}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {!isToday && (
              <Text style={styles.todayHint}>Tap for today</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToNextDay}
            activeOpacity={0.7}
          >
            <Text style={styles.dateArrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏒</Text>
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
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                userServiceCodes={userServiceCodes}
                onPress={() => handleGamePress(game)}
                onShowTooltip={(message) => {
                  setTooltipMessage(message);
                  setTooltipVisible(true);
                }}
              />
            ))}
          </View>
        )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Pull down to refresh • Data from NHL.com
        </Text>
        <Text style={styles.legalText}>
          Team and service names used for identification only. Not affiliated with or endorsed by any league or provider.
        </Text>
      </View>
    </ScrollView>
  );

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Tooltip
        visible={tooltipVisible}
        message={tooltipMessage}
        onDismiss={() => setTooltipVisible(false)}
      />
      {/* Header with Hamburger + Filter */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.hamburger}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>🏒 WhereBall</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <View style={styles.filterIconWrapper}>
            <Text style={styles.filterIcon}>🎚️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
          onPress={() => setActiveTab('daily')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => setActiveTab('weekly')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
            Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseSettings}
      >
        <SettingsScreen onClose={handleCloseSettings} />
      </Modal>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        hideLiveFilter={false}
      />
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
    paddingTop: 20,
    paddingBottom: 16,
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
    textAlign: 'center',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateArrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 24,
    color: '#0066CC',
    fontWeight: '600',
  },
  dateCenter: {
    minWidth: 200,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dateRange: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
  },
  dateRangeCurrent: {
    color: '#0066CC',
  },
  todayHint: {
    fontSize: 12,
    color: '#0066CC',
    marginTop: 4,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: {
    fontSize: 24,
    color: '#666666',
  },
  filterIconWrapper: {
    position: 'relative',
  },
  filterIcon: {
    fontSize: 24,
    color: '#666666',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0066CC',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999999',
  },
  tabTextActive: {
    color: '#0066CC',
  },
});
