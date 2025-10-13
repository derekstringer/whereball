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
  InteractionManager,
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

interface GameSection {
  title: string; // Date key (YYYY-MM-DD)
  date: Date;
  isToday: boolean;
  data: NHLGame[];
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
  const sectionListRef = React.useRef<SectionList<NHLGame, GameSection>>(null);
  const isProgrammaticScroll = React.useRef(false);

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

  // Manual load functions (user-triggered only)
  const loadEarlierGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newStart = new Date(cacheRange.start);
    newStart.setDate(newStart.getDate() - 14); // Load 14 more days
    
    await loadDateRange(newStart, new Date(cacheRange.start.getTime() - 86400000));
    
    setCacheRange({ start: newStart, end: cacheRange.end });
    setLoadingMore(false);
  };

  const loadMoreGames = async () => {
    if (!cacheRange || loadingMore) return;
    
    setLoadingMore(true);
    const newEnd = new Date(cacheRange.end);
    newEnd.setDate(newEnd.getDate() + 14); // Load 14 more days
    
    await loadDateRange(new Date(cacheRange.end.getTime() + 86400000), newEnd);
    
    setCacheRange({ start: cacheRange.start, end: newEnd });
    setLoadingMore(false);
  };

  // Memoize today's date string to avoid recalculating
  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  // Build sections from cache
  const sections = useMemo((): GameSection[] => {
    // Sort cache by date
    const sortedDates = Array.from(gamesCache.keys()).sort();
    
    return sortedDates.map(dateStr => {
      const cached = gamesCache.get(dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const isToday = dateStr === todayDateKey;
      
      return {
        title: dateStr,
        date,
        isToday,
        data: cached?.games || [],
      };
    });
  }, [gamesCache, todayDateKey]);

  // Scroll to today section after data loads
  React.useEffect(() => {
    if (!loading && sections.length > 0) {
      const todayIndex = sections.findIndex(section => section.title === todayDateKey);
      
      if (todayIndex >= 0) {
        // Use InteractionManager to wait for everything to render
        const handle = InteractionManager.runAfterInteractions(() => {
          if (sectionListRef.current) {
            isProgrammaticScroll.current = true;
            try {
              sectionListRef.current.scrollToLocation({
                sectionIndex: todayIndex,
                itemIndex: 0,
                animated: false,
                viewPosition: 0,
              });
            } catch (error) {
              console.log('Initial scroll failed:', error);
            }
            
            // Second attempt after short delay
            setTimeout(() => {
              try {
                if (sectionListRef.current) {
                  sectionListRef.current.scrollToLocation({
                    sectionIndex: todayIndex,
                    itemIndex: 0,
                    animated: false,
                    viewPosition: 0,
                  });
                }
              } catch (error) {
                console.log('Second scroll attempt failed:', error);
              }
              isProgrammaticScroll.current = false;
            }, 100);
          }
        });
        
        return () => handle.cancel();
      }
    }
  }, [loading, sections.length, todayDateKey]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId?.('NHL', null);
    } else {
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<NHLGame, GameSection> }) => {
    const isFirstSection = sections[0]?.title === section.title;
    
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <DateHeader date={section.date} isToday={section.isToday} />
          </View>
          {isFirstSection && (
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
      </View>
    );
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
    const todayIndex = sections.findIndex(section => section.title === todayDateKey);
    
    if (todayIndex >= 0 && sectionListRef.current) {
      isProgrammaticScroll.current = true;
      sectionListRef.current.scrollToLocation({
        sectionIndex: todayIndex,
        itemIndex: 0,
        animated: false,
        viewPosition: 0,
      });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
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
        onScrollToIndexFailed={(info: any) => {
          setTimeout(() => {
            const todayIndex = sections.findIndex(section => section.title === todayDateKey);
            if (sectionListRef.current && todayIndex >= 0) {
              sectionListRef.current.scrollToLocation({
                sectionIndex: todayIndex,
                itemIndex: 0,
                animated: false,
                viewPosition: 0,
              });
            }
          }, 100);
        }}
        ListFooterComponent={
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
  sectionHeaderRow: {
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
