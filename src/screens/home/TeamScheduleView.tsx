/**
 * Team Schedule View - Shows upcoming games for followed team
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getGamesForDateRange, type NHLGame } from '../../lib/nhl-api';
import { useAppStore } from '../../store/appStore';
import { GameCard } from '../../components/game/GameCard';

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
  const { filters } = useAppStore();

  // Helper functions - must be defined BEFORE useMemo that uses them
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

      setGames(teamGames); // Store all, filter on render
    } catch (error) {
      console.error('Error loading team schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply global filters
  const filteredGames = useMemo(() => {
    let filtered = [...games];

    if (filters.showAll) {
      return filtered.slice(0, 15);
    }

    // My Teams Only is implicit (already filtered in loadTeamSchedule)

    if (filters.nationalOnly) {
      filtered = filtered.filter(game =>
        game.broadcasts.some(b => b.type === 'national')
      );
    }

    if (filters.availableOnly) {
      filtered = filtered.filter(game => isGameAvailable(game));
    }

    // Note: liveOnly not applicable to Team view

    return filtered.slice(0, 15); // Show next 15 games
  }, [games, filters, isGameAvailable]);

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

  const availableGames = filteredGames.filter(isGameAvailable).length;
  const blackedOutGames = filteredGames.filter(isGameBlackedOut).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {followedTeamCodes.length === 1 
            ? `${followedTeamCodes[0]} Schedule`
            : followedTeamCodes.length > 1
            ? `${followedTeamCodes.length} Teams Schedule`
            : 'Teams Schedule'}
        </Text>
        <Text style={styles.subtitle}>
          {followedTeamCodes.length > 1 
            ? `Next ${filteredGames.length} games from your teams`
            : `Next ${filteredGames.length} games`}
        </Text>

        {/* Stats Bar */}
        {filteredGames.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{availableGames}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            {blackedOutGames > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.statNumberWarning]}>{blackedOutGames}</Text>
                  <Text style={styles.statLabel}>Blackouts</Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* Game List - Now using unified GameCard */}
      <View style={styles.gamesContainer}>
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            userServiceCodes={userServiceCodes}
          />
        ))}
      </View>

      {filteredGames.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏒</Text>
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066CC',
    lineHeight: 28,
  },
  statNumberWarning: {
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
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
