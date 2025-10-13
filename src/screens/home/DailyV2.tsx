/**
 * DailyV2 Screen - Vertical Infinite Scroll (Apple Calendar style)
 * Smart caching with windowed prefetch
 * Using SectionList for proper sectioned data structure (see ARCHITECTURE.md)
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  SectionListData,
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

// Cache window: ±30 days from current date (2 months total)
const CACHE_WINDOW_DAYS = 30;
const PREFETCH_INCREMENT_DAYS = 14; // Load 14 more days when user requests

interface CachedDate {
  games: NHLGame[];
  loaded: boolean;
}

interface GameSection {
  title: string; // Date key (YYYY-MM-DD)
  date: Date;
  isToday: boolean;
  data: NHLGame[];
}

export const DailyV2: React.FC = () => {
  const { colors } = useTheme();
  const { subscriptions, expandedGameIdBySport, setExpandedGameId } = useAppStore();
  
  const [gamesCache, setGamesCache] = useState<Record<string, CachedDate>>({});
  const [cacheRange, setCacheRange] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const sectionListRef = React.useRef<SectionList<NHLGame, GameSection>>(null);
  const hasScrolledToToday = React.useRef(false);

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
    const newData: Record<string, CachedDate> = {};
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = formatDateKey(currentDate);
      
      // Only load if not already in cache
      if (!gamesCache[dateStr]) {
        try {
          const games = await getGamesForDate(new Date(currentDate));
          newData[dateStr] = {
            games,
            loaded: true,
          };
        } catch (error) {
          console.error(`Error loading games for ${dateStr}:`, error);
          newData[dateStr] = {
            games: [],
            loaded: true,
          };
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Merge new data with existing cache
    setGamesCache(prev => ({ ...prev, ...newData }));
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

  // Manual prefetch - user triggered only

  const loadEarlierGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newStart = new Date(cacheRange.start);
    newStart.setDate(newStart.getDate() - PREFETCH_INCREMENT_DAYS);
    
    await loadDateRange(newStart, new Date(cacheRange.start.getTime() - 86400000));
    
    setCacheRange({ start: newStart, end: cacheRange.end });
    setLoadingMore(false);
  };

  const loadMoreGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newEnd = new Date(cacheRange.end);
    newEnd.setDate(newEnd.getDate() + PREFETCH_INCREMENT_DAYS);
    
    await loadDateRange(new Date(cacheRange.end.getTime() + 86400000), newEnd);
    
    setCacheRange({ start: cacheRange.start, end: newEnd });
    setLoadingMore(false);
  };

  // Memoize today's date string to avoid recalculating
  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  // Build sections from cache - only after cache is complete and sorted
  const sections = useMemo((): GameSection[] => {
    const keys = Object.keys(gamesCache).sort();
    
    return keys.map(key => ({
      title: key,
      date: new Date(key + 'T12:00:00'),
      isToday: key === todayDateKey,
      data: gamesCache[key]?.games ?? [],
    }));
  }, [gamesCache, todayDateKey]);

  // Scroll to today after content is laid out
  const handleContentReady = () => {
    if (!hasScrolledToToday.current && sectionListRef.current && sections.length > 0) {
      const todayIndex = sections.findIndex(s => s.title === todayDateKey);
      if (todayIndex >= 0) {
        hasScrolledToToday.current = true;
        requestAnimationFrame(() => {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: todayIndex,
            itemIndex: 0,
            animated: false,
          });
        });
      }
    }
  };

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId?.('NHL', null);
    } else {
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<NHLGame, GameSection> }) => {
    return <DateHeader date={section.date} isToday={section.isToday} />;
  };

  const renderItem = ({ item }: { item: NHLGame }) => {
    const isExpanded = expandedGameId === item.id;
    
    if (isExpanded) {
      return (
        <VerticalGameCardExpanded
          game={item}
          userServiceCodes={userServiceCodes}
          onCollapse={() => setExpandedGameId?.('NHL', null)}
        />
      );
    }
    
    return (
      <VerticalGameCard
        game={item}
        userServiceCodes={userServiceCodes}
        onPress={() => handleGamePress(item.id)}
      />
    );
  };

  // Go to today function
  const scrollToToday = () => {
    const todayIndex = sections.findIndex(s => s.title === todayDateKey);
    if (todayIndex >= 0) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: todayIndex,
        itemIndex: 0,
        animated: true,
      });
    }
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

      <SectionList<NHLGame, GameSection>
        ref={sectionListRef}
        sections={sections}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={true}
        onContentSizeChange={handleContentReady}
        initialNumToRender={15}
        windowSize={10}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.loadMoreButton, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            onPress={loadEarlierGames}
            disabled={loadingMore}
            activeOpacity={0.7}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load Earlier Games (14 days)
              </Text>
            )}
          </TouchableOpacity>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.loadMoreButton, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
            onPress={loadMoreGames}
            disabled={loadingMore}
            activeOpacity={0.7}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More Games (14 days)
              </Text>
            )}
          </TouchableOpacity>
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
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
