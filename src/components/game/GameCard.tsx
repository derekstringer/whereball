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

  const handleNationalBadgePress = () => {
    if (onShowTooltip) {
      onShowTooltip('National Broadcast\nWatchable anywhere — no blackouts, no limits.');
    }
  };

  const handleDiscoveryServicePress = (serviceCode: string) => {
    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
    if (onShowTooltip) {
      onShowTooltip(`${service?.name} - Tap to learn more or start free trial`);
    }
    // TODO: Navigate to affiliate link or service info page
  };


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
              <TouchableOpacity
                style={[styles.nationalBadge, { backgroundColor: colors.nationalBadge }]}
                onPress={handleNationalBadgePress}
                activeOpacity={0.8}
              >
                <Text style={styles.nationalText}>National</Text>
              </TouchableOpacity>
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

        {/* Service Badges Section */}
        <View style={styles.watchSection}>
          {isBlackedOut ? (
            <>
              <Text style={[styles.watchLabel, { color: colors.textMuted }]}>WATCH ON:</Text>
              <View style={styles.servicesRow}>
                <BlackoutBadge onPress={handleBlackoutPress} />
              </View>
            </>
          ) : sortedServices.length > 0 ? (
            <>
              {/* WATCH ON: Subscribed Services - Show all with wrapping */}
              <Text style={[styles.watchLabel, { color: colors.textMuted }]}>WATCH ON:</Text>
              <View style={styles.servicesRow}>
                {sortedServices.map((serviceCode) => (
                  <ServiceBadge
                    key={serviceCode}
                    serviceCode={serviceCode}
                    size="medium"
                    onPress={() => handleBadgePress(serviceCode)}
                  />
                ))}
              </View>
              
              {/* ALSO AVAILABLE ON: Non-subscribed Services (when discovery mode active) */}
              {discoveryMode && missingServices.length > 0 && (
                <View style={styles.alsoAvailableSection}>
                  <Text style={[styles.alsoAvailableLabel, { color: colors.textMuted }]}>
                    ALSO AVAILABLE ON:
                  </Text>
                  <View style={styles.alsoAvailableRow}>
                    {missingServices.map((serviceCode) => {
                      const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
                      return (
                        <TouchableOpacity
                          key={serviceCode}
                          style={[styles.unsubscribedPill, { borderColor: colors.stroke }]}
                          onPress={() => handleDiscoveryServicePress(serviceCode)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.unsubscribedPillText}>
                            {service?.name || serviceCode}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {discoveryMode && (
                    <Text style={[styles.discoveryHint, { color: colors.textMuted }]}>
                      Tap to learn more or start free trial
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.watchLabel, { color: colors.textMuted }]}>WATCH ON:</Text>
              <View style={styles.servicesRow}>
                <NotAvailableBadge onPress={handleUnavailablePress} />
              </View>
            </>
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  watchSection: {
    marginTop: 4,
  },
  watchLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
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
  alsoAvailableSection: {
    marginTop: 16,
  },
  alsoAvailableLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  alsoAvailableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unsubscribedPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#2b2b2b',
  },
  unsubscribedPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
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
