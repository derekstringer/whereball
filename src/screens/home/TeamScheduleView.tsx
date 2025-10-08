/**
 * Team Schedule View - Shows upcoming games for followed team
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getGamesForDateRange, type NHLGame } from '../../lib/nhl-api';

interface TeamScheduleViewProps {
  followedTeamCodes: string[];
  userServiceCodes: string[];
}

export const TeamScheduleView: React.FC<TeamScheduleViewProps> = ({
  followedTeamCodes,
  userServiceCodes,
}) => {
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamSchedule();
  }, []);

  const loadTeamSchedule = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days

      const allGames = await getGamesForDateRange(startDate, endDate);
      
      // Filter to only games for followed teams
      const teamGames = allGames.filter(
        (game) =>
          followedTeamCodes.includes(game.homeTeam.abbreviation) ||
          followedTeamCodes.includes(game.awayTeam.abbreviation)
      );

      setGames(teamGames.slice(0, 15)); // Show next 15 games
    } catch (error) {
      console.error('Error loading team schedule:', error);
    } finally {
      setLoading(false);
    }
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
    const hasESPNPlus = game.broadcasts.some((b) =>
      b.network.toLowerCase().includes('espn+')
    );
    const isMyTeam =
      followedTeamCodes.includes(game.homeTeam.abbreviation) ||
      followedTeamCodes.includes(game.awayTeam.abbreviation);
    return hasESPNPlus && isMyTeam;
  };

  const getGameNetwork = (game: NHLGame): string => {
    if (game.broadcasts.length === 0) return 'TBD';
    return game.broadcasts[0].network;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading team schedule...</Text>
      </View>
    );
  }

  const availableGames = games.filter(isGameAvailable).length;
  const blackedOutGames = games.filter(isGameBlackedOut).length;
  const watchablePercentage = games.length > 0 
    ? Math.round((availableGames / games.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {followedTeamCodes[0] || 'Team'} Schedule
        </Text>
        <Text style={styles.subtitle}>Next {games.length} games</Text>

        {/* Watchability Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{watchablePercentage}%</Text>
              <Text style={styles.summaryLabel}>Watchable</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, styles.availableColor]}>
                {availableGames}
              </Text>
              <Text style={styles.summaryLabel}>Available</Text>
            </View>
            {blackedOutGames > 0 && (
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, styles.blackoutColor]}>
                  {blackedOutGames}
                </Text>
                <Text style={styles.summaryLabel}>Blackouts</Text>
              </View>
            )}
          </View>

          {watchablePercentage < 70 && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Upgrade to Premium for alternatives to blackouts
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Game List */}
      <View style={styles.gamesContainer}>
        {games.map((game, index) => {
          const available = isGameAvailable(game);
          const blackedOut = isGameBlackedOut(game);
          const network = getGameNetwork(game);
          const gameDate = new Date(game.startTime);
          const isHome = followedTeamCodes.includes(game.homeTeam.abbreviation);
          const opponent = isHome ? game.awayTeam : game.homeTeam;

          return (
            <View key={`${game.id}-${index}`} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <Text style={styles.gameDate}>
                  {gameDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.gameTime}>
                  {gameDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.gameBody}>
                <View style={styles.matchup}>
                  <Text style={styles.homeAway}>{isHome ? 'vs' : '@'}</Text>
                  <Text style={styles.opponent}>{opponent.abbreviation}</Text>
                  <Text style={styles.opponentName} numberOfLines={1}>
                    {opponent.name}
                  </Text>
                </View>

                <View style={styles.watchInfo}>
                  <Text style={styles.network}>{network}</Text>
                  {blackedOut ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusIcon}>⚠️</Text>
                      <Text style={styles.statusText}>Likely blacked out</Text>
                    </View>
                  ) : available ? (
                    <View style={[styles.statusBadge, styles.statusAvailable]}>
                      <Text style={styles.statusIcon}>✓</Text>
                      <Text style={[styles.statusText, styles.statusTextAvailable]}>
                        Available
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Not on your services</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {games.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No upcoming games found</Text>
        </View>
      )}

      {/* Legal Disclaimer */}
      <View style={styles.legalFooter}>
        <Text style={styles.legalText}>
          Team and service names used for identification only. Not affiliated with or endorsed by any league or provider.
        </Text>
      </View>
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066CC',
  },
  availableColor: {
    color: '#4CAF50',
  },
  blackoutColor: {
    color: '#FF6B35',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  gamesContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  gameBody: {
    gap: 12,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeAway: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    width: 24,
  },
  opponent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  opponentName: {
    flex: 1,
    fontSize: 15,
    color: '#666666',
  },
  watchInfo: {
    gap: 8,
  },
  network: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    gap: 6,
  },
  statusAvailable: {
    backgroundColor: '#E8F5E9',
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F57C00',
  },
  statusTextAvailable: {
    color: '#2E7D32',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
  },
  legalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 16,
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
