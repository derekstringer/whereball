/**
 * Game Card Expanded - Inline expanded view with full game details
 * Shows services, broadcasters, blackout info, and CTAs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NHLGame } from '../../lib/nhl-api';
import { getServicesForGameSplit, deepLinkToService, affiliateCTA } from '../../lib/service-helpers';
import { useAppStore } from '../../store/appStore';

interface GameCardExpandedProps {
  game: NHLGame;
  userServiceCodes: string[];
  onCollapse: () => void;
}

export const GameCardExpanded: React.FC<GameCardExpandedProps> = ({
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

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.stroke }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onCollapse}
        activeOpacity={0.7}
      >
        <View>
          <Text style={[styles.matchup, { color: colors.text }]}>
            {game.awayTeam.name} @ {game.homeTeam.name}
          </Text>
          <Text style={[styles.venue, { color: colors.textSecondary }]}>
            {game.venue}
          </Text>
        </View>
        <Text style={[styles.collapseIcon, { color: colors.textSecondary }]}>▲</Text>
      </TouchableOpacity>

      {/* Watch On (Subscribed Services) */}
      {hasSubscribed && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Watch on:
          </Text>
          <View style={styles.servicePills}>
            {subscribed.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[styles.pill, styles.subscribedPill, { backgroundColor: colors.primary }]}
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
            Also available on:
          </Text>
          <View style={styles.servicePills}>
            {unsubscribed.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[styles.pill, styles.unsubscribedPill, { borderColor: colors.stroke }]}
                onPress={() => handleServicePress(service.code, false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillTextMuted, { color: colors.textSecondary }]}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Broadcasters */}
      {game.broadcasts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Broadcasters:
          </Text>
          <View style={styles.broadcasters}>
            {game.broadcasts.map((broadcast, index) => (
              <View
                key={index}
                style={[
                  styles.broadcasterBadge,
                  { backgroundColor: colors.surface, borderColor: colors.stroke },
                ]}
              >
                <Text style={[styles.broadcasterText, { color: colors.text }]}>
                  {broadcast.network}
                </Text>
                {broadcast.type === 'national' && (
                  <View style={[styles.nationalBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.nationalText}>NAT</Text>
                  </View>
                )}
              </View>
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

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {new Date(game.startTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  matchup: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  venue: {
    fontSize: 13,
  },
  collapseIcon: {
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
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
  subscribedPill: {
    // backgroundColor set inline
  },
  unsubscribedPill: {
    borderWidth: 1,
    backgroundColor: 'transparent',
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
  broadcasters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  broadcasterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  broadcasterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nationalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nationalText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  meta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metaText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
