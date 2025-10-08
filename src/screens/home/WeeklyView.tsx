/**
 * Weekly View - Shows 7-day schedule snapshot
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getGamesGroupedByDate, type NHLGame } from '../../lib/nhl-api';
import { trackEvent } from '../../lib/analytics';
import {
  ServiceBadge,
  NotAvailableBadge,
  BlackoutBadge,
  Tooltip,
} from '../../components/ui/ServiceBadge';
import { ServicesBottomSheet } from '../../components/ui/ServicesBottomSheet';
import { STREAMING_SERVICES, SERVICE_ABBREVIATIONS } from '../../constants/services';
import {
  getUserServicesForGame,
  getMissingServicesForGame,
  getServiceNames,
} from '../../lib/broadcast-mapper';
import { useAppStore } from '../../store/appStore';

interface WeeklyViewProps {
  followedTeamCodes: string[];
  userServiceCodes: string[];
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  followedTeamCodes,
  userServiceCodes,
}) => {
  const [gamesByDate, setGamesByDate] = useState<Record<string, NHLGame[]>>({});
  const [loading, setLoading] = useState(true);
  const [startDate] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetServices, setBottomSheetServices] = useState<{
    userServices: string[];
    missingServices: string[];
    channel?: string;
  }>({ userServices: [], missingServices: [] });
  
  const { preferredServices } = useAppStore();

  useEffect(() => {
    loadWeeklyGames();
  }, []);

  const loadWeeklyGames = async () => {
    try {
      setLoading(true);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Next 7 days

      const grouped = await getGamesGroupedByDate(startDate, endDate);
      setGamesByDate(grouped);

      // TODO: Add weekly_view_loaded event to analytics types
    } catch (error) {
      console.error('Error loading weekly games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMyTeamGames = (games: NHLGame[]): NHLGame[] => {
    return games.filter(
      (game) =>
        followedTeamCodes.includes(game.homeTeam.abbreviation) ||
        followedTeamCodes.includes(game.awayTeam.abbreviation)
    );
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

  const renderDaySection = (dateKey: string, games: NHLGame[]) => {
    // Parse date - dateKey format varies, handle both YYYY-MM-DD and other formats
    let date: Date;
    try {
      if (dateKey.includes('-')) {
        const [year, month, day] = dateKey.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        date = new Date(dateKey);
      }
      
      // Validate date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateKey);
        return null;
      }
    } catch (e) {
      console.error('Error parsing date:', dateKey, e);
      return null;
    }
    
    const isToday = date.toDateString() === new Date().toDateString();
    const myTeamGames = filterMyTeamGames(games);
    const isExpanded = expandedDays.has(dateKey);

    return (
      <View key={dateKey} style={styles.daySection}>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
              {isToday
                ? 'Today'
                : date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={styles.dayDate}>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={styles.gameCount}>
              {myTeamGames.length === 0
                ? 'No games'
                : `${myTeamGames.length} game${myTeamGames.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {myTeamGames.length > 0 && (
          <View style={styles.gamesContainer}>
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

              // Determine which service to show (preferred or first alphabetically)
              const primaryService = userServices.length > 0
                ? (userServices.find(s => preferredServices.includes(s)) || userServices[0])
                : null;
              
              const remainingCount = userServices.length - 1;

              const handleMorePress = () => {
                // Get channel from game broadcasts
                const channel = game.broadcasts.find(b => 
                  userServices.some(s => b.network.toLowerCase().includes(s.toLowerCase()))
                )?.network || game.broadcasts[0]?.network;
                
                setBottomSheetServices({ userServices, missingServices, channel });
                setBottomSheetVisible(true);
              };

              return (
                <View key={`${game.id}-${index}`} style={styles.gameRow}>
                  <View style={styles.gameTeams}>
                    <Text style={styles.gameText} numberOfLines={1}>
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
                          <TouchableOpacity
                            style={styles.moreBadge}
                            onPress={handleMorePress}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.moreBadgeText}>+{remainingCount}</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <NotAvailableBadge onPress={handleUnavailablePress} />
                    )}
                  </View>
                </View>
              );
            })}
            {myTeamGames.length > 3 && (
              <TouchableOpacity onPress={() => toggleDayExpanded(dateKey)}>
                <Text style={styles.moreGamesText}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading this week's games...</Text>
      </View>
    );
  }

  const sortedDates = Object.keys(gamesByDate).sort();
  const totalMyTeamGames = sortedDates.reduce((acc, dateKey) => {
    return acc + filterMyTeamGames(gamesByDate[dateKey]).length;
  }, 0);

  const totalBlackouts = sortedDates.reduce((acc, dateKey) => {
    const myGames = filterMyTeamGames(gamesByDate[dateKey]);
    return acc + myGames.filter(isGameBlackedOut).length;
  }, 0);

  return (
    <>
      <Tooltip
        visible={tooltipVisible}
        message={tooltipMessage}
        onDismiss={() => setTooltipVisible(false)}
      />
      <ServicesBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        userServices={bottomSheetServices.userServices}
        missingServices={bottomSheetServices.missingServices}
        channel={bottomSheetServices.channel}
        onServicePress={(serviceCode) => {
          // TODO: Deep link to service
          setBottomSheetVisible(false);
          setTooltipMessage(`Opening ${STREAMING_SERVICES.find(s => s.code === serviceCode)?.name}...`);
          setTooltipVisible(true);
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalMyTeamGames}</Text>
            <Text style={styles.summaryLabel}>Games</Text>
          </View>
          {totalBlackouts > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, styles.summaryNumberWarning]}>
                {totalBlackouts}
              </Text>
              <Text style={styles.summaryLabel}>Blackouts</Text>
            </View>
          )}
        </View>
      </View>

      {sortedDates.map((dateKey) => renderDaySection(dateKey, gamesByDate[dateKey]))}
      
      {/* Legal Disclaimer */}
      <View style={styles.legalFooter}>
        <Text style={styles.legalText}>
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
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666666',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066CC',
  },
  summaryNumberWarning: {
    color: '#FF6B35',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  daySection: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#000000',
  },
  dayNameToday: {
    color: '#0066CC',
  },
  dayDate: {
    fontSize: 15,
    color: '#666666',
  },
  dayHeaderRight: {},
  gameCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  gamesContainer: {
    gap: 8,
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  gameTeams: {
    flex: 1,
  },
  gameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
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
    color: '#0066CC',
    fontWeight: '600',
    paddingLeft: 12,
    marginTop: 4,
  },
  moreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999999',
    backgroundColor: '#F5F5F5',
    minWidth: 40,
  },
  moreBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
  legalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 8,
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
