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

// Cache window: ±30 days from current date
const CACHE_WINDOW_DAYS = 30;

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

  // Initialize cache with today ±30 days
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
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDateKey = (): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to midnight
    return formatDateKey(now);
  };

  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  // Manual load functions
  const loadEarlierGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newStart = new Date(cacheRange.start);
    newStart.setDate(newStart.getDate() - 14);
    
    await loadDateRange(newStart, new Date(cacheRange.start.getTime() - 86400000));
    
    setCacheRange({ start: newStart, end: cacheRange.end });
    setLoadingMore(false);
  };

  const loadMoreGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newEnd = new Date(cacheRange.end);
    newEnd.setDate(newEnd.getDate() + 14);
    
    await loadDateRange(new Date(cacheRange.end.getTime() + 86400000), newEnd);
    
    setCacheRange({ start: cacheRange.start, end: newEnd });
    setLoadingMore(false);
  };

  // Flatten sections into single array with headers interspersed
  const { flatData, stickyIndices, todayIndex } = useMemo(() => {
    const sortedDates = Array.from(gamesCache.keys()).sort();
    const flat: FlatItem[] = [];
    const sticky: number[] = [];
    let todayIdx = -1;

    console.log('Building flat data, today key:', todayDateKey);

    sortedDates.forEach((dateStr, sectionIdx) => {
      const cached = gamesCache.get(dateStr);
      const dateObj = new Date(dateStr + 'T12:00:00');
      const isToday = dateStr === todayDateKey;
      const isFirst = sectionIdx === 0;

      // Add header
      const headerIndex = flat.length;
      sticky.push(headerIndex);
      flat.push({ 
        type: 'header', 
        date: dateStr, 
        dateObj, 
        isToday,
        isFirst 
      });

      if (isToday) {
        todayIdx = headerIndex;
        console.log('Found today at flat index:', headerIndex, 'date:', dateStr);
      }

      // Add games
      const games = cached?.games || [];
      games.forEach(game => {
        flat.push({ type: 'game', game });
      });
    });

    // Add footer
    flat.push({ type: 'footer' });

    console.log('Total items:', flat.length, 'Today index:', todayIdx);

    return { 
      flatData: flat, 
      stickyIndices: sticky,
      todayIndex: todayIdx 
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
      return (
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <DateHeader date={item.dateObj} isToday={item.isToday} />
          </View>
          {item.isFirst && (
            <TouchableOpacity 
              onPress={loadEarlierGames} 
              disabled={loadingMore}
              style={styles.inlineLink}
              activeOpacity={0.7}
            >
              <Text style={[styles.inlineLinkText, { color: '#00D9FF' }]}>
                {loadingMore ? '...' : 'Earlier Games...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (item.type === 'footer') {
      return (
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            onPress={loadMoreGames} 
            disabled={loadingMore}
            activeOpacity={0.7}
          >
            <Text style={[styles.footerLinkText, { color: '#00D9FF' }]}>
              {loadingMore ? 'Loading...' : 'More Games...'}
            </Text>
          </TouchableOpacity>
        </View>
      );
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
    if (todayIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: todayIndex,
        animated: true,
        viewPosition: 0,
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
      {/* Debug Info */}
      <View style={{ backgroundColor: '#FF0000', padding: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
          DEBUG: Today={todayDateKey} | TodayIndex={todayIndex} | TotalItems={flatData.length}
        </Text>
      </View>
      
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
        initialScrollIndex={todayIndex >= 0 ? todayIndex : 0}
        getItemLayout={(data, index) => {
          // Calculate accurate layout for sticky headers
          if (!data || index >= data.length) {
            return { length: 96, offset: 96 * index, index };
          }
          
          const item = data[index];
          const HEADER_HEIGHT = 44;
          const GAME_HEIGHT = 96;
          
          let offset = 0;
          let currentHeight = GAME_HEIGHT;
          
          // Calculate offset by iterating through previous items
          for (let i = 0; i < index; i++) {
            const prevItem = data[i];
            if (prevItem.type === 'header') {
              offset += HEADER_HEIGHT;
            } else if (prevItem.type === 'game') {
              offset += GAME_HEIGHT;
            } else {
              offset += 60; // footer
            }
          }
          
          // Determine current item height
          if (item.type === 'header') {
            currentHeight = HEADER_HEIGHT;
          } else if (item.type === 'footer') {
            currentHeight = 60;
          }
          
          return {
            length: currentHeight,
            offset,
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inlineLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
