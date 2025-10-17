/**
 * DailyV3 - Minimal SectionList Implementation
 * Step 1: Prove smooth scrolling with SectionList
 * - Load today -30 to +60 days (fixed, no dynamic loading)
 * - Sticky date headers
 * - Collapsed game cards only
 * - Scroll to today on mount
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  AppState,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { getGamesForDate, getLiveGameClock, type NHLGame } from '../../lib/nhl-api';
import { DateHeader } from '../../components/daily-v2/DateHeader';
import { VerticalGameCard } from '../../components/daily-v2/VerticalGameCard';
import { VerticalGameCardExpanded } from '../../components/daily-v2/VerticalGameCardExpanded';
import { SettingsScreen } from '../settings/SettingsScreen';
import { FiltersSheetV2 } from '../../components/ui/filters-v2/FiltersSheetV2';
import { FEATURES } from '../../config/features';
import { applyFilters, buildMatchPredicate, UserFilterContext } from '../../lib/filters-v2-engine';

interface GameSection {
  title: string; // YYYY-MM-DD
  dateObj: Date;
  isToday: boolean;
  data: NHLGame[];
}

export const DailyV3: React.FC = () => {
  const { colors } = useTheme();
  const { 
    subscriptions, 
    follows,
    filtersV2,
    expandedGameIdBySport, 
    setExpandedGameId 
  } = useAppStore();
  
  const [sections, setSections] = useState<GameSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const sectionListRef = useRef<SectionList<NHLGame, GameSection>>(null);
  const [dateRange, setDateRange] = useState({ start: -30, end: 60 });
  const isScrollingToToday = useRef(false);
  
  const userServiceCodes = useMemo(() => subscriptions.map(s => s.service_code), [subscriptions]);
  const userFollows = useMemo(() => follows.map(f => f.team_id), [follows]);
  const currentTime = useRef(new Date()).current;
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;

  // Apply filters to sections
  const filteredSections = useMemo(() => {
    if (!FEATURES.USE_FILTERS_V2) {
      return sections;
    }

    const filterContext: UserFilterContext = {
      follows,
      subscriptions,
    };
    
    return sections.map(section => ({
      ...section,
      data: applyFilters(section.data as any[], filtersV2, filterContext) as unknown as NHLGame[],
    }));
  }, [sections, filtersV2, userFollows, userServiceCodes]);

  // Get today's date key
  const getTodayDateKey = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateKey = useMemo(() => getTodayDateKey(), []);

  // Initialize: Load today -30 to +60 days
  useEffect(() => {
    loadInitialData();
  }, []);

  // Live polling: Refresh games every 15 seconds when app is active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      // Poll immediately
      refreshLiveGames();
      
      // Then poll every 15 seconds
      pollInterval = setInterval(() => {
        refreshLiveGames();
      }, 15000);
    };
    
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
    
    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    });
    
    // Start polling if app is currently active
    if (AppState.currentState === 'active') {
      startPolling();
    }
    
    // Cleanup
    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []); // Remove sections dependency to prevent infinite loop

  // Refresh games for today and nearby dates (where live games might be)
  const refreshLiveGames = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Refresh today and yesterday (in case games started late)
    const datesToRefresh = [0, -1];
    
    for (const dayOffset of datesToRefresh) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = formatDateKey(date);
      
      try {
        const games = await getGamesForDate(date);
        
        // Fetch real-time clock data for live games
        const gamesWithClock = await Promise.all(
          games.map(async (game) => {
            // Only fetch clock for games that appear to be live
            if (game.gameState === 'LIVE' || 
                (game.homeTeam.score !== undefined || game.awayTeam.score !== undefined)) {
              const clock = await getLiveGameClock(game.id);
              if (clock) {
                return { ...game, clock };
              }
            }
            return game;
          })
        );
        
        // Update the section for this date
        setSections(prev => 
          prev.map(section => 
            section.title === dateStr
              ? { ...section, data: gamesWithClock }
              : section
          )
        );
      } catch (error) {
        console.error(`Error refreshing games for ${dateStr}:`, error);
      }
    }
  };

  const loadInitialData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Build date range: -30 to +60
    const dates: Date[] = [];
    for (let i = dateRange.start; i <= dateRange.end; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    // Load all games in parallel
    const results = await Promise.all(
      dates.map(async (date) => {
        const dateStr = formatDateKey(date);
        try {
          const games = await getGamesForDate(date);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: games,
          };
        } catch (error) {
          console.error(`Error loading games for ${dateStr}:`, error);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: [],
          };
        }
      })
    );
    
    setSections(results);
    setLoading(false);
  };

  const loadMoreBackward = async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Load 30 more days backward
    const newStart = dateRange.start - 30;
    const dates: Date[] = [];
    for (let i = newStart; i < dateRange.start; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    // Load all games in parallel
    const results = await Promise.all(
      dates.map(async (date) => {
        const dateStr = formatDateKey(date);
        try {
          const games = await getGamesForDate(date);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: games,
          };
        } catch (error) {
          console.error(`Error loading games for ${dateStr}:`, error);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: [],
          };
        }
      })
    );
    
    // Prepend to existing sections
    setSections(prev => [...results, ...prev]);
    setDateRange({ start: newStart, end: dateRange.end });
    setLoadingMore(false);
  };

  const loadMoreForward = async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Load 30 more days forward
    const newEnd = dateRange.end + 30;
    const dates: Date[] = [];
    for (let i = dateRange.end + 1; i <= newEnd; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    // Load all games in parallel
    const results = await Promise.all(
      dates.map(async (date) => {
        const dateStr = formatDateKey(date);
        try {
          const games = await getGamesForDate(date);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: games,
          };
        } catch (error) {
          console.error(`Error loading games for ${dateStr}:`, error);
          return {
            title: dateStr,
            dateObj: date,
            isToday: dateStr === todayDateKey,
            data: [],
          };
        }
      })
    );
    
    // Append to existing sections
    setSections(prev => [...prev, ...results]);
    setDateRange({ start: dateRange.start, end: newEnd });
    setLoadingMore(false);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // Don't trigger loading if we're in the middle of "Go To Today"
    if (isScrollingToToday.current) {
      return;
    }
    
    // If scrolled near top (within 500px), load more backward
    if (offsetY < 500 && !loadingMore) {
      loadMoreBackward();
    }
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate initial scroll index (flat item index to today's header)
  const initialScrollIndex = useMemo(() => {
    const todaySectionIndex = filteredSections.findIndex(s => s.isToday);
    if (todaySectionIndex === -1) return 0;
    
    // Calculate total flat items before today's section
    let flatIndex = 0;
    for (let i = 0; i < todaySectionIndex; i++) {
      flatIndex += 1; // header
      flatIndex += filteredSections[i].data.length; // items
      flatIndex += 1; // footer
    }
    
    // flatIndex now points to today's header (don't add 1 more)
    // This makes the header stick immediately
    
    console.log('Today section:', todaySectionIndex, 'Flat index (header):', flatIndex);
    return flatIndex;
  }, [filteredSections]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      // Collapse if already expanded
      setExpandedGameId?.('NHL', null);
    } else {
      // Expand this game
      setExpandedGameId?.('NHL', gameId);
    }
  };

  const scrollToToday = () => {
    const todaySectionIndex = filteredSections.findIndex(s => s.isToday);
    if (todaySectionIndex !== -1 && sectionListRef.current) {
      // Set flag to prevent handleScroll from triggering loads
      isScrollingToToday.current = true;
      
      // Use scrollToLocation with viewOffset to ensure proper positioning
      sectionListRef.current.scrollToLocation({
        sectionIndex: todaySectionIndex,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
        viewOffset: 0,
      });
      
      // Fallback: If still not visible after animation, try again
      setTimeout(() => {
        const checkIndex = filteredSections.findIndex(s => s.isToday);
        if (checkIndex !== -1 && sectionListRef.current) {
          sectionListRef.current.scrollToLocation({
            sectionIndex: checkIndex,
            itemIndex: 0,
            animated: false,
            viewPosition: 0,
            viewOffset: 0,
          });
        }
        
        // Clear flag after scroll is complete
        setTimeout(() => {
          isScrollingToToday.current = false;
        }, 100);
      }, 500);
    }
  };

  const renderSectionHeader = ({ section }: { section: GameSection }) => {
    return <DateHeader date={section.dateObj} isToday={section.isToday} />;
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
        currentTime={currentTime}
        onPress={() => handleGamePress(item.id)}
      />
    );
  };

  const renderSectionFooter = () => {
    // Small spacer between sections
    return <View style={styles.sectionSpacer} />;
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
      {/* Simple Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>SportStream</Text>
          <TouchableOpacity onPress={scrollToToday} activeOpacity={0.7}>
            <Text style={styles.goToToday}>Go To Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: colors.primary }]}>🔍</Text>
        </TouchableOpacity>
      </View>

      <SectionList<NHLGame, GameSection>
        ref={sectionListRef}
        sections={filteredSections}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={true}
        initialScrollIndex={initialScrollIndex}
        removeClippedSubviews={false}
        windowSize={10}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onEndReached={loadMoreForward}
        onEndReachedThreshold={0.5}
        getItemLayout={(data, index) => {
          // Approximate heights for performance
          const HEADER_HEIGHT = 44;
          const ITEM_HEIGHT = 96;
          const FOOTER_HEIGHT = 8;
          
          // Calculate offset based on sections before this index
          let offset = 0;
          let currentItemIndex = 0;
          
          for (let i = 0; i < filteredSections.length; i++) {
            const section = filteredSections[i];
            const sectionItemCount = section.data.length;
            
            if (currentItemIndex + sectionItemCount + 2 <= index) {
              // Full section before target
              offset += HEADER_HEIGHT + (sectionItemCount * ITEM_HEIGHT) + FOOTER_HEIGHT;
              currentItemIndex += sectionItemCount + 2; // +2 for header and footer
            } else {
              // Target is in this section
              const itemIndexInSection = index - currentItemIndex;
              if (itemIndexInSection === 0) {
                // It's the header
                return { length: HEADER_HEIGHT, offset, index };
              } else if (itemIndexInSection <= sectionItemCount) {
                // It's an item
                offset += HEADER_HEIGHT + ((itemIndexInSection - 1) * ITEM_HEIGHT);
                return { length: ITEM_HEIGHT, offset, index };
              } else {
                // It's the footer
                offset += HEADER_HEIGHT + (sectionItemCount * ITEM_HEIGHT);
                return { length: FOOTER_HEIGHT, offset, index };
              }
            }
          }
          
          return { length: ITEM_HEIGHT, offset, index };
        }}
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

      {/* Filters Modal */}
      {FEATURES.USE_FILTERS_V2 ? (
        <FiltersSheetV2 
          visible={showFilters}
          onClose={() => setShowFilters(false)}
        />
      ) : (
        <Modal
          visible={showFilters}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <Text style={{ color: colors.text, padding: 20 }}>Filters (Old) - Not implemented</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={{ color: colors.primary, padding: 20 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  sectionSpacer: {
    height: 8,
  },
});
