/**
 * Tonight Screen - Main Home Screen
 * Shows today's NHL games with broadcast info
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { GameCard } from '../../components/game/GameCard';
import { getTodaysGames, type NHLGame } from '../../lib/nhl-api';
import { trackEvent } from '../../lib/analytics';

export const TonightScreen: React.FC = () => {
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <Text style={styles.title}>Tonight</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

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
        ) : (
          <View style={styles.gamesContainer}>
            <Text style={styles.gamesCount}>
              {games.length} game{games.length !== 1 ? 's' : ''} today
            </Text>
            {games.map((game) => (
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666666',
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
