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
} from 'react-native';
import type { NHLGame } from '../../lib/nhl-api';
import { formatGameTime } from '../../lib/nhl-api';
import {
  ServiceBadge,
  NotAvailableBadge,
  BlackoutBadge,
  Tooltip,
} from '../ui/ServiceBadge';
import { ServicesBottomSheet } from '../ui/ServicesBottomSheet';
import { STREAMING_SERVICES } from '../../constants/services';
import {
  getUserServicesForGame,
  getMissingServicesForGame,
  getServiceNames,
} from '../../lib/broadcast-mapper';

interface GameCardProps {
  game: NHLGame;
  userServiceCodes?: string[];
  onPress?: () => void;
  onShowTooltip?: (message: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, userServiceCodes = [], onPress, onShowTooltip }) => {
  const gameTime = formatGameTime(game.startTime);
  const isLive = game.gameState === 'LIVE';
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetServices, setBottomSheetServices] = useState<{
    userServices: string[];
    missingServices: string[];
    channel?: string;
  }>({ userServices: [], missingServices: [] });

  // Get services for this game
  const userServices = getUserServicesForGame(game, userServiceCodes);
  const missingServices = getMissingServicesForGame(game, userServiceCodes);
  
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

  const handleMorePress = () => {
    const channel = game.broadcasts[0]?.network;
    setBottomSheetServices({ userServices, missingServices, channel });
    setBottomSheetVisible(true);
  };

  // TODO: Implement dynamic width measurement to show as many as fit
  // For now, safe default of 2 prevents overflow
  const maxVisibleServices = 2;
  const visibleServices = userServices.slice(0, maxVisibleServices);
  const remainingCount = Math.max(0, userServices.length - maxVisibleServices);

  return (
    <>
      <ServicesBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        userServices={bottomSheetServices.userServices}
        missingServices={bottomSheetServices.missingServices}
        channel={bottomSheetServices.channel}
        onServicePress={(serviceCode) => {
          setBottomSheetVisible(false);
          if (onShowTooltip) {
            onShowTooltip(`Opening ${STREAMING_SERVICES.find(s => s.code === serviceCode)?.name}...`);
          }
        }}
      />
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.header}>
          <Text style={styles.time}>{gameTime}</Text>
          <View style={styles.headerBadges}>
            {isLive && <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>}
            {isNational && (
              <View style={styles.nationalBadge}>
                <Text style={styles.nationalText}>National</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.matchup}>
          <View style={styles.team}>
            <Text style={styles.teamAbbr}>{game.awayTeam.abbreviation}</Text>
            <Text style={styles.teamName}>{game.awayTeam.name}</Text>
          </View>
          
          <Text style={styles.at}>@</Text>
          
          <View style={styles.team}>
            <Text style={styles.teamAbbr}>{game.homeTeam.abbreviation}</Text>
            <Text style={styles.teamName}>{game.homeTeam.name}</Text>
          </View>
        </View>

        {/* Service Badges Row */}
        <View style={styles.watchSection}>
          <Text style={styles.watchLabel}>Watch on:</Text>
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
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    color: '#666666',
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
    color: '#000000',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 13,
    color: '#666666',
  },
  at: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CCCCCC',
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
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  nationalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  watchSection: {
    marginTop: 4,
  },
  watchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
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
    borderColor: '#999999',
    backgroundColor: '#F5F5F5',
    minWidth: 44,
  },
  moreBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
  moreNetworks: {
    fontSize: 13,
    color: '#999999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
