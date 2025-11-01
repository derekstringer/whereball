/**
 * Vertical Game Card - Apple Calendar style
 * Time on left, centered scoreboard, status icons on right
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { AlarmClockCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/appStore';
import { NHLGame } from '../../lib/nhl-api';
import { getServicesForGameSplit } from '../../lib/service-helpers';
import { LiveClockWidget } from './LiveClockWidget';

interface VerticalGameCardProps {
  game: NHLGame;
  userServiceCodes: string[];
  currentTime?: Date;
  isExpanded?: boolean;
  onPress?: () => void;
}

export const VerticalGameCard: React.FC<VerticalGameCardProps> = React.memo(({
  game,
  userServiceCodes,
  currentTime,
  isExpanded = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const { filtersV2, hasReminders } = useAppStore();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const { subscribed, unsubscribed } = getServicesForGameSplit(game, userServiceCodes);
  
  // Check if reminders are set for this game
  const reminderSet = hasReminders(game.id);
  
  // Determine game state with robust detection
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
  
  // Detect if game is live using multiple signals
  const hasScores = game.homeTeam.score !== undefined || game.awayTeam.score !== undefined;
  const startTime = new Date(game.startTime);
  
  // Get current time (fresh on every render for accurate red intensity)
  const now = currentTime || new Date();
  
  const minutesSinceStart = (now.getTime() - startTime.getTime()) / 60000;
  const startTimePassed = minutesSinceStart > 5; // 5 min grace period
  
  // Game is live if: API says so, OR has scores, OR start time passed (and not final)
  const isLive = !isFinal && (
    game.gameState === 'LIVE' || 
    hasScores || 
    startTimePassed
  );
  
  const isUpcoming = !isLive && !isFinal;
  
  // Create clock data for live games (use API data if available, otherwise create fallback)
  const clockData = useMemo(() => {
    if (!isLive) return null;
    
    // If we have real clock data from API, use it
    if (game.clock) {
      return game.clock;
    }
    
    // Otherwise create fallback clock for detected live games
    return {
      timeRemaining: 'LIVE',
      period: 1,
      periodType: 'REG' as const,
      inIntermission: false,
      periodOrdinal: '1st',
    };
  }, [isLive, game.clock]);

  // Calculate time display and red intensity
  const { timeDisplay, redIntensity } = useMemo(() => {
    const startTime = new Date(game.startTime);
    
    if (isFinal) {
      // Show game start time for final games, not "Final"
      const time = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return { timeDisplay: time, redIntensity: 0 };
    }
    
    if (isLive) {
      const time = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return { timeDisplay: time, redIntensity: 1 };
    }

    // Upcoming game - calculate time until start
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Calculate red intensity based on time until start
    let intensity = 0;
    if (diffMins < 0) {
      intensity = 1; // Game starting/started
    } else if (diffMins <= 5) {
      intensity = 0.9;
    } else if (diffMins <= 10) {
      intensity = 0.75;
    } else if (diffMins <= 30) {
      intensity = 0.5;
    } else if (diffMins <= 60) {
      intensity = 0.25;
    } else if (diffMins <= 120) {
      intensity = 0.1;
    }

    // Always show static game time
    const time = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { timeDisplay: time, redIntensity: intensity };
  }, [game.startTime, isLive, isFinal, now]);

  // Render status icons
  const renderStatusIcons = () => {
    const icons = [];
    
    // Green: on your services (always show)
    if (subscribed.length > 0) {
      icons.push(
        <Image
          key="available"
          source={require('../../../assets/icons/available.png')}
          style={styles.statusIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Yellow: available but not yours (always show)
    if (unsubscribed.length > 0) {
      icons.push(
        <Image
          key="elsewhere"
          source={require('../../../assets/icons/elsewhere.png')}
          style={styles.statusIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Blue: national broadcast (always show)
    const hasNational = game.broadcasts.some(b => b.type === 'national');
    if (hasNational) {
      icons.push(
        <Image
          key="national"
          source={require('../../../assets/icons/national.png')}
          style={styles.statusIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Red: blackout (placeholder logic)
    // TODO: Implement actual blackout detection
    const isBlackedOut = false;
    if (isBlackedOut) {
      icons.push(
        <Image
          key="blackout"
          source={require('../../../assets/icons/blackout.png')}
          style={styles.statusIcon}
          resizeMode="contain"
        />
      );
    }

    return icons;
  };

  // Time background and border styling (LAYERED APPROACH)
  const timeBackgroundColor = useMemo(() => {
    // Red background always shows based on urgency (even with reminder)
    if (redIntensity === 0) return 'transparent';
    const alpha = Math.floor(redIntensity * 255).toString(16).padStart(2, '0');
    return `#FF3B30${alpha}`;
  }, [redIntensity]);

  const timeBorderColor = useMemo(() => {
    // Cyan border when reminder is set (only for upcoming games)
    if (reminderSet && !isFinal && !isLive) return colors.primary;
    return 'transparent';
  }, [reminderSet, isFinal, isLive, colors.primary]);

  const timeTextColor = useMemo(() => {
    // White for red backgrounds (urgency takes priority)
    if (redIntensity > 0) return '#FFFFFF';
    // Gray for normal (including when reminder is set)
    return colors.textSecondary;
  }, [redIntensity, colors.textSecondary]);

  // Shimmer animation for live games
  useEffect(() => {
    if (redIntensity > 0.8) {
      // Game is live - start continuous shimmer
      shimmerAnim.setValue(0);
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Not live - stop animation
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    }
  }, [redIntensity, shimmerAnim]);

  // Calculate shimmer position (moves from left to right across pill)
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <TouchableOpacity
      style={[styles.container, isFinal && styles.dimmed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {/* TIME Column (fixed 84px) */}
        <View style={styles.timeCol}>
          <View
            style={[
              styles.timePill,
              { 
                backgroundColor: timeBackgroundColor,
                borderWidth: reminderSet && !isFinal && !isLive ? 2 : 0,
                borderColor: timeBorderColor,
              },
            ]}
          >
            <Text style={[styles.timeText, { color: timeTextColor }]}>
              {timeDisplay}
            </Text>
            
            {/* Shimmer overlay for live games */}
            {redIntensity > 0.8 && (
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [
                      { translateX: shimmerTranslate },
                      { rotate: '-45deg' },
                    ],
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Gutter after TIME */}
        <View style={styles.gutter} />

        {/* LEFT TEAM Column (flex) - Away Team */}
        <View style={styles.teamColLeft}>
          <View style={styles.abbrScoreRow}>
            <Text style={[styles.cityCode, styles.leftAlign, { color: colors.text }]}>
              {game.awayTeam.abbreviation}
            </Text>
            <Text style={[styles.score, { color: colors.text }]}>
              {game.awayTeam.score !== undefined ? game.awayTeam.score : (isLive ? '0' : '-')}
            </Text>
          </View>
          <Text
            style={[styles.teamName, styles.leftAlign, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {game.awayTeam.name.replace(/^[^ ]+ /, '')}
          </Text>
        </View>

        {/* CENTER: Live Clock Widget, "Final", "@", or reminder icon above @ */}
        {isLive && clockData ? (
          <View style={styles.centerCol}>
            <LiveClockWidget clock={clockData} />
          </View>
        ) : isFinal ? (
          <Text style={[styles.atCol, { color: colors.textSecondary }]}>Final</Text>
        ) : (
          <View style={styles.centerCol}>
            {/* TEST: Icon removed, using time pill green instead */}
            <Text style={[styles.atText, { color: colors.textSecondary }]}>@</Text>
          </View>
        )}

        {/* RIGHT TEAM Column (flex) - Home Team */}
        <View style={styles.teamColRight}>
          <View style={styles.abbrScoreRowRight}>
            <Text style={[styles.score, { color: colors.text }]}>
              {game.homeTeam.score !== undefined ? game.homeTeam.score : (isLive ? '0' : '-')}
            </Text>
            <Text style={[styles.cityCode, styles.rightAlign, { color: colors.text }]}>
              {game.homeTeam.abbreviation}
            </Text>
          </View>
          <Text
            style={[styles.teamName, styles.rightAlign, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {game.homeTeam.name.replace(/^[^ ]+ /, '')}
          </Text>
        </View>

        {/* Larger gutter before ACTIONS for breathing room */}
        <View style={styles.actionsGutter} />

        {/* ACTIONS Column (fixed 72px) */}
        <View style={styles.actionsCol}>
          {renderStatusIcons()}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 96,
    paddingHorizontal: 16,
    justifyContent: 'center',
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
  // TIME Column (fixed)
  timeCol: {
    width: 84,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
    width: 30,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Gutter spacing
  gutter: {
    width: 12,
  },
  // Reminder icon positioned above @
  reminderIconAbove: {
    marginBottom: 2,
  },
  // Larger gutter before actions for breathing room
  actionsGutter: {
    width: 16,
  },
  // LEFT TEAM Column (flex)
  teamColLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  // CENTER Column (live clock or @)
  centerCol: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // AT Column (fixed) - increased width for "Final"
  atCol: {
    minWidth: 45,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
  },
  // AT text (used when in centerCol with reminder icon)
  atText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  // RIGHT TEAM Column (flex)
  teamColRight: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  // ACTIONS Column (fixed)
  actionsCol: {
    width: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  // Team elements
  abbrScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abbrScoreRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cityCode: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  teamName: {
    fontSize: 12,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  leftAlign: {
    textAlign: 'left',
  },
  rightAlign: {
    textAlign: 'right',
  },
  statusIcon: {
    width: 28,
    height: 28,
  },
});
