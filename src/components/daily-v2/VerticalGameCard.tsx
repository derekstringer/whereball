/**
 * Vertical Game Card - Apple Calendar style
 * Time on left, centered scoreboard, status icons on right
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NHLGame } from '../../lib/nhl-api';
import { getServicesForGameSplit } from '../../lib/service-helpers';

interface VerticalGameCardProps {
  game: NHLGame;
  userServiceCodes: string[];
  isExpanded?: boolean;
  onPress?: () => void;
}

export const VerticalGameCard: React.FC<VerticalGameCardProps> = ({
  game,
  userServiceCodes,
  isExpanded = false,
  onPress,
}) => {
  const { colors } = useTheme();
  
  const { subscribed, unsubscribed } = getServicesForGameSplit(game, userServiceCodes);
  
  // Determine game state
  const isLive = game.gameState === 'LIVE';
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
  const isUpcoming = !isLive && !isFinal;

  // Calculate time display and red intensity
  const { timeDisplay, redIntensity } = useMemo(() => {
    if (isFinal) {
      return { timeDisplay: 'Final', redIntensity: 0 };
    }
    
    if (isLive) {
      const time = new Date(game.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return { timeDisplay: time, redIntensity: 1 };
    }

    // Upcoming game - calculate time until start
    const now = new Date();
    const startTime = new Date(game.startTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      // Game should have started
      return { timeDisplay: 'Starting', redIntensity: 1 };
    }

    if (diffMins <= 5) {
      return { timeDisplay: 'in 5m', redIntensity: 0.9 };
    }
    if (diffMins <= 10) {
      return { timeDisplay: 'in 10m', redIntensity: 0.75 };
    }
    if (diffMins <= 30) {
      return { timeDisplay: 'in 30m', redIntensity: 0.5 };
    }
    if (diffMins <= 60) {
      return { timeDisplay: 'in 1h', redIntensity: 0.25 };
    }
    if (diffMins <= 120) {
      return { timeDisplay: 'in 2h', redIntensity: 0.1 };
    }

    // More than 2 hours away - show time
    const time = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { timeDisplay: time, redIntensity: 0 };
  }, [game.startTime, isLive, isFinal]);

  // Render status icons
  const renderStatusIcons = () => {
    const icons = [];
    
    // Green: on your services
    if (subscribed.length > 0) {
      icons.push(
        <View key="available" style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]} />
      );
    }
    
    // Yellow: available but not yours
    if (unsubscribed.length > 0) {
      icons.push(
        <View key="elsewhere" style={[styles.statusIcon, { backgroundColor: '#FFC107' }]} />
      );
    }
    
    // Blue: national broadcast
    const hasNational = game.broadcasts.some(b => b.type === 'national');
    if (hasNational) {
      icons.push(
        <View key="national" style={[styles.statusIcon, { backgroundColor: '#2196F3' }]} />
      );
    }
    
    // Pink with red slash: blackout (placeholder logic)
    // TODO: Implement actual blackout detection
    const isBlackedOut = false;
    if (isBlackedOut) {
      icons.push(
        <View key="blackout" style={[styles.statusIcon, styles.blackoutIcon]}>
          <View style={styles.blackoutSlash} />
        </View>
      );
    }

    return icons;
  };

  // Time background color with red intensity
  const timeBackgroundColor = useMemo(() => {
    if (redIntensity === 0) return 'transparent';
    const alpha = Math.floor(redIntensity * 255).toString(16).padStart(2, '0');
    return `#FF3B30${alpha}`;
  }, [redIntensity]);

  return (
    <TouchableOpacity
      style={[styles.container, isFinal && styles.dimmed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {/* Time Column */}
        <View style={styles.timeColumn}>
          <View
            style={[
              styles.timePill,
              { backgroundColor: timeBackgroundColor },
              redIntensity > 0.8 && styles.timePillPulsing,
            ]}
          >
            <Text style={[styles.timeText, { color: redIntensity > 0 ? '#FFFFFF' : colors.textSecondary }]}>
              {timeDisplay}
            </Text>
          </View>
        </View>

        {/* Scoreboard Column */}
        <View style={styles.scoreboardColumn}>
          <View style={styles.scoreboard}>
            <View style={styles.team}>
              <Text style={[styles.teamAbbr, { color: colors.text }]}>
                {game.awayTeam.abbreviation}
              </Text>
              <Text style={[styles.score, { color: colors.text }]}>
                {game.awayTeam.score ?? '-'}
              </Text>
            </View>

            <Text style={[styles.at, { color: colors.textSecondary }]}>@</Text>

            <View style={styles.team}>
              <Text style={[styles.score, { color: colors.text }]}>
                {game.homeTeam.score ?? '-'}
              </Text>
              <Text style={[styles.teamAbbr, { color: colors.text }]}>
                {game.homeTeam.abbreviation}
              </Text>
            </View>
          </View>

          <View style={styles.teamNames}>
            <Text style={[styles.teamName, { color: colors.textSecondary }]} numberOfLines={1}>
              {game.awayTeam.name.split(' ').pop()}
            </Text>
            <Text style={[styles.teamName, { color: colors.textSecondary }]} numberOfLines={1}>
              {game.homeTeam.name.split(' ').pop()}
            </Text>
          </View>
        </View>

        {/* Status Icons Column */}
        <View style={styles.statusColumn}>
          {renderStatusIcons()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dimmed: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    width: 70,
    alignItems: 'flex-start',
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timePillPulsing: {
    // Animation added via Animated API in parent
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreboardColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  team: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamAbbr: {
    fontSize: 16,
    fontWeight: '700',
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
  },
  at: {
    fontSize: 14,
    fontWeight: '400',
  },
  teamNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  teamName: {
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  statusColumn: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  statusIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  blackoutIcon: {
    backgroundColor: '#FFB6C1',
    borderWidth: 1,
    borderColor: '#FF3B30',
    position: 'relative',
  },
  blackoutSlash: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: '#FF3B30',
    transform: [{ rotate: '45deg' }],
    top: 5,
    left: -1,
  },
});
