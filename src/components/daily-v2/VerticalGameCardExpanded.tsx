/**
 * Vertical Game Card Expanded - Inline expansion maintaining layout
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NHLGame } from '../../lib/nhl-api';
import { getServicesForGameSplit, deepLinkToService, affiliateCTA } from '../../lib/service-helpers';
import { useAppStore } from '../../store/appStore';
import { STREAMING_SERVICES } from '../../constants/services';

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
  const { filters } = useAppStore();
  const { subscribed, unsubscribed } = getServicesForGameSplit(game, userServiceCodes);

  const showDiscovery = filters.showAllServices;
  const hasSubscribed = subscribed.length > 0;
  const hasUnsubscribed = unsubscribed.length > 0;

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

  const isLive = game.gameState === 'LIVE';
  const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.stroke }]}>
      {/* Header with time and collapse */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onCollapse}
        activeOpacity={0.7}
      >
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          {new Date(game.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
        <Text style={[styles.collapseIcon, { color: colors.textSecondary }]}>▲</Text>
      </TouchableOpacity>

      {/* Scoreboard - Explicit Column Grid */}
      <View style={styles.scoreboardSection}>
        {/* LEFT TEAM Column (flex) - Away Team */}
        <View style={styles.teamColLeft}>
          <View style={styles.abbrScoreRow}>
            <Text style={[styles.teamAbbr, styles.leftAlign, { color: colors.text }]}>
              {game.awayTeam.abbreviation}
            </Text>
            <Text style={[styles.score, { color: colors.text }]}>
              {game.awayTeam.score ?? '-'}
            </Text>
          </View>
          <Text
            style={[styles.teamName, styles.leftAlign, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {game.awayTeam.name.split(' ').pop()}
          </Text>
        </View>

        {/* AT Column (fixed 24px) */}
        <Text style={[styles.atCol, { color: colors.textSecondary }]}>@</Text>

        {/* RIGHT TEAM Column (flex) - Home Team */}
        <View style={styles.teamColRight}>
          <View style={styles.abbrScoreRow}>
            <Text style={[styles.score, { color: colors.text }]}>
              {game.homeTeam.score ?? '-'}
            </Text>
            <Text style={[styles.teamAbbr, styles.rightAlign, { color: colors.text }]}>
              {game.homeTeam.abbreviation}
            </Text>
          </View>
          <Text
            style={[styles.teamName, styles.rightAlign, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {game.homeTeam.name.split(' ').pop()}
          </Text>
        </View>
      </View>

      {/* Game Details */}
      <View style={styles.details}>
        {isLive && (
          <Text style={[styles.gameState, { color: colors.danger }]}>
            2nd Period • 12:34
          </Text>
        )}
        
        <Text style={[styles.venue, { color: colors.textSecondary }]}>
          {game.venue}
        </Text>
      </View>

      {/* Watch On (Subscribed Services) */}
      {hasSubscribed && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            WATCH ON:
          </Text>
          <View style={styles.servicePills}>
            {subscribed.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[styles.pill, { backgroundColor: getServiceColor(service.code) }]}
                onPress={() => handleServicePress(service.code, true)}
                activeOpacity={0.7}
              >
                <Text style={styles.pillText}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Also Available On (Unsubscribed) - Rectangles for differentiation */}
      {showDiscovery && hasUnsubscribed && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ALSO AVAILABLE ON:
          </Text>
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

      {/* Set Reminder - Full width, prominent */}
      <TouchableOpacity
        style={[styles.reminderButton, { backgroundColor: colors.primary }]}
        onPress={() => {/* TODO: Set reminder */}}
        activeOpacity={0.8}
      >
        <Text style={styles.reminderButtonText}>Set Reminder</Text>
      </TouchableOpacity>
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
  // AT Column (fixed)
  atCol: {
    width: 24,
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
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
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
    alignItems: 'center',
    marginTop: 8,
  },
  reminderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
