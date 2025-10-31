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
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { ViewDropdownPopover } from '../../components/ui/ViewDropdownPopover';
import { getGamesForDate, getLiveGameClock, type NHLGame } from '../../lib/nhl-api';
import { DateHeader } from '../../components/daily-v2/DateHeader';
import { VerticalGameCard } from '../../components/daily-v2/VerticalGameCard';
import { VerticalGameCardExpanded } from '../../components/daily-v2/VerticalGameCardExpanded';
import { EmptyStateCard } from '../../components/daily-v2/EmptyStateCard';
import { SettingsSheet } from '../settings/SettingsSheet';
import { FiltersSheetV2 } from '../../components/ui/filters-v2/FiltersSheetV2';
import { FEATURES } from '../../config/features';
import { applyFilters, buildMatchPredicate, UserFilterContext } from '../../lib/filters-v2-engine';
import { mapNHLGamesToFilterable } from '../../lib/game-mapper';

interface GameSection {
  title: string; // YYYY-MM-DD
  dateObj: Date;
  isToday: boolean;
  data: NHLGame[];
}

interface DailyV3Props {
  viewMode?: 'my-teams' | 'explore' | 'reminders';
}

export const DailyV3: React.FC<DailyV3Props> = ({ viewMode = 'my-teams' }) => {
  const { colors } = useTheme();
  const { 
    subscriptions, 
    follows,
    filtersV2,
    expandedGameIdBySport, 
    setExpandedGameId,
    alerts
  } = useAppStore();
  
  const [sections, setSections] = useState<GameSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const sectionListRef = useRef<SectionList<NHLGame, GameSection>>(null);
  const [dateRange, setDateRange] = useState({ start: -30, end: 60 });
  const isScrollingToToday = useRef(false);
  
  const userServiceCodes = useMemo(() => subscriptions.map(s => s.service_code), [subscriptions]);
  const userFollows = useMemo(() => follows.map(f => f.team_id), [follows]);
  const currentTime = useRef(new Date()).current;
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;
  
  // Count pending reminders for FUT games
  const reminderCount = useMemo(() => {
    const uniqueGameIds = new Set(alerts.map(a => a.game_id));
    let count = 0;
    
    uniqueGameIds.forEach(gameId => {
      // Find the game in sections
      const game = sections.flatMap(s => s.data).find(g => g.id === gameId);
      if (game && game.gameState === 'FUT') {
        const pendingAlerts = alerts.filter(a => a.game_id === gameId && a.status === 'pending');
        if (pendingAlerts.length > 0) {
          count++;
        }
      }
    });
    
    return count;
  }, [alerts, sections]);

  // Apply filters to sections AND skip empty dates
  const filteredSections = useMemo(() => {
    if (!FEATURES.USE_FILTERS_V2) {
      return sections;
    }

    const filterContext: UserFilterContext = {
      follows,
      subscriptions,
    };
    
    return sections
      .map(section => {
        // Convert NHLGames to FilterableGames format
        const filterableGames = mapNHLGamesToFilterable(section.data);
        // Apply filters
        const filtered = applyFilters(filterableGames, filtersV2, filterContext);
        // Extract original game IDs that passed the filter
        const passedIds = new Set(filtered.map(g => g.id));
        // Return only the original games that passed
        return {
          ...section,
          data: section.data.filter(game => passedIds.has(game.id)),
        };
      })
      .filter(section => section.data.length > 0); // SKIP EMPTY DATES
  }, [sections, filtersV2, userFollows, userServiceCodes, follows, subscriptions]);

  // Detect empty state scenarios
  const hasAnyGames = useMemo(() => {
    return filteredSections.some(section => section.data.length > 0);
  }, [filteredSections]);

  const emptyStateInfo = useMemo(() => {
    if (hasAnyGames || !FEATURES.USE_FILTERS_V2) return null;

    // Scenario 1: MY_TEAMS but no followed teams
    if (filtersV2.quickView.startsWith('my_teams') && follows.length === 0) {
      return {
        message: "You're not following any teams yet",
        description: "Follow some teams to see their games, or switch to see all games.",
        actions: [
          {
            label: 'See All Games',
            primary: true,
            onPress: () => {
              // Switch to ALL_GAMES with same service scope
              const newPreset = filtersV2.quickView.endsWith('my_services')
                ? 'all_games_my_services' as const
                : 'all_games_any_service' as const;
              useAppStore.getState().setFiltersV2({ ...filtersV2, quickView: newPreset, lastPreset: newPreset });
            },
          },
          {
            label: 'Follow Teams',
            onPress: () => setShowFilters(true),
          },
        ],
      };
    }

    // Scenario 2: ALL_GAMES ON MY_SERVICES but nothing watchable
    if (filtersV2.quickView === 'all_games_my_services') {
      return {
        message: "No games on your services right now",
        description: "Try expanding to any service, or manage your service subscriptions.",
        actions: [
          {
            label: "Turn On 'Any Service'",
            primary: true,
            onPress: () => {
              useAppStore.getState().setFiltersV2({
                ...filtersV2,
                quickView: 'all_games_any_service',
                lastPreset: 'all_games_any_service',
              });
            },
          },
          {
            label: 'My Teams',
            onPress: () => {
              useAppStore.getState().setFiltersV2({
                ...filtersV2,
                quickView: 'my_teams_my_services',
                lastPreset: 'my_teams_my_services',
              });
            },
          },
          {
            label: 'Manage Services',
            onPress: () => setShowFilters(true),
          },
        ],
      };
    }

    // Scenario 3: MY_TEAMS ON MY_SERVICES but nothing watchable
    if (filtersV2.quickView === 'my_teams_my_services') {
      return {
        message: "Your teams aren't playing on your services",
        description: "Try expanding to any service to see where they're available.",
        actions: [
          {
            label: "Turn On 'Any Service'",
            primary: true,
            onPress: () => {
              useAppStore.getState().setFiltersV2({
                ...filtersV2,
                quickView: 'my_teams_any_service',
                lastPreset: 'my_teams_any_service',
              });
            },
          },
          {
            label: 'See All Games',
            onPress: () => {
              useAppStore.getState().setFiltersV2({
                ...filtersV2,
                quickView: 'all_games_my_services',
                lastPreset: 'all_games_my_services',
              });
            },
          },
        ],
      };
    }

    // Generic empty state
    return {
      message: "No games match your filters",
      description: "Try adjusting your filter settings.",
      actions: [
        {
          label: 'Adjust Filters',
          primary: true,
          onPress: () => setShowFilters(true),
        },
      ],
    };
  }, [hasAnyGames, filtersV2, follows.length, setShowFilters]);

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

  // When filters change, scroll to first matching date
  useEffect(() => {
    // Skip on initial mount (initialScrollIndex handles that)
    if (loading) return;
    
    // Skip if no sections loaded yet
    if (filteredSections.length === 0) return;
    
    // Find first future date with matching games
    const todayDate = new Date(todayDateKey);
    todayDate.setHours(0, 0, 0, 0);
    
    let targetSectionIndex = filteredSections.findIndex(s => s.isToday);
    
    // If today has no matching games, find first FUTURE section
    if (targetSectionIndex === -1) {
      const futureSection = filteredSections.find(s => s.dateObj > todayDate);
      if (futureSection) {
        targetSectionIndex = filteredSections.indexOf(futureSection);
      } else {
        // No future games, show last section
        targetSectionIndex = filteredSections.length - 1;
      }
    }
    
    // Scroll to target section
    if (targetSectionIndex !== -1 && sectionListRef.current) {
      // Small delay to ensure filteredSections has been rendered
      setTimeout(() => {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: targetSectionIndex,
          itemIndex: 0,
          animated: true,
          viewPosition: 0,
          viewOffset: 0,
        });
      }, 100);
    }
  }, [filtersV2, filteredSections.length]); // Re-run when filters change

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

  // Calculate initial scroll index (flat item index to today's header or first future game)
  const initialScrollIndex = useMemo(() => {
    let targetSectionIndex = filteredSections.findIndex(s => s.isToday);
    
    // If today has no games, find first FUTURE section
    if (targetSectionIndex === -1) {
      const todayDate = new Date(todayDateKey);
      todayDate.setHours(0, 0, 0, 0);
      
      // Find first section with date > today
      const futureSection = filteredSections.find(s => s.dateObj > todayDate);
      if (futureSection) {
        targetSectionIndex = filteredSections.indexOf(futureSection);
        console.log('No games today, jumping to first future date:', futureSection.title);
      } else {
        // No future games, default to last section
        targetSectionIndex = filteredSections.length > 0 ? filteredSections.length - 1 : 0;
        console.log('No future games, showing last section');
      }
    }
    
    if (targetSectionIndex === -1) return 0;
    
    // Calculate total flat items before target section
    let flatIndex = 0;
    for (let i = 0; i < targetSectionIndex; i++) {
      flatIndex += 1; // header
      flatIndex += filteredSections[i].data.length; // items
      flatIndex += 1; // footer
    }
    
    console.log('Target section:', targetSectionIndex, 'Flat index (header):', flatIndex);
    return flatIndex;
  }, [filteredSections, todayDateKey]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      // Collapse if already expanded
      setExpandedGameId?.('NHL', null);
    } else {
      // Expand this game
      setExpandedGameId?.('NHL', gameId);
      
      // Scroll to ensure expanded card is visible after a short delay
      setTimeout(() => {
        // Find the section containing this game
        let targetSectionIndex = -1;
        let targetItemIndex = -1;
        
        for (let i = 0; i < filteredSections.length; i++) {
          const itemIndex = filteredSections[i].data.findIndex(game => game.id === gameId);
          if (itemIndex !== -1) {
            targetSectionIndex = i;
            targetItemIndex = itemIndex;
            break;
          }
        }
        
        if (targetSectionIndex !== -1 && sectionListRef.current) {
          sectionListRef.current.scrollToLocation({
            sectionIndex: targetSectionIndex,
            itemIndex: targetItemIndex,
            animated: true,
            viewPosition: 0.1, // Position near top with small margin
            viewOffset: 0,
          });
        }
      }, 100); // Small delay to let expansion start
    }
  };

  const navigateToGame = (gameId: string) => {
    // Find the section containing this game
    let targetSectionIndex = -1;
    let targetItemIndex = -1;
    
    for (let i = 0; i < filteredSections.length; i++) {
      const itemIndex = filteredSections[i].data.findIndex(game => game.id === gameId);
      if (itemIndex !== -1) {
        targetSectionIndex = i;
        targetItemIndex = itemIndex;
        break;
      }
    }
    
    if (targetSectionIndex === -1 || !sectionListRef.current) {
      console.warn('Game not found in filtered sections:', gameId);
      return;
    }
    
    // Scroll to the game at top of screen to ensure expanded card is fully visible
    sectionListRef.current.scrollToLocation({
      sectionIndex: targetSectionIndex,
      itemIndex: targetItemIndex,
      animated: true,
      viewPosition: 0, // Position at top of viewport
      viewOffset: 20, // Small offset from top for breathing room
    });
    
    // Expand the game after a short delay to ensure scroll completes
    setTimeout(() => {
      setExpandedGameId?.('NHL', gameId);
    }, 600);
  };

  const scrollToToday = () => {
    let todaySectionIndex = filteredSections.findIndex(s => s.isToday);
    let targetSection = null;
    let fallbackMessage = null;
    
    if (todaySectionIndex === -1) {
      // Today has no games, find nearest date with games
      const todayDate = new Date(todayDateKey);
      todayDate.setHours(0, 0, 0, 0);
      
      // Find first FUTURE section
      const futureSection = filteredSections.find(s => s.dateObj > todayDate);
      
      if (futureSection) {
        todaySectionIndex = filteredSections.indexOf(futureSection);
        targetSection = futureSection;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        fallbackMessage = `No games today — jumped to ${monthNames[futureSection.dateObj.getMonth()]} ${futureSection.dateObj.getDate()}`;
      } else {
        // No future sections, find most recent PAST section
        const pastSections = filteredSections.filter(s => s.dateObj < todayDate);
        if (pastSections.length > 0) {
          targetSection = pastSections[pastSections.length - 1];
          todaySectionIndex = filteredSections.indexOf(targetSection);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          fallbackMessage = `No games today — jumped to ${monthNames[targetSection.dateObj.getMonth()]} ${targetSection.dateObj.getDate()}`;
        }
      }
    }
    
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
      
      // Show toast if we fell back to a different date
      if (fallbackMessage) {
        // TODO: Show toast notification (requires toast library)
        console.log(fallbackMessage);
      }
      
      // Fallback: If still not visible after animation, try again
      setTimeout(() => {
        if (sectionListRef.current) {
          sectionListRef.current.scrollToLocation({
            sectionIndex: todaySectionIndex,
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
          currentTime={currentTime}
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

  // Dynamic view title
  const viewTitle = viewMode === 'my-teams' ? 'My Teams' : viewMode === 'explore' ? 'Explore' : 'Reminders';
  const showDropdownCaret = viewMode !== 'reminders'; // Hide caret on reminders

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header - Phase 4: Dropdown with proper wiring */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.logo, { color: colors.text }]}>SportStream</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Find Your Game</Text>
        </View>
        
        {showDropdownCaret ? (
          <TouchableOpacity 
            style={styles.viewDropdown}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewText, { color: colors.text }]}>{viewTitle}</Text>
            {showDropdown ? (
              <ChevronUp size={14} color={colors.primary} strokeWidth={3} />
            ) : (
              <ChevronDown size={14} color={colors.textSecondary} strokeWidth={3} />
            )}
          </TouchableOpacity>
        ) : (
          <Text style={[styles.viewText, { color: colors.text }]}>{viewTitle}</Text>
        )}
        
        <TouchableOpacity onPress={scrollToToday} activeOpacity={0.7} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* ViewDropdownPopover */}
      <ViewDropdownPopover
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        mode={viewMode === 'my-teams' ? 'my-teams' : 'explore'}
      />

      {emptyStateInfo ? (
        <View style={styles.emptyStateContainer}>
          <EmptyStateCard
            message={emptyStateInfo.message}
            description={emptyStateInfo.description}
            actions={emptyStateInfo.actions}
          />
        </View>
      ) : (
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
      )}

      {/* Settings Sheet */}
      <SettingsSheet 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        games={sections.flatMap(s => s.data)}
        onNavigateToGame={(gameId) => {
          setShowSettings(false); // Close settings
          setTimeout(() => navigateToGame(gameId), 300); // Navigate after close animation
        }}
      />

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
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666666',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  todayButtonText: {
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
