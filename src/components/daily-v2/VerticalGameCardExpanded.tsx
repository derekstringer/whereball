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
      'peacock': '#000000',
      'prime_video': '#00A8E1',
      'apple_tv_plus': '#000000',
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
      {/* Keep same scoreboard header - maintain center justification */}
      <TouchableOpacity
        style={styles.header}
        onPress={onCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.scoreboardSection}>
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

        <Text style={[styles.collapseIcon, { color: colors.textSecondary }]}>▲</Text>
      </TouchableOpacity>

      {/* Game Details */}
      <View style={styles.details}>
        {isLive && (
          <Text style={[styles.gameState, { color: colors.danger }]}>
            Live Now
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
            📺 WATCH ON:
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

      {/* Also Available On (Unsubscribed) */}
      {showDiscovery && hasUnsubscribed && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            💡 ALSO AVAILABLE:
          </Text>
          <View style={styles.servicePills}>
            {unsubscribed.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[
                  styles.pill,
                  styles.unsubscribedPill,
                  {
                    backgroundColor: `${getServiceColor(service.code)}30`,
                    borderColor: getServiceColor(service.code),
                  },
                ]}
                onPress={() => handleServicePress(service.code, false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillTextMuted, { color: getServiceColor(service.code) }]}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* CTAs */}
      <View style={styles.actions}>
        {hasSubscribed && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleWatchNow}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Watch Now</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.stroke }]}
          onPress={() => {/* TODO: Set reminder */}}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Set Reminder
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreboardSection: {
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
  collapseIcon: {
    fontSize: 16,
    marginLeft: 12,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
