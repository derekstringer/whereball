/**
 * Game Card Component
 * Displays a single game with broadcast info
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
  ServiceBadgesRow,
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

interface GameCardProps {
  game: NHLGame;
  userServiceCodes?: string[];
  onPress?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, userServiceCodes = [], onPress }) => {
  const gameTime = formatGameTime(game.startTime);
  const isLive = game.gameState === 'LIVE';
  const isFinal = game.gameState === 'FINAL';
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');

  // Get services for this game
  const userServices = getUserServicesForGame(game, userServiceCodes);
  const missingServices = getMissingServicesForGame(game, userServiceCodes);
  
  // Simple blackout heuristic
  const isBlackedOut = game.broadcasts.some(b => 
    b.network.toLowerCase().includes('espn+')
  );

  // Get primary broadcast network
  const primaryBroadcast = game.broadcasts.find(b => b.type === 'national') || game.broadcasts[0];

  const handleBadgePress = (serviceCode: string) => {
    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
    setTooltipMessage(`Available on your ${service?.name}`);
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

  return (
    <>
      <Tooltip
        visible={tooltipVisible}
        message={tooltipMessage}
        onDismiss={() => setTooltipVisible(false)}
      />
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
      <View style={styles.header}>
        <Text style={styles.time}>{gameTime}</Text>
        {isLive && <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>}
        {isFinal && <Text style={styles.finalText}>Final</Text>}
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

      {primaryBroadcast && (
        <View style={styles.broadcastInfo}>
          <View style={styles.broadcastBadge}>
            <Text style={styles.broadcastText}>
              📺 {primaryBroadcast.network}
            </Text>
          </View>
          {primaryBroadcast.type === 'national' && (
            <View style={styles.nationalBadge}>
              <Text style={styles.nationalText}>National</Text>
            </View>
          )}
        </View>
      )}

      {game.broadcasts.length > 1 && (
        <Text style={styles.moreNetworks}>
          +{game.broadcasts.length - 1} more network{game.broadcasts.length > 2 ? 's' : ''}
        </Text>
      )}
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
    marginBottom: 16,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
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
  finalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    marginLeft: 12,
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
  moreNetworks: {
    fontSize: 13,
    color: '#999999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
