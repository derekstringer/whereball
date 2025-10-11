/**
 * Game Tile - Compact game display for scoreboard strip
 * Shows team scores, status, and primary service
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NHLGame } from '../../lib/nhl-api';
import { getPreferredService } from '../../lib/service-helpers';

interface GameTileProps {
  game: NHLGame;
  userServiceCodes: string[];
  isExpanded?: boolean;
  onPress?: () => void;
  onServicePress?: (serviceCode: string) => void;
}

export const GameTile: React.FC<GameTileProps> = ({
  game,
  userServiceCodes,
  isExpanded = false,
  onPress,
  onServicePress,
}) => {
  const { colors } = useTheme();

  // Determine game state
  const isLive = game.gameState === 'LIVE';
  const isFinal = game.gameState === 'FINAL';
  const isUpcoming = !isLive && !isFinal;

  // Get preferred service
  const preferredService = getPreferredService(game, userServiceCodes);
  const additionalCount = Math.max(0, game.broadcasts.length - 1);

  // Format time/status
  const getStatus = () => {
    if (isLive) return 'LIVE';
    if (isFinal) return 'Final';
    
    const startTime = new Date(game.startTime);
    const now = new Date();
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60 && diffMins > 0) {
      return `in ${diffMins} m`;
    }
    
    return startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: isLive ? colors.danger : colors.stroke,
        },
        isLive && styles.liveGlow,
        isFinal && styles.finalDimmed,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Live Badge */}
      {isLive && (
        <View style={[styles.liveBadge, { backgroundColor: colors.danger }]}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Scores */}
      <View style={styles.scoresRow}>
        <View style={styles.teamScore}>
          <Text style={[styles.teamAbbr, { color: colors.text }]}>
            {game.awayTeam.abbreviation}
          </Text>
          <Text style={[styles.score, { color: colors.text }]}>
            {game.awayTeam.score || '-'}
          </Text>
        </View>
        
        <Text style={[styles.vs, { color: colors.textSecondary }]}>@</Text>
        
        <View style={styles.teamScore}>
          <Text style={[styles.teamAbbr, { color: colors.text }]}>
            {game.homeTeam.abbreviation}
          </Text>
          <Text style={[styles.score, { color: colors.text }]}>
            {game.homeTeam.score || '-'}
          </Text>
        </View>
      </View>

      {/* Status & Service */}
      <View style={styles.metaRow}>
        <Text style={[styles.status, { color: colors.textSecondary }]}>
          {getStatus()}
        </Text>
        
        {preferredService && (
          <TouchableOpacity
            style={[styles.servicePill, { backgroundColor: colors.primary }]}
            onPress={() => onServicePress?.(preferredService.code)}
            activeOpacity={0.8}
          >
            <Text style={styles.servicePillText}>{preferredService.name}</Text>
          </TouchableOpacity>
        )}
        
        {additionalCount > 0 && (
          <Text style={[styles.additional, { color: colors.textSecondary }]}>
            +{additionalCount}
          </Text>
        )}
      </View>

      {/* Final Badge */}
      {isFinal && (
        <View style={[styles.finalBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.finalText, { color: colors.textSecondary }]}>
            Final
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    padding: 12,
    borderRadius: 24,
    borderWidth: 2,
    marginRight: 12,
  },
  liveGlow: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  finalDimmed: {
    opacity: 0.6,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamScore: {
    alignItems: 'center',
  },
  teamAbbr: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
  },
  vs: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
  },
  servicePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  servicePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  additional: {
    fontSize: 11,
    fontWeight: '600',
  },
  finalBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  finalText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
