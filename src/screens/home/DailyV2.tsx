/**
 * DailyV2 Screen - Vertical Infinite Scroll (Apple Calendar style)
 * Using FlatList with initialScrollIndex and stickyHeaderIndices
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

// Cache window: Today + 90 days forward (covers most of season)
const CACHE_WINDOW_DAYS_FORWARD = 90;

interface CachedDate {
  date: string; // YYYY-MM-DD
  games: NHLGame[];
  loaded: boolean;
}

// Flattened item types
type FlatItem = 
  | { type: 'header'; date: string; dateObj: Date; isToday: boolean; isFirst: boolean }
  | { type: 'game'; game: NHLGame }
  | { type: 'footer' };

export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, expandedGameIdBySport, setExpandedGameId } = useAppStore();
  
  const [gamesCache, setGamesCache] = useState<Map<string, CachedDate>>(new Map());
  const [cacheRange, setCacheRange] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userServiceCodes = subscriptions.map(s => s.service_code);
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;

  // Initialize cache with today + forward days
  useEffect(() => {
    initializeCache();
  }, []);

  const initializeCache = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start at today, load forward 45 days
    const start = new Date(today);
    
    const end = new Date(today);
    end.setDate(end.getDate() + CACHE_WINDOW_DAYS_FORWARD);
    
    await loadDateRange(start, end);
    setCacheRange({ start, end });
    setLoading(false);
  };

  // Auto-load more games when scrolling near end
  const handleEndReached = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newEnd = new Date(cacheRange.end);
    newEnd.setDate(newEnd.getDate() + 45); // Load 45 more days
    
    await loadDateRange(new Date(cacheRange.end.getTime() + 86400000), newEnd);
    
    setCacheRange({ start: cacheRange.start, end: newEnd });
    setLoadingMore(false);
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
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDateKey = (): string => {
    // Use local date components directly to avoid timezone issues
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateKey = useMemo(() => getTodayDateKey(), []);


  // Flatten sections into single array with headers interspersed + pre-calculate offsets
  const { flatData, stickyIndices, todayIndex, itemOffsets } = useMemo(() => {
    const sortedDates = Array.from(gamesCache.keys()).sort();
    const flat: FlatItem[] = [];
    const sticky: number[] = [];
    const offsets: number[] = [];
    let todayIdx = -1;
    let currentOffset = 0;

    const HEADER_HEIGHT = 44;
    const GAME_HEIGHT = 96;
    const FOOTER_HEIGHT = 60;

    console.log('Building flat data, today key:', todayDateKey);

    sortedDates.forEach((dateStr, sectionIdx) => {
      const cached = gamesCache.get(dateStr);
      const dateObj = new Date(dateStr + 'T12:00:00');
      const isToday = dateStr === todayDateKey;
      const isFirst = sectionIdx === 0;

      // Add header
      const headerIndex = flat.length;
      sticky.push(headerIndex);
      offsets.push(currentOffset);
      flat.push({ 
        type: 'header', 
        date: dateStr, 
        dateObj, 
        isToday,
        isFirst 
      });
      currentOffset += HEADER_HEIGHT;

      if (isToday) {
        todayIdx = headerIndex;
        console.log('Found today at flat index:', headerIndex, 'date:', dateStr);
      }

      // Add games
      const games = cached?.games || [];
      games.forEach(game => {
        offsets.push(currentOffset);
        flat.push({ type: 'game', game });
        currentOffset += GAME_HEIGHT;
      });
    });

    // Add footer
    offsets.push(currentOffset);
    flat.push({ type: 'footer' });

    console.log('Total items:', flat.length, 'Today index:', todayIdx);

    return { 
      flatData: flat, 
      stickyIndices: sticky,
      todayIndex: todayIdx,
      itemOffsets: offsets
    };
  }, [gamesCache, todayDateKey]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId?.('NHL', null);
    } else {
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const renderItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'header') {
      return <DateHeader date={item.dateObj} isToday={item.isToday} />;
    }

    if (item.type === 'footer') {
      return null;
    }

    // Game item
    const isExpanded = expandedGameId === item.game.id;
    
    if (isExpanded) {
      return (
        <VerticalGameCardExpanded
          game={item.game}
          userServiceCodes={userServiceCodes}
          onCollapse={() => setExpandedGameId?.('NHL', null)}
        />
      );
    }
    
    return (
      <VerticalGameCard
        game={item.game}
        userServiceCodes={userServiceCodes}
        onPress={() => handleGamePress(item.game.id)}
      />
    );
  };

  const scrollToToday = () => {
    // Today is always at top, scroll to 0
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  };

  const getItemKey = (item: FlatItem, index: number) => {
    if (item.type === 'header') return `header-${item.date}`;
    if (item.type === 'footer') return 'footer';
    return item.game.id;
  };

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
        data={flatData}
        renderItem={renderItem}
        keyExtractor={getItemKey}
        onEndReached={handleEndReached}
        onEndReachedThreshold={1.5}
        getItemLayout={(data, index) => {
          // Use pre-calculated offsets (O(1) lookup instead of O(n) iteration)
          if (!data || index >= data.length || index >= itemOffsets.length) {
            return { length: 96, offset: 96 * index, index };
          }
          
          const item = data[index];
          const HEADER_HEIGHT = 44;
          const GAME_HEIGHT = 96;
          const FOOTER_HEIGHT = 60;
          
          let length = GAME_HEIGHT;
          if (item.type === 'header') {
            length = HEADER_HEIGHT;
          } else if (item.type === 'footer') {
            length = FOOTER_HEIGHT;
          }
          
          return {
            length,
            offset: itemOffsets[index],
            index,
          };
        }}
        stickyHeaderIndices={stickyIndices}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 100);
        }}
        windowSize={10}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
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
});
