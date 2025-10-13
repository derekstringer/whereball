/**
 * DailyV2 Screen - Vertical Infinite Scroll (Apple Calendar style)
 * Smart caching with windowed prefetch
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { getGamesForDate, type NHLGame } from '../../lib/nhl-api';
import { DateHeader } from '../../components/daily-v2/DateHeader';
import { VerticalGameCard } from '../../components/daily-v2/VerticalGameCard';
import { VerticalGameCardExpanded } from '../../components/daily-v2/VerticalGameCardExpanded';
import { FilterBottomSheet } from '../../components/ui/FilterBottomSheet';
import { SettingsScreen } from '../settings/SettingsScreen';

// Cache window: ±14 days from current date
const CACHE_WINDOW_DAYS = 14;
const PREFETCH_THRESHOLD_DAYS = 10; // Trigger prefetch when within 10 days of edge

interface CachedDate {
  date: string; // YYYY-MM-DD
  games: NHLGame[];
  loaded: boolean;
}

interface ListItem {
  type: 'date' | 'game';
  id: string;
  date?: Date;
  game?: NHLGame;
  isToday?: boolean;
  dateKey?: string;
}

export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, expandedGameIdBySport, setExpandedGameId } = useAppStore();
  
  const [gamesCache, setGamesCache] = useState<Map<string, CachedDate>>(new Map());
  const [cacheRange, setCacheRange] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const lastPrefetchTime = React.useRef<number>(0);
  const hasScrolledToToday = React.useRef(false);
  const isProgrammaticScroll = React.useRef(false);
  const PREFETCH_COOLDOWN_MS = 500; // 500ms cooldown between prefetches

  const userServiceCodes = subscriptions.map(s => s.service_code);
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;

  // Initialize cache with today ±14 days
  useEffect(() => {
    initializeCache();
  }, []);

  const initializeCache = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(today);
    start.setDate(start.getDate() - CACHE_WINDOW_DAYS);
    
    const end = new Date(today);
    end.setDate(end.getDate() + CACHE_WINDOW_DAYS);
    
    await loadDateRange(start, end);
    setCacheRange({ start, end });
    setLoading(false);
  };

  const loadDateRange = async (start: Date, end: Date) => {
    const promises: Promise<void>[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = formatDateKey(currentDate);
      
      // Only load if not already in cache
      if (!gamesCache.has(dateStr)) {
        promises.push(loadDateGames(new Date(currentDate)));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    await Promise.all(promises);
  };

  const loadDateGames = async (date: Date) => {
    const dateStr = formatDateKey(date);
    
    try {
      const games = await getGamesForDate(date);
      
      setGamesCache(prev => {
        const newCache = new Map(prev);
        newCache.set(dateStr, {
          date: dateStr,
          games,
          loaded: true,
        });
        return newCache;
      });
    } catch (error) {
      console.error(`Error loading games for ${dateStr}:`, error);
      setGamesCache(prev => {
        const newCache = new Map(prev);
        newCache.set(dateStr, {
          date: dateStr,
          games: [],
          loaded: true,
        });
        return newCache;
      });
    }
  };

  const formatDateKey = (date: Date): string => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDateKey = (): string => {
    const now = new Date();
    return formatDateKey(now);
  };

  // Check if we need to prefetch more data
  const checkPrefetch = useCallback((visibleDates: string[]) => {
    // Skip prefetch during programmatic scrolling
    if (isProgrammaticScroll.current) return;
    if (!cacheRange || loadingMore) return;

    // Enforce cooldown period
    const now = Date.now();
    if (now - lastPrefetchTime.current < PREFETCH_COOLDOWN_MS) return;

    const sortedDates = visibleDates.sort();
    if (sortedDates.length === 0) return;

    const firstVisible = new Date(sortedDates[0]);
    const lastVisible = new Date(sortedDates[sortedDates.length - 1]);

    // Check if we're within threshold of cache edges
    const daysSinceStart = Math.floor(
      (firstVisible.getTime() - cacheRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilEnd = Math.floor(
      (cacheRange.end.getTime() - lastVisible.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceStart <= PREFETCH_THRESHOLD_DAYS) {
      // Prefetch earlier dates
      lastPrefetchTime.current = now;
      prefetchEarlier();
    } else if (daysUntilEnd <= PREFETCH_THRESHOLD_DAYS) {
      // Prefetch later dates
      lastPrefetchTime.current = now;
      prefetchLater();
    }
  }, [cacheRange, loadingMore]);

  const prefetchEarlier = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newStart = new Date(cacheRange.start);
    newStart.setDate(newStart.getDate() - 7);
    
    await loadDateRange(newStart, new Date(cacheRange.start.getTime() - 86400000));
    
    setCacheRange({ start: newStart, end: cacheRange.end });
    setLoadingMore(false);
  };

  const prefetchLater = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newEnd = new Date(cacheRange.end);
    newEnd.setDate(newEnd.getDate() + 7);
    
    await loadDateRange(new Date(cacheRange.end.getTime() + 86400000), newEnd);
    
    setCacheRange({ start: cacheRange.start, end: newEnd });
    setLoadingMore(false);
  };

  // Memoize today's date string to avoid recalculating
  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  // Build flat list data from cache
  const listData = useMemo(() => {
    const items: ListItem[] = [];
    
    // Sort cache by date
    const sortedDates = Array.from(gamesCache.keys()).sort();
    
    sortedDates.forEach(dateStr => {
      const cached = gamesCache.get(dateStr);
      if (!cached) return;
      
      const date = new Date(dateStr + 'T12:00:00');
      const isToday = dateStr === todayDateKey;
      
      // Add date header
      items.push({
        type: 'date',
        id: `date-${dateStr}`,
        date,
        isToday,
        dateKey: dateStr,
      });
      
      // Add games for this date
      cached.games.forEach(game => {
        items.push({
          type: 'game',
          id: `game-${game.id}`,
          game,
        });
      });
    });
    
    return items;
  }, [gamesCache, todayDateKey]);

  // Scroll to today after initial load
  React.useEffect(() => {
    if (!loading && listData.length > 0 && !hasScrolledToToday.current) {
      const index = listData.findIndex(item => item.type === 'date' && item.dateKey === todayDateKey);
      
      if (index >= 0 && flatListRef.current) {
        hasScrolledToToday.current = true;
        isProgrammaticScroll.current = true;
        
        // Use same double-scroll technique as scrollToToday button
        flatListRef.current.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0,
        });
        // Second scroll for accuracy after React Native measures items
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0,
          });
          isProgrammaticScroll.current = false;
        }, 50);
      }
    }
  }, [loading, todayDateKey]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId?.('NHL', null);
    } else {
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'date') {
      return <DateHeader date={item.date!} isToday={item.isToday} />;
    }
    
    const game = item.game!;
    const isExpanded = expandedGameId === game.id;
    
    if (isExpanded) {
      return (
        <VerticalGameCardExpanded
          game={game}
          userServiceCodes={userServiceCodes}
          onCollapse={() => setExpandedGameId?.('NHL', null)}
        />
      );
    }
    
    return (
      <VerticalGameCard
        game={game}
        userServiceCodes={userServiceCodes}
        onPress={() => handleGamePress(game.id)}
      />
    );
  };

  // Go to today function
  const scrollToToday = () => {
    const index = listData.findIndex(item => item.type === 'date' && item.dateKey === todayDateKey);
    
    if (index >= 0 && flatListRef.current) {
      isProgrammaticScroll.current = true;
      flatListRef.current.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0,
      });
      // Second scroll for accuracy after React Native measures items
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0,
        });
        isProgrammaticScroll.current = false;
      }, 50);
    }
  };

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const visibleDates = viewableItems
      .filter((item: any) => item.item.type === 'date')
      .map((item: any) => item.item.dateKey)
      .filter(Boolean);
    
    checkPrefetch(visibleDates);
  }, [checkPrefetch]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>WhereBall</Text>
          <TouchableOpacity onPress={scrollToToday} activeOpacity={0.7}>
            <Text style={styles.goToToday}>Go To Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterIcon, { color: colors.text }]}>🎚️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            const index = listData.findIndex(item => item.type === 'date' && item.dateKey === todayDateKey);
            if (flatListRef.current && index >= 0) {
              flatListRef.current.scrollToIndex({
                index,
                animated: false,
                viewPosition: 0,
              });
            }
          }, 100);
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  goToToday: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9FF',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
