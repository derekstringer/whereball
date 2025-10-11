/**
 * DailyV2 Screen - Hybrid Scoreboard + Schedule Layout
 * Experimental replacement for Tonight/Daily view
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { getGamesForDate, type NHLGame } from '../../lib/nhl-api';
import { SectionHeader } from '../../components/daily-v2/SectionHeader';
import { ScoreboardStrip } from '../../components/daily-v2/ScoreboardStrip';
import { FilterPanel } from '../../components/daily-v2/FilterPanel';

export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, follows, filters } = useAppStore();
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelHeight] = useState(new Animated.Value(0));

  const userServiceCodes = subscriptions.map(s => s.service_code);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const gamesForDate = await getGamesForDate(today);
      setGames(gamesForDate);
    } catch (err) {
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 180;
    setShowFilters(!showFilters);
    
    Animated.timing(filterPanelHeight, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Group games by sport
  const gamesBySport = useMemo(() => {
    const grouped: Record<string, NHLGame[]> = {};
    games.forEach(game => {
      const sport = 'NHL'; // Currently only NHL
      if (!grouped[sport]) {
        grouped[sport] = [];
      }
      grouped[sport].push(game);
    });
    return grouped;
  }, [games]);

  // Filter sports based on user preferences
  const visibleSports = useMemo(() => {
    return Object.keys(gamesBySport).filter(sport => {
      if (filters.sports.length === 0) return true;
      return filters.sports.includes(sport.toLowerCase());
    });
  }, [gamesBySport, filters.sports]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Today</Text>
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleFilters}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, { color: colors.text }]}>🎚️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {/* TODO: Search */}}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, { color: colors.text }]}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Panel */}
      <Animated.View style={[{ height: filterPanelHeight, overflow: 'hidden' }]}>
        <FilterPanel />
      </Animated.View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {visibleSports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No games today for selected sports
            </Text>
          </View>
        ) : (
          visibleSports.map(sport => (
            <View key={sport} style={styles.sportSection}>
              <SectionHeader sport={sport} />
              <ScoreboardStrip
                games={gamesBySport[sport] || []}
                userServiceCodes={userServiceCodes}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  appBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  sportSection: {
    marginBottom: 24,
  },
});
