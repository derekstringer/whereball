/**
 * Weekly View - Shows 7-day schedule snapshot
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getGamesGroupedByDate, type NHLGame } from '../../lib/nhl-api';
import { trackEvent } from '../../lib/analytics';

interface WeeklyViewProps {
  followedTeamCodes: string[];
  userServiceCodes: string[];
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  followedTeamCodes,
  userServiceCodes,
}) => {
  const [gamesByDate, setGamesByDate] = useState<Record<string, NHLGame[]>>({});
  const [loading, setLoading] = useState(true);
  const [startDate] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWeeklyGames();
  }, []);

  const loadWeeklyGames = async () => {
    try {
      setLoading(true);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Next 7 days

      const grouped = await getGamesGroupedByDate(startDate, endDate);
      setGamesByDate(grouped);

      // TODO: Add weekly_view_loaded event to analytics types
    } catch (error) {
      console.error('Error loading weekly games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMyTeamGames = (games: NHLGame[]): NHLGame[] => {
    return games.filter(
      (game) =>
        followedTeamCodes.includes(game.homeTeam.abbreviation) ||
        followedTeamCodes.includes(game.awayTeam.abbreviation)
    );
  };

  const isGameAvailable = (game: NHLGame): boolean => {
    return game.broadcasts.some((b) => {
      const network = b.network.toLowerCase();
      return userServiceCodes.some(
        (service) =>
          network.includes(service.toLowerCase()) ||
          service.toLowerCase().includes(network)
      );
    });
  };

  const isGameBlackedOut = (game: NHLGame): boolean => {
    // Simple heuristic: ESPN+ games for followed teams might be blacked out
    const hasESPNPlus = game.broadcasts.some((b) =>
      b.network.toLowerCase().includes('espn+')
    );
    const isMyTeam =
      followedTeamCodes.includes(game.homeTeam.abbreviation) ||
      followedTeamCodes.includes(game.awayTeam.abbreviation);
    return hasESPNPlus && isMyTeam;
  };

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const renderDaySection = (dateKey: string, games: NHLGame[]) => {
    // Parse date more carefully - dateKey is YYYY-MM-DD
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const isToday = date.toDateString() === new Date().toDateString();
    const myTeamGames = filterMyTeamGames(games);
    const isExpanded = expandedDays.has(dateKey);

    return (
      <View key={dateKey} style={styles.daySection}>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
              {isToday
                ? 'Today'
                : date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={styles.dayDate}>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={styles.gameCount}>
              {myTeamGames.length === 0
                ? 'No games'
                : `${myTeamGames.length} game${myTeamGames.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {myTeamGames.length > 0 && (
          <View style={styles.gamesContainer}>
            {(isExpanded ? myTeamGames : myTeamGames.slice(0, 3)).map((game, index) => {
              const available = isGameAvailable(game);
              const blackedOut = isGameBlackedOut(game);

              return (
                <View key={`${game.id}-${index}`} style={styles.gameRow}>
                  <View style={styles.gameTeams}>
                    <Text style={styles.gameText} numberOfLines={1}>
                      {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                    </Text>
                  </View>
                  <View style={styles.gameStatus}>
                    {blackedOut ? (
                      <View style={styles.blackoutBadge}>
                        <Text style={styles.blackoutText}>⚠️</Text>
                      </View>
                    ) : available ? (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableText}>—</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {myTeamGames.length > 3 && (
              <TouchableOpacity onPress={() => toggleDayExpanded(dateKey)}>
                <Text style={styles.moreGamesText}>
                  {isExpanded 
                    ? '− Show less' 
                    : `+${myTeamGames.length - 3} more`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading this week's games...</Text>
      </View>
    );
  }

  const sortedDates = Object.keys(gamesByDate).sort();
  const totalMyTeamGames = sortedDates.reduce((acc, dateKey) => {
    return acc + filterMyTeamGames(gamesByDate[dateKey]).length;
  }, 0);

  const totalBlackouts = sortedDates.reduce((acc, dateKey) => {
    const myGames = filterMyTeamGames(gamesByDate[dateKey]);
    return acc + myGames.filter(isGameBlackedOut).length;
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalMyTeamGames}</Text>
            <Text style={styles.summaryLabel}>Games</Text>
          </View>
          {totalBlackouts > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, styles.summaryNumberWarning]}>
                {totalBlackouts}
              </Text>
              <Text style={styles.summaryLabel}>Blackouts</Text>
            </View>
          )}
        </View>
      </View>

      {sortedDates.map((dateKey) => renderDaySection(dateKey, gamesByDate[dateKey]))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666666',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066CC',
  },
  summaryNumberWarning: {
    color: '#FF6B35',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  daySection: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  dayNameToday: {
    color: '#0066CC',
  },
  dayDate: {
    fontSize: 15,
    color: '#666666',
  },
  dayHeaderRight: {},
  gameCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  gamesContainer: {
    gap: 8,
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  gameTeams: {
    flex: 1,
  },
  gameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  gameStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  blackoutBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackoutText: {
    fontSize: 14,
  },
  unavailableBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#999999',
  },
  moreGamesText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
    paddingLeft: 12,
    marginTop: 4,
  },
});
