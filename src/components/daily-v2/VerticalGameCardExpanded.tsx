/**
 * Vertical Game Card Expanded - Inline expansion maintaining layout
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { AlarmClockCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { NHLGame } from '../../lib/nhl-api';
import { getServicesForGameSplit, deepLinkToService, affiliateCTA } from '../../lib/service-helpers';
import { useAppStore } from '../../store/appStore';
import { STREAMING_SERVICES } from '../../constants/services';
import { LiveClockWidget } from './LiveClockWidget';
import { TimePickerBottomSheet } from '../ui/TimePickerBottomSheet';

interface VerticalGameCardExpandedProps {
  game: NHLGame;
  userServiceCodes: string[];
  onCollapse: () => void;
}

export const VerticalGameCardExpanded: React.FC<VerticalGameCardExpandedProps> = ({
  game,
  userServiceCodes,
  onCollapse,
}) => {
  const { colors } = useTheme();
  const { filters, filtersV2, hasReminders, addAlert, removeAlertsForGame } = useAppStore();
  const { subscribed, unsubscribed } = getServicesForGameSplit(game, userServiceCodes);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Check if reminders are set for this game
  const reminderSet = hasReminders(game.id);

  const showDiscovery = filters.showAllServices;
  const hasSubscribed = subscribed.length > 0;
  const hasUnsubscribed = unsubscribed.length > 0;

  // Determine game state with robust detection
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
  
  // Detect if game is live using multiple signals
  const hasScores = game.homeTeam.score !== undefined || game.awayTeam.score !== undefined;
  const startTime = new Date(game.startTime);
  const now = new Date();
  const minutesSinceStart = (now.getTime() - startTime.getTime()) / 60000;
  const startTimePassed = minutesSinceStart > 5; // 5 min grace period
  
  // Game is live if: API says so, OR has scores, OR start time passed (and not final)
  const isLive = !isFinal && (
    game.gameState === 'LIVE' || 
    hasScores || 
    startTimePassed
  );
  
  // Create clock data for live games
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

  // Calculate red intensity for time pill
  const redIntensity = useMemo(() => {
    if (isFinal) return 0;
    if (isLive) return 1;
    
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 1;
    if (diffMins <= 5) return 0.9;
    if (diffMins <= 10) return 0.75;
    if (diffMins <= 30) return 0.5;
    if (diffMins <= 60) return 0.25;
    if (diffMins <= 120) return 0.1;
    return 0;
  }, [isFinal, isLive, startTime, now]);

  // Time background and border styling (LAYERED APPROACH - matches collapsed card)
  const timeBackgroundColor = useMemo(() => {
    // Red background always shows based on urgency (even with reminder)
    if (redIntensity === 0) return 'transparent';
    const alpha = Math.floor(redIntensity * 255).toString(16).padStart(2, '0');
    return `#FF3B30${alpha}`;
  }, [redIntensity]);

  const timeBorderColor = useMemo(() => {
    // Cyan border when reminder is set
    if (reminderSet && !isFinal) return colors.primary;
    return 'transparent';
  }, [reminderSet, isFinal, colors.primary]);

  const timeTextColor = useMemo(() => {
    // Cyan text when reminder is set
    if (reminderSet && !isFinal) return colors.primary;
    // White for red backgrounds
    if (redIntensity > 0) return '#FFFFFF';
    // Gray for normal
    return colors.textSecondary;
  }, [reminderSet, isFinal, redIntensity, colors.primary, colors.textSecondary]);

  // Shimmer animation for live games
  useEffect(() => {
    if (redIntensity > 0.8) {
      shimmerAnim.setValue(0);
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    }
  }, [redIntensity, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const handleWatchNow = () => {
    if (subscribed.length > 0) {
      deepLinkToService(subscribed[0].code, game.id);
    }
  };

  const handleServicePress = (serviceCode: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      deepLinkToService(serviceCode, game.id);
    } else {
      affiliateCTA(serviceCode);
    }
  };

  const handleReminderPress = () => {
    if (reminderSet) {
      // Show confirmation dialog before removing
      Alert.alert(
        'Cancel Reminder',
        'Are you sure you want to cancel your reminder for this game?',
        [
          {
            text: "No, Don't Cancel",
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => removeAlertsForGame(game.id),
          },
        ],
        { cancelable: true }
      );
    } else {
      // Open time picker to set reminders
      setShowTimePicker(true);
    }
  };

  const handleSaveReminders = (offsets: number[]) => {
    // Add each reminder
    offsets.forEach(offset => {
      addAlert(game.id, offset);
    });
  };

  // Get service brand color
  const getServiceColor = (code: string): string => {
    const service = STREAMING_SERVICES.find(s => s.code === code);
    // Use service brand colors if defined, otherwise fallback to primary
    const colorMap: Record<string, string> = {
      'espn_plus': '#FF2800',
      'hulu_live': '#1CE783',
      'youtube_tv': '#FF0000',
      'fubo': '#FF6C39',
      'paramount_plus': '#0064FF',
      'peacock': '#6E41E2', // Peacock purple/blue
      'prime_video': '#00A8E1',
      'apple_tv_plus': '#FFFFFF',
      'max': '#002BE7',
      'directv_stream': '#0073CF',
      'sling': '#FF6C00',
    };
    return colorMap[code] || colors.primary;
  };

  // Render status icons
  const renderStatusIcons = () => {
    const icons = [];
    
    // Green: always show (on your services)
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
    
    // Yellow: always show
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
    
    // Blue: always show
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

    return icons;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.stroke }]}>
      {/* Header Container - tappable to collapse */}
      <TouchableOpacity onPress={onCollapse} activeOpacity={0.7}>
        {/* Time Pill + Scoreboard Row */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.timePill,
              { 
                backgroundColor: timeBackgroundColor,
                borderWidth: reminderSet && !isFinal ? 2 : 0,
                borderColor: timeBorderColor,
              },
            ]}
          >
            <Text style={[styles.timeText, { color: timeTextColor }]}>
              {new Date(game.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
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

          {/* Scoreboard on same row as time */}
          <View style={styles.scoreboardInline}>
            {/* LEFT TEAM - Away */}
            <View style={styles.teamInlineContainer}>
              <View style={styles.teamInline}>
                <Text style={[styles.teamAbbrInline, { color: colors.text }]}>
                  {game.awayTeam.abbreviation}
                </Text>
                <Text style={[styles.scoreInline, { color: colors.text }]}>
                  {game.awayTeam.score ?? '-'}
                </Text>
              </View>
              <Text style={[styles.teamNameInline, { color: colors.textSecondary }]}>
                {game.awayTeam.name.split(' ').pop()}
              </Text>
            </View>

            {/* CENTER: Live Clock Widget, "Final", or "@" */}
            {isLive && clockData ? (
              <View style={styles.centerColInline}>
                <LiveClockWidget clock={clockData} />
              </View>
            ) : isFinal ? (
              <Text style={[styles.atColInline, { color: colors.textSecondary }]}>Final</Text>
            ) : (
              <Text style={[styles.atColInline, { color: colors.textSecondary }]}>@</Text>
            )}

            {/* RIGHT TEAM - Home */}
            <View style={[styles.teamInlineContainer, styles.teamInlineContainerRight]}>
              <View style={styles.teamInline}>
                <Text style={[styles.scoreInline, { color: colors.text }]}>
                  {game.homeTeam.score ?? '-'}
                </Text>
                <Text style={[styles.teamAbbrInline, { color: colors.text }]}>
                  {game.homeTeam.abbreviation}
                </Text>
              </View>
              <Text style={[styles.teamNameInline, styles.rightAlign, { color: colors.textSecondary }]}>
                {game.homeTeam.name.split(' ').pop()}
              </Text>
            </View>
          </View>
        </View>

        {/* Venue - centered below clock/@ (between scores) */}
        <View style={styles.venueContainer}>
          <View style={styles.venueSpacerLeft} />
          <Text style={[styles.venue, { color: colors.textSecondary }]}>
            {game.venue}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Watch On (Subscribed Services) */}
      {hasSubscribed && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Image
              source={require('../../../assets/icons/available.png')}
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              WATCH ON:
            </Text>
          </View>
          <View style={styles.servicePills}>
            {subscribed.map((service) => (
              isFinal ? (
                // Finished games: muted, non-clickable button
                <View
                  key={service.code}
                  style={[
                    styles.serviceButton, 
                    { backgroundColor: colors.primary, opacity: 0.4 }
                  ]}
                >
                  <Text style={styles.serviceButtonText}>{service.name}</Text>
                </View>
              ) : (
                // Live/upcoming games: normal clickable button
                <TouchableOpacity
                  key={service.code}
                  style={[styles.serviceButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleServicePress(service.code, true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.serviceButtonText}>{service.name}</Text>
                </TouchableOpacity>
              )
            ))}
          </View>
        </View>
      )}

      {/* Also Streaming On (Unsubscribed) - Rectangles for differentiation */}
      {showDiscovery && hasUnsubscribed && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Image
              source={require('../../../assets/icons/elsewhere.png')}
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ALSO STREAMING ON:
            </Text>
          </View>
          <View style={styles.servicePills}>
            {unsubscribed.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[
                  styles.rectangleButton,
                  {
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                    borderColor: 'rgba(128, 128, 128, 0.5)',
                  },
                ]}
                onPress={() => handleServicePress(service.code, false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rectangleButtonText, { color: colors.textSecondary }]}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Nationally Televised On */}
      {game.broadcasts.some(b => b.type === 'national') && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Image
              source={require('../../../assets/icons/national.png')}
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              NATIONALLY TELEVISED ON:
            </Text>
          </View>
          <View style={styles.nationalNetworks}>
            {game.broadcasts
              .filter(b => b.type === 'national')
              .map((broadcast, index) => (
                <View
                  key={index}
                  style={[styles.networkChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.networkChipText, { color: colors.text }]}>
                    {broadcast.network}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Set Reminder - Only show for upcoming games (not started yet) */}
      {!isLive && !isFinal && (
        <TouchableOpacity
          style={[styles.reminderButton, { backgroundColor: colors.primary }]}
          onPress={handleReminderPress}
          activeOpacity={0.8}
        >
          {reminderSet && (
            <AlarmClockCheck size={22} color="#000000" style={styles.reminderIcon} />
          )}
          <Text style={styles.reminderButtonText}>
            {reminderSet ? 'Reminder Set' : 'Set Reminder'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Time Picker Bottom Sheet */}
      <TimePickerBottomSheet
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSave={handleSaveReminders}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 16,
  },
  scoreboardSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  // AT Column (fixed)
  atCol: {
    minWidth: 45,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    paddingTop: 4,
  },
  // RIGHT TEAM Column (flex)
  teamColRight: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  // Team elements
  abbrScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  teamAbbr: {
    fontSize: 16,
    fontWeight: '700',
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 12,
  },
  leftAlign: {
    textAlign: 'left',
  },
  rightAlign: {
    textAlign: 'right',
  },
  details: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gameState: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  venue: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  servicePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  serviceButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  serviceButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  unsubscribedPill: {
    borderWidth: 1.5,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextMuted: {
    fontSize: 13,
    fontWeight: '600',
  },
  rectangleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  rectangleButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reminderButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  reminderIcon: {
    marginRight: -4,
  },
  reminderButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  statusIcon: {
    width: 28,
    height: 28,
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
  nationalNetworks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  networkBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  networkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  networkChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  networkChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Inline scoreboard styles
  scoreboardInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginLeft: 12,
  },
  teamInlineContainer: {
    alignItems: 'flex-start',
  },
  teamInlineContainerRight: {
    alignItems: 'flex-end',
  },
  teamInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamAbbrInline: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreInline: {
    fontSize: 16,
    fontWeight: '700',
  },
  teamNameInline: {
    fontSize: 12,
    marginTop: 2,
    width: '100%',
  },
  centerColInline: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atColInline: {
    minWidth: 45,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  venueSpacerLeft: {
    width: 96, // Time pill (84px) + margin (12px) to align with scoreboard start
  },
});
