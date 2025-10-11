/**
 * Weekly View - Shows 7-day schedule snapshot
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getGamesGroupedByDate, type NHLGame } from '../../lib/nhl-api';
import { getServicesForGame } from '../../lib/broadcast-mapper';
import { trackEvent } from '../../lib/analytics';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';
import { NHL_TEAMS } from '../../constants/teams';
import {
  ServiceBadge,
  NotAvailableBadge,
  BlackoutBadge,
  Tooltip,
} from '../../components/ui/ServiceBadge';
import { STREAMING_SERVICES, SERVICE_ABBREVIATIONS } from '../../constants/services';
import {
  getUserServicesForGame,
  getMissingServicesForGame,
  getServiceNames,
} from '../../lib/broadcast-mapper';
import { GameCard } from '../../components/game/GameCard';

interface WeeklyViewProps {
  followedTeamCodes: string[];
  userServiceCodes: string[];
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  followedTeamCodes,
  userServiceCodes,
}) => {
  const { colors } = useTheme();
  const [gamesByDate, setGamesByDate] = useState<Record<string, NHLGame[]>>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, 1 = next week
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  
  const { preferredServices, filters } = useAppStore();

  // Calculate week range based on offset
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get start of current week (Sunday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Apply week offset
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { weekStart, weekEnd };
  };

  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    loadWeeklyGames();
  }, [weekOffset]);

  const loadWeeklyGames = async () => {
    try {
      setLoading(true);
      const { weekStart, weekEnd } = getWeekRange();

      const grouped = await getGamesGroupedByDate(weekStart, weekEnd);
      setGamesByDate(grouped);

      // TODO: Add weekly_view_loaded event to analytics types
    } catch (error) {
      console.error('Error loading weekly games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMyTeamGames = (games: NHLGame[]): NHLGame[] => {
    let filtered = [...games];

    // If "Show All" is enabled, return all games
    if (filters.showAll) {
      return filtered;
    }

    // Filter: My Teams Only (uses selectedTeams when myTeamsOnly is ON)
    if (filters.myTeamsOnly && filters.selectedTeams.length > 0) {
      filtered = filtered.filter(game => {
        const homeTeamId = NHL_TEAMS.find(t => t.short_code === game.homeTeam.abbreviation)?.id;
        const awayTeamId = NHL_TEAMS.find(t => t.short_code === game.awayTeam.abbreviation)?.id;
        return (homeTeamId && filters.selectedTeams.includes(homeTeamId)) ||
               (awayTeamId && filters.selectedTeams.includes(awayTeamId));
      });
    }

    // Filter: National Games Only
    if (filters.nationalOnly) {
      filtered = filtered.filter(game =>
        game.broadcasts.some(b => b.type === 'national')
      );
    }

    // Filter: Available on My Services (uses selectedServices when myServicesOnly is ON)
    if (filters.myServicesOnly && filters.selectedServices.length > 0) {
      filtered = filtered.filter(game => {
        const gameServices = getServicesForGame(game);
        return gameServices.some(service => filters.selectedServices.includes(service));
      });
    }

    // NOTE: showAllServices is a DISPLAY TOGGLE, not a filter
    // It controls whether "ALSO AVAILABLE ON" section appears on cards
    // It does NOT affect which games are shown

    // Note: liveOnly filter not applicable to Weekly view

    return filtered;
  };

  const isGameAvailable = (game: NHLGame): boolean => {
    return game.broadcasts.some((b) => {
      const network = b.network.toLowerCase();
      return userServiceCodes.some(
        (service) =>
          network.includes(service.toLowerCase()) ||
          service.toLowerCase().includes(network)
      );
    });
  };

  const isGameBlackedOut = (game: NHLGame): boolean => {
    // Simple heuristic: ESPN+ games for followed teams might be blacked out
    const hasESPNPlus = game.broadcasts.some((b) =>
      b.network.toLowerCase().includes('espn+')
    );
    const isMyTeam =
      followedTeamCodes.includes(game.homeTeam.abbreviation) ||
      followedTeamCodes.includes(game.awayTeam.abbreviation);
    return hasESPNPlus && isMyTeam;
  };

  const toggleDayExpanded = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const toggleGameExpanded = (gameId: string) => {
    setExpandedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const renderDaySection = (dateKey: string, games: NHLGame[]) => {
    // Parse date - handle both YYYY-MM-DD and ISO formats
    let date: Date;
    if (dateKey.includes('T')) {
      // ISO format with time
      date = new Date(dateKey);
    } else {
      // YYYY-MM-DD format
      const [year, month, day] = dateKey.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Fallback if date is invalid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date key:', dateKey);
      date = new Date(); // Use today as fallback
    }
    
    const isToday = date.toDateString() === new Date().toDateString();
    const myTeamGames = filterMyTeamGames(games);
    const isExpanded = expandedDays.has(dateKey);

    return (
      <View key={dateKey} style={[styles.daySection, { backgroundColor: colors.card, borderColor: colors.stroke }, isToday && { borderColor: colors.primary, borderWidth: 2 }]}>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayName, { color: colors.text }, isToday && { color: colors.primary }]}>
              {isToday
                ? 'Today'
                : date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={[styles.gameCount, { color: colors.textSecondary }]}>
              {myTeamGames.length === 0
                ? 'No games'
                : `${myTeamGames.length} game${myTeamGames.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {myTeamGames.length > 0 && (
          <View style={[styles.gamesContainer, { gap: 8 }]}>
            {(isExpanded ? myTeamGames : myTeamGames.slice(0, 3)).map((game, index) => {
              const userServices = getUserServicesForGame(game, userServiceCodes);
              const missingServices = getMissingServicesForGame(game, userServiceCodes);
              const blackedOut = isGameBlackedOut(game);

              const handleBadgePress = (serviceCode: string) => {
                setTooltipMessage(`Available on your ${STREAMING_SERVICES.find(s => s.code === serviceCode)?.name}`);
                setTooltipVisible(true);
              };

              const handleUnavailablePress = () => {
                if (missingServices.length > 0) {
                  const serviceNames = getServiceNames(missingServices);
                  setTooltipMessage(`Available on ${serviceNames} (not on your services)`);
                } else {
                  setTooltipMessage('Not available on streaming services');
                }
                setTooltipVisible(true);
              };

              const handleBlackoutPress = () => {
                const alternatives = missingServices.length > 0 
                  ? ` Try ${getServiceNames(missingServices)}`
                  : '';
                setTooltipMessage(`Likely blacked out in your area.${alternatives}`);
                setTooltipVisible(true);
              };

              // Sort services: preferred first, then alphabetically
              const sortedServices = [...userServices].sort((a, b) => {
                const aPreferred = preferredServices.includes(a);
                const bPreferred = preferredServices.includes(b);
                if (aPreferred && !bPreferred) return -1;
                if (!aPreferred && bPreferred) return 1;
                return a.localeCompare(b);
              });

              const primaryService = sortedServices[0] || null;
              const remainingCount = sortedServices.length - 1;

              const isGameExpanded = expandedGames.has(game.id);

              return (
                <View key={`${game.id}-${index}`} style={{ marginBottom: 8 }}>
                  {isGameExpanded ? (
                    <GameCard
                      game={game}
                      userServiceCodes={userServiceCodes}
                      onPress={() => toggleGameExpanded(game.id)}
                      onShowTooltip={(message) => {
                        setTooltipMessage(message);
                        setTooltipVisible(true);
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[styles.gameRow, { 
                        backgroundColor: colors.surface,
                        borderColor: colors.stroke,
                      }]}
                      onPress={() => toggleGameExpanded(game.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.gameInfo}>
                        <Text style={[styles.gameTime, { color: colors.textMuted }]}>
                          {new Date(game.startTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Text>
                        <Text style={[styles.gameTeamsCompact, { color: colors.text }]} numberOfLines={1}>
                          {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                        </Text>
                      </View>
                      <View style={styles.gameStatus}>
                        {blackedOut ? (
                          <BlackoutBadge onPress={handleBlackoutPress} />
                        ) : primaryService ? (
                          <>
                            <ServiceBadge
                              serviceCode={primaryService}
                              size="small"
                              onPress={() => handleBadgePress(primaryService)}
                            />
                            {remainingCount > 0 && (
                              <View
                                style={[styles.moreBadge, { 
                                  backgroundColor: colors.surface,
                                  borderColor: colors.stroke,
                                }]}
                              >
                                <Text style={[styles.moreBadgeText, { color: colors.textMuted }]}>+{remainingCount}</Text>
                              </View>
                            )}
                          </>
                        ) : (
                          <NotAvailableBadge onPress={handleUnavailablePress} />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {myTeamGames.length > 3 && (
              <TouchableOpacity onPress={() => toggleDayExpanded(dateKey)}>
                <Text style={[styles.moreGamesText, { color: colors.primary }]}>
                  {isExpanded 
                    ? '− Show less' 
                    : `+${myTeamGames.length - 3} more`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading this week's games...</Text>
      </View>
    );
  }

  // Generate all 7 days of the week
  const { weekStart, weekEnd } = getWeekRange();
  const allDaysOfWeek: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dateKey = day.toISOString().split('T')[0]; // YYYY-MM-DD format
    allDaysOfWeek.push(dateKey);
  }
  
  const totalMyTeamGames = allDaysOfWeek.reduce((acc, dateKey) => {
    const games = gamesByDate[dateKey] || [];
    return acc + filterMyTeamGames(games).length;
  }, 0);

  const totalBlackouts = allDaysOfWeek.reduce((acc, dateKey) => {
    const games = gamesByDate[dateKey] || [];
    const myGames = filterMyTeamGames(games);
    return acc + myGames.filter(isGameBlackedOut).length;
  }, 0);

  return (
    <>
      <Tooltip
        visible={tooltipVisible}
        message={tooltipMessage}
        onDismiss={() => setTooltipVisible(false)}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* Week Navigation */}
          <View style={styles.weekNav}>
            <TouchableOpacity
              style={styles.weekArrow}
              onPress={() => setWeekOffset(prev => prev - 1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekArrowText, { color: colors.primary }]}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.weekCenter}
              onPress={!isCurrentWeek ? () => setWeekOffset(0) : undefined}
              activeOpacity={isCurrentWeek ? 1 : 0.7}
            >
              <Text style={[styles.weekRange, { color: colors.text }, isCurrentWeek && { color: colors.primary }]}>
                {getWeekRange().weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {getWeekRange().weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              {!isCurrentWeek && (
                <Text style={[styles.thisWeekHint, { color: colors.primary }]}>Tap for this week</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.weekArrow}
              onPress={() => setWeekOffset(prev => prev + 1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekArrowText, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          {totalMyTeamGames > 0 && (
            <View style={[styles.statsBar, { backgroundColor: colors.surface }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>{totalMyTeamGames}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Games</Text>
              </View>
              {totalBlackouts > 0 && (
                <>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.danger }]}>{totalBlackouts}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Blackouts</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

      {allDaysOfWeek.map((dateKey) => renderDaySection(dateKey, gamesByDate[dateKey] || []))}
      
      {/* Legal Disclaimer */}
      <View style={styles.legalFooter}>
        <Text style={[styles.legalText, { color: colors.textSecondary }]}>
          Team and service names used for identification only. Not affiliated with or endorsed by any league or provider.
        </Text>
      </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  daySection: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  daySectionToday: {
    shadowColor: '#0066CC',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayNameToday: {
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  weekArrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowText: {
    fontSize: 24,
    fontWeight: '600',
  },
  weekCenter: {
    minWidth: 200,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  weekRange: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  weekRangeCurrent: {
  },
  thisWeekHint: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  statNumberWarning: {
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  dayDate: {
    fontSize: 15,
  },
  dayHeaderRight: {},
  gameCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  gamesContainer: {
    // gap set inline for better control
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  gameInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  gameTime: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 52,
  },
  gameTeamsCompact: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  gameStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  blackoutBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackoutText: {
    fontSize: 14,
  },
  unavailableBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#999999',
  },
  moreGamesText: {
    fontSize: 13,
    fontWeight: '700',
    paddingLeft: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  legalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 8,
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
