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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronDown, ChevronUp, CalendarArrowDown, CalendarArrowUp } from 'lucide-react-native';
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
  onOpenExploreSearch?: () => void; // Callback to open search in Explore mode
  onScrollPositionChange?: (position: 'past' | 'today' | 'future') => void;
  onScrollToTodayRef?: (fn: () => void) => void;
}

export const DailyV3: React.FC<DailyV3Props> = ({ 
  viewMode = 'my-teams', 
  onOpenExploreSearch,
  onScrollPositionChange,
  onScrollToTodayRef,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
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
  const currentScrollDate = useRef<string | null>(null);
  const currentScrollGameId = useRef<string | null>(null);
  const hasInitiallyScrolled = useRef(false);
  const [scrollPosition, setScrollPosition] = useState<'past' | 'today' | 'future'>('today');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { hiddenTeamsInMyTeams, exploreSelections } = useAppStore();
  const userServiceCodes = useMemo(() => subscriptions.map(s => s.service_code), [subscriptions]);
  const userFollows = useMemo(() => follows.map(f => f.team_id), [follows]);
  const currentTime = useRef(new Date()).current;
  const expandedGameId = expandedGameIdBySport?.['NHL'] || null;
  
  // Helper: Convert NHL API numeric ID + abbreviation to our string format "nhl_xxx"
  const getTeamStringId = (apiId: number, abbrev: string): string => {
    return `nhl_${abbrev.toLowerCase()}`;
  };
  
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

  // Phase 5: Apply viewMode filtering (ignoring old filters system)
  const filteredSections = useMemo(() => {
    return sections
      .map(section => {
        let filteredGames = section.data;

        if (viewMode === 'my-teams') {
          // Show games from followed teams only
          const visibleTeamIds = userFollows.filter(
            teamId => !hiddenTeamsInMyTeams.includes(teamId)
          );
          
          filteredGames = section.data.filter(game => {
            // Convert NHL API numeric IDs to our string format for comparison
            const awayStringId = getTeamStringId(game.awayTeam.id, game.awayTeam.abbreviation);
            const homeStringId = getTeamStringId(game.homeTeam.id, game.homeTeam.abbreviation);
            
            return visibleTeamIds.includes(awayStringId) || visibleTeamIds.includes(homeStringId);
          });
        } else if (viewMode === 'explore') {
          // Show games only from teams selected in Explore session
          if (exploreSelections.length === 0) {
            filteredGames = []; // Nothing selected yet
          } else {
            filteredGames = section.data.filter(game => {
              // Convert NHL API numeric IDs to our string format for comparison
              const awayStringId = getTeamStringId(game.awayTeam.id, game.awayTeam.abbreviation);
              const homeStringId = getTeamStringId(game.homeTeam.id, game.homeTeam.abbreviation);
              
              return exploreSelections.includes(awayStringId) || exploreSelections.includes(homeStringId);
            });
          }
        } else if (viewMode === 'reminders') {
          // Show only games with reminders set
          const gameIdsWithReminders = new Set(
            alerts
              .filter(alert => alert.status === 'pending')
              .map(alert => alert.game_id)
          );
          
          filteredGames = section.data.filter(game => 
            gameIdsWithReminders.has(game.id)
          );
        }

        return {
          ...section,
          data: filteredGames,
        };
      })
      .filter(section => section.data.length > 0); // SKIP EMPTY DATES
  }, [sections, viewMode, userFollows, hiddenTeamsInMyTeams, exploreSelections, alerts]);

  // Detect empty state scenarios (NO SERVICE LOGIC - viewMode only)
  const hasAnyGames = useMemo(() => {
    return filteredSections.some(section => section.data.length > 0);
  }, [filteredSections]);

  const emptyStateInfo = useMemo(() => {
    if (hasAnyGames) return null;

    // Scenario 1: MY TEAMS but no followed teams
    if (viewMode === 'my-teams' && follows.length === 0) {
      return {
        message: "No teams followed yet",
        description: "Follow some teams to see their schedule here.",
        actions: [
          {
            label: 'Follow Teams',
            primary: true,
            onPress: () => {
              // Navigate to Explore tab
              navigation.navigate('Explore' as never);
            },
          },
        ],
      };
    }

    // Scenario 2: EXPLORE with selections but no matching games (e.g. non-NHL teams during dev)
    if (viewMode === 'explore' && exploreSelections.length > 0) {
      return {
        message: "No games found",
        description: "The selected teams have no upcoming games, or we haven't connected that sport's API yet.",
        actions: [],
      };
    }

    // Scenario 3: REMINDERS but no reminders set
    if (viewMode === 'reminders') {
      return {
        message: "No reminders set",
        description: "Set reminders on upcoming games to see them here.",
        actions: [],
      };
    }

    // Generic empty state (games filtered out by dropdown)
    return {
      message: "No games to show",
      description: viewMode === 'my-teams' 
        ? "Check your team visibility in the dropdown above." 
        : "Try selecting different teams.",
      actions: [],
    };
  }, [hasAnyGames, viewMode, follows.length, exploreSelections.length]);

  // Get today's date key
  const getTodayDateKey = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  
  // Track the "home" date - the date we consider "today" for scroll purposes
  // This might be a future date if today has no games
  const homeDateKey = useRef<string | null>(null);

  // Initialize: Load today -30 to +60 days
  useEffect(() => {
    loadInitialData();
  }, []);

  // Expose scrollToToday function to parent
  useEffect(() => {
    if (onScrollToTodayRef) {
      onScrollToTodayRef(scrollToToday);
    }
  }, [onScrollToTodayRef]);

  // DISABLED: Scroll position restoration was causing unwanted jumps during backward scroll
  // The restoration effect was firing constantly, preventing smooth backward scrolling
  // React Native's SectionList already maintains scroll position naturally
  // useEffect(() => {
  //   // ... scroll restoration logic disabled
  // }, [hiddenTeamsInMyTeams, filteredSections]);

  // Live polling: DISABLED to prevent jumping during data refreshes
  // TODO: Re-enable with smarter update logic that doesn't cause scroll jumps
  // The 15-second refresh was causing the list to jump even with scroll preservation disabled
  // Need to implement in-place score updates without full section re-renders

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
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Build date range: -30 to +60
      const dates: Date[] = [];
      for (let i = dateRange.start; i <= dateRange.end; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      
      // Load all games in parallel with timeout
      const results = await Promise.all(
        dates.map(async (date) => {
          const dateStr = formatDateKey(date);
          try {
            const games = await getGamesForDate(date);
            // Validate games array
            const validGames = Array.isArray(games) ? games.filter(g => g && g.id) : [];
            return {
              title: dateStr,
              dateObj: date,
              isToday: dateStr === todayDateKey,
              data: validGames,
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
    } catch (error) {
      console.error('Critical error in loadInitialData:', error);
      // Set empty sections to prevent undefined state
      setSections([]);
    } finally {
      setLoading(false);
    }
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
  // ONLY used on initial mount, not on subsequent re-renders
  const initialScrollIndex = useMemo(() => {
    // Don't use initialScrollIndex after initial mount
    if (hasInitiallyScrolled.current) return undefined;
    
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
    
    // Store the initial date we're scrolling to - this is our "home" date
    if (filteredSections[targetSectionIndex]) {
      currentScrollDate.current = filteredSections[targetSectionIndex].title;
      homeDateKey.current = filteredSections[targetSectionIndex].title;
    }
    
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

  // NOTE: Scroll position preservation has been disabled to prevent unwanted jumping
  // When live scores update every 15 seconds, we don't want to force scroll repositioning
  // React Native's SectionList handles its own scroll position naturally

  // Track which date and game is currently visible
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      // Find the first visible game item
      const firstGameItem = viewableItems.find((item: any) => item.item && !item.isViewable === false);
      
      if (firstGameItem?.item) {
        // Store both the game ID and its section date
        currentScrollGameId.current = firstGameItem.item.id;
        if (firstGameItem.section) {
          currentScrollDate.current = firstGameItem.section.title;
        }
      } else {
        // If no game item, find the first section header
        const firstSection = viewableItems.find((item: any) => item.section);
        if (firstSection?.section) {
          currentScrollDate.current = firstSection.section.title;
          currentScrollGameId.current = null; // No specific game
        }
      }
      
      // Update scroll position for "Return to Today" icon
      // Compare against "home" date (initial scroll target), not calendar today
      if (currentScrollDate.current && homeDateKey.current) {
        const visibleDate = new Date(currentScrollDate.current);
        const homeDate = new Date(homeDateKey.current);
        homeDate.setHours(0, 0, 0, 0);
        visibleDate.setHours(0, 0, 0, 0);
        
        const diffTime = visibleDate.getTime() - homeDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        const newPosition = diffDays < -1 ? 'past' : diffDays > 1 ? 'future' : 'today';
        setScrollPosition(newPosition);
        onScrollPositionChange?.(newPosition);
      }
      
      // Mark that we've scrolled at least once
      if (!hasInitiallyScrolled.current) {
        hasInitiallyScrolled.current = true;
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  // Animation effects for the Return to Today icon
  useEffect(() => {
    if (scrollPosition === 'today') {
      // Fade out when at today
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade in when away from today
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [scrollPosition, fadeAnim]);

  const handleGamePress = (gameId: string) => {
    if (expandedGameId === gameId) {
      // Collapse if already expanded
      setExpandedGameId?.('NHL', null);
    } else {
      // Expand this game
      setExpandedGameId?.('NHL', gameId);
      // Let React Native handle the expansion naturally - no forced scrolling
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
      // Set flag to prevent handleScroll from triggering loads during scroll
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
      
      // Clear the flag quickly so user can interact
      setTimeout(() => {
        isScrollingToToday.current = false;
      }, 300);
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
      {/* Header - Phase 4: Dropdown with proper wiring (hidden in explore mode) */}
      {viewMode !== 'explore' && (
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoStack}>
            <Text style={[styles.logoLine1, { color: colors.text }]}>Sport</Text>
            <Text style={[styles.logoLine2, { color: colors.text }]}>Stream</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Find Your Game</Text>
        </View>
        
        <View style={styles.headerCenter}>
          {showDropdownCaret ? (
            <TouchableOpacity 
              style={styles.viewDropdownCenter}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewTitle, { color: colors.text }]}>{viewTitle}</Text>
              {showDropdown ? (
                <ChevronUp size={18} color={colors.primary} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.viewTitle, { color: colors.text }]}>{viewTitle}</Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {scrollPosition !== 'today' && viewMode !== 'reminders' && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                onPress={scrollToToday} 
                activeOpacity={0.7} 
                style={styles.returnTodayButton}
                accessibilityLabel={scrollPosition === 'past' ? 'Return to today. Scrolls forward to today\'s games.' : 'Return to today. Scrolls backward to today\'s games.'}
                accessibilityHint="Double-tap to scroll to today"
                accessibilityRole="button"
              >
                {scrollPosition === 'past' ? (
                  <CalendarArrowDown size={24} color="#00D9FF" strokeWidth={2.5} />
                ) : (
                  <CalendarArrowUp size={24} color="#00D9FF" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
      )}

      {/* ViewDropdownPopover (not shown in explore mode) */}
      {viewMode !== 'explore' && (
      <ViewDropdownPopover
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        mode={viewMode === 'my-teams' ? 'my-teams' : 'explore'}
      />
      )}

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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={false}
        windowSize={10}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onEndReached={loadMoreForward}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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
    minWidth: 100,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  logoStack: {
    marginBottom: 2,
  },
  logoLine1: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  logoLine2: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
  },
  viewDropdownCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666666',
  },
  returnTodayButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
