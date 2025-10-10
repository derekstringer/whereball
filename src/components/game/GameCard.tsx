/**
 * Game Card Component
 * Displays a single game with broadcast info and service badges
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import type { NHLGame } from '../../lib/nhl-api';
import { formatGameTime } from '../../lib/nhl-api';
import {
  ServiceBadge,
  NotAvailableBadge,
  BlackoutBadge,
  Tooltip,
} from '../ui/ServiceBadge';
import { STREAMING_SERVICES } from '../../constants/services';
import {
  getUserServicesForGame,
  getMissingServicesForGame,
  getServiceNames,
} from '../../lib/broadcast-mapper';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';

interface GameCardProps {
  game: NHLGame;
  userServiceCodes?: string[];
  onPress?: () => void;
  onShowTooltip?: (message: string) => void;
  expanded?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  userServiceCodes = [], 
  onPress, 
  onShowTooltip,
  expanded = false 
}) => {
  const { colors } = useTheme();
  const { preferredServices, filters } = useAppStore();
  const discoveryMode = filters.showAllServices;
  const gameTime = formatGameTime(game.startTime);
  const isLive = game.gameState === 'LIVE';
  const [showAllServices, setShowAllServices] = useState(false);

  // Get services for this game
  const userServices = getUserServicesForGame(game, userServiceCodes);
  const missingServices = getMissingServicesForGame(game, userServiceCodes);
  
  // Sort services: preferred first, then alphabetically
  const sortedServices = [...userServices].sort((a, b) => {
    const aPreferred = preferredServices.includes(a);
    const bPreferred = preferredServices.includes(b);
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return a.localeCompare(b);
  });
  
  // Simple blackout heuristic
  const isBlackedOut = game.broadcasts.some(b => 
    b.network.toLowerCase().includes('espn+')
  );

  // Check if game is national broadcast
  const isNational = game.broadcasts.some(b => b.type === 'national');

  const handleBadgePress = (serviceCode: string) => {
    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
    if (onShowTooltip) {
      onShowTooltip(`Available on your ${service?.name}`);
    }
  };

  const handleUnavailablePress = () => {
    if (onShowTooltip) {
      if (missingServices.length > 0) {
        const serviceNames = getServiceNames(missingServices);
        onShowTooltip(`Available on ${serviceNames} (not on your services)`);
      } else {
        onShowTooltip('Not available on streaming services');
      }
    }
  };

  const handleBlackoutPress = () => {
    if (onShowTooltip) {
      const alternatives = missingServices.length > 0 
        ? ` Try ${getServiceNames(missingServices)}`
        : '';
      onShowTooltip(`Likely blacked out in your area.${alternatives}`);
    }
  };

  const handleDiscoveryServicePress = (serviceCode: string) => {
    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
    if (onShowTooltip) {
      onShowTooltip(`${service?.name} - Tap to learn more or start free trial`);
    }
    // TODO: Navigate to affiliate link or service info page
  };

  // Show first service or first 2 if not expanded
  const maxVisibleServices = showAllServices ? sortedServices.length : 2;
  const visibleServices = sortedServices.slice(0, maxVisibleServices);
  const remainingCount = Math.max(0, sortedServices.length - maxVisibleServices);

  return (
    <TouchableOpacity
        style={[styles.card, { 
          backgroundColor: colors.card, 
          borderColor: colors.stroke,
        }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <View style={styles.header}>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{gameTime}</Text>
          <View style={styles.headerBadges}>
            {isLive && <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>}
            {isNational && (
              <View style={[styles.nationalBadge, { backgroundColor: colors.nationalBadge }]}>
                <Text style={[styles.nationalText, { color: colors.card }]}>National</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.matchup}>
          <View style={styles.team}>
            <Text style={[styles.teamAbbr, { color: colors.text }]}>{game.awayTeam.abbreviation}</Text>
            <Text style={[styles.teamName, { color: colors.textSecondary }]}>{game.awayTeam.name}</Text>
          </View>
          
          <Text style={[styles.at, { color: colors.textSecondary }]}>@</Text>
          
          <View style={styles.team}>
            <Text style={[styles.teamAbbr, { color: colors.text }]}>{game.homeTeam.abbreviation}</Text>
            <Text style={[styles.teamName, { color: colors.textSecondary }]}>{game.homeTeam.name}</Text>
          </View>
        </View>

        {/* Service Badges Row */}
        <View style={styles.watchSection}>
          <Text style={[styles.watchLabel, { color: colors.textMuted }]}>Watch on:</Text>
          <View style={styles.servicesRow}>
            {isBlackedOut ? (
              <BlackoutBadge onPress={handleBlackoutPress} />
            ) : visibleServices.length > 0 ? (
              <>
                {visibleServices.map((serviceCode) => (
                  <ServiceBadge
                    key={serviceCode}
                    serviceCode={serviceCode}
                    size="medium"
                    onPress={() => handleBadgePress(serviceCode)}
                  />
                ))}
                {remainingCount > 0 && (
                  <TouchableOpacity
                    style={[styles.moreBadge, { 
                      backgroundColor: colors.surface,
                      borderColor: colors.stroke,
                    }]}
                    onPress={() => setShowAllServices(!showAllServices)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.moreBadgeText, { color: colors.textMuted }]}>
                      {showAllServices ? '−' : `+${remainingCount}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <NotAvailableBadge onPress={handleUnavailablePress} />
            )}
          </View>
          
          {/* Also available on (when services expanded or discovery mode) */}
          {(showAllServices || discoveryMode) && missingServices.length > 0 && (
            <View style={styles.discoverySection}>
              <Text style={[styles.alsoAvailableLabel, { color: colors.textMuted }]}>
                Also available on:
              </Text>
              <View style={styles.discoveryServicesRow}>
                {missingServices.map((serviceCode) => (
                  <View key={serviceCode} style={{ opacity: discoveryMode ? 0.6 : 0.4 }}>
                    <TouchableOpacity
                      onPress={() => handleDiscoveryServicePress(serviceCode)}
                      activeOpacity={0.7}
                      disabled={!discoveryMode}
                    >
                      <ServiceBadge
                        serviceCode={serviceCode}
                        size="medium"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              {discoveryMode && (
                <Text style={[styles.discoveryHint, { color: colors.textMuted }]}>
                  Tap to learn more or start free trial
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  team: {
    flex: 1,
  },
  teamAbbr: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 13,
  },
  at: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  broadcastInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  broadcastBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  broadcastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  nationalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  nationalText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  watchSection: {
    marginTop: 4,
  },
  watchLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  discoverySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  alsoAvailableLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discoveryServicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  discoveryHint: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  moreNetworks: {
    fontSize: 13,
    color: '#999999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
