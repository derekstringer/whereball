/**
 * Filter Bottom Sheet - Redesigned Filter System
 * Unified filter experience with sports, teams, services, and game state
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';
import { NHL_TEAMS } from '../../constants/teams';
import { STREAMING_SERVICES } from '../../constants/services';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  hideLiveFilter?: boolean;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  hideLiveFilter = false,
}) => {
  const { colors } = useTheme();
  const { 
    filters, 
    toggleFilter, 
    toggleSportFilter, 
    toggleTeamFilter, 
    toggleServiceFilter,
    resetFilters,
    follows,
    subscriptions,
  } = useAppStore();

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - gestureState.dy / 400);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const activeCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'sports' || key === 'selectedTeams' || key === 'selectedServices') {
      return count + (Array.isArray(value) ? value.length : 0);
    }
    return count + (value ? 1 : 0);
  }, 0);

  // Get user's followed team IDs
  const followedTeamIds = follows.map(f => f.team_id);
  const subscribedServiceCodes = subscriptions.map(s => s.service_code);

  // Sport icons and colors
  const sportData = {
    nhl: { icon: '🏒', label: 'Hockey', color: '#00B8CC' },
    nba: { icon: '🏀', label: 'Basketball', color: '#FF6B35' },
    nfl: { icon: '🏈', label: 'Football', color: '#4CAF50' },
    mlb: { icon: '⚾', label: 'Baseball', color: '#9C27B0' },
  };

  // Get active filter summary
  const getActiveFilterSummary = () => {
    const parts: string[] = [];
    if (filters.sports.length > 0 && filters.sports.length < 4) {
      parts.push(filters.sports.map(s => s.toUpperCase()).join(', '));
    }
    if (filters.myTeamsOnly) parts.push('My Teams');
    if (filters.myServicesOnly) parts.push('My Services');
    if (filters.showAllServices) parts.push('Discovery');
    if (filters.nationalOnly) parts.push('National');
    if (filters.liveOnly) parts.push('Live');
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const filterSummary = getActiveFilterSummary();

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.filterSheetBg,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.sheetContent}>
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>
          
            {/* Applied Filters Summary Bar */}
            {filterSummary && (
              <View style={[styles.summaryBar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.summaryText, { color: colors.primary }]}>
                  Active: {filterSummary}
                </Text>
              </View>
            )}

            <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
              {activeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
            {activeCount > 0 && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={[styles.clearAll, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

            <ScrollView 
              style={styles.content} 
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Sports Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>My Sports</Text>
                <View style={styles.chipsRow}>
                  {Object.entries(sportData).map(([sport, data]) => {
                    const isSelected = filters.sports.includes(sport);
                    const sportCount = filters.sports.length;
                    return (
                      <TouchableOpacity
                        key={sport}
                        style={[
                          styles.sportChip,
                          { backgroundColor: colors.card, borderColor: colors.stroke },
                          isSelected && {
                            borderColor: data.color,
                            backgroundColor: data.color + '15',
                            shadowColor: data.color,
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          },
                        ]}
                        onPress={() => toggleSportFilter(sport)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sportIcon}>{data.icon}</Text>
                        <Text
                          style={[
                            styles.sportLabel,
                            { color: colors.textSecondary },
                            isSelected && { color: data.color, fontWeight: '700' },
                          ]}
                        >
                          {data.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.sportBadge, { backgroundColor: data.color }]}>
                            <Text style={styles.sportBadgeText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            {/* Teams Section */}
            {followedTeamIds.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>My Teams</Text>
                <View style={styles.chipsGrid}>
                  {followedTeamIds.map(teamId => {
                    const team = NHL_TEAMS.find(t => t.id === teamId);
                    if (!team) return null;
                    const isSelected = filters.selectedTeams.includes(teamId);
                    return (
                      <TouchableOpacity
                        key={teamId}
                        style={[
                          styles.chip,
                          { backgroundColor: colors.card, borderColor: colors.stroke },
                          isSelected && {
                            borderColor: colors.accent,
                            shadowColor: colors.accent,
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                          },
                        ]}
                        onPress={() => toggleTeamFilter(teamId)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: colors.textSecondary },
                            isSelected && { color: colors.accent },
                          ]}
                        >
                          {team.short_code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Services Section */}
            {subscribedServiceCodes.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>My Streaming Services</Text>
                <View style={styles.togglesList}>
                  {subscribedServiceCodes.map(serviceCode => {
                    const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
                    if (!service) return null;
                    const isSelected = filters.selectedServices.includes(serviceCode);
                    return (
                      <TouchableOpacity
                        key={serviceCode}
                        style={[
                          styles.toggleRow,
                          { backgroundColor: colors.card, borderColor: colors.stroke },
                          isSelected && {
                            borderColor: colors.accent,
                            shadowColor: colors.accent,
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                          },
                        ]}
                        onPress={() => toggleServiceFilter(serviceCode)}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.checkbox,
                          { borderColor: colors.border, backgroundColor: colors.bg },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text
                          style={[
                            styles.toggleText,
                            { color: colors.text },
                            isSelected && { color: colors.accent },
                          ]}
                        >
                          {service.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Filters Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Filters</Text>
              
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.myTeamsOnly && {
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => toggleFilter('myTeamsOnly')}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.myTeamsOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.myTeamsOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleText,
                      { color: colors.text },
                      filters.myTeamsOnly && { color: colors.accent },
                    ]}
                  >
                    My Teams Only
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Show games for followed teams
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.myServicesOnly && {
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => toggleFilter('myServicesOnly')}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.myServicesOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.myServicesOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleText,
                      { color: colors.text },
                      filters.myServicesOnly && { color: colors.accent },
                    ]}
                  >
                    On My Services
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Games available on your subscriptions
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.showAllServices && {
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => toggleFilter('showAllServices')}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.showAllServices && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.showAllServices && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleText,
                      { color: colors.text },
                      filters.showAllServices && { color: colors.accent },
                    ]}
                  >
                    On Any Services
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Games available on any streaming platforms
                  </Text>
                </View>
              </TouchableOpacity>


              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.nationalOnly && {
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => toggleFilter('nationalOnly')}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.nationalOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.nationalOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleText,
                      { color: colors.text },
                      filters.nationalOnly && { color: colors.accent },
                    ]}
                  >
                    National Games Only
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    ESPN, TNT, ABC, NHL Network
                  </Text>
                </View>
              </TouchableOpacity>

              {!hideLiveFilter && (
                <TouchableOpacity
                  style={[
                    styles.toggleRow,
                    { backgroundColor: colors.card, borderColor: colors.stroke },
                    filters.liveOnly && {
                      borderColor: colors.accent,
                      shadowColor: colors.accent,
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                    },
                  ]}
                  onPress={() => toggleFilter('liveOnly')}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                    filters.liveOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}>
                    {filters.liveOnly && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.toggleTextContainer}>
                    <Text
                      style={[
                        styles.toggleText,
                        { color: colors.text },
                        filters.liveOnly && { color: colors.accent },
                      ]}
                    >
                      Live Only
                    </Text>
                    <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                      Games in progress
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.showAll && {
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => toggleFilter('showAll')}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.showAll && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.showAll && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.toggleText,
                      { color: colors.text },
                      filters.showAll && { color: colors.accent },
                    ]}
                  >
                    Show All Games
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Override all filters
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>
                  {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount !== 1 ? 's' : ''}` : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  sheetContent: {
    paddingBottom: 20,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 8,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  clearAll: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 140,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBar: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sportChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  sportIcon: {
    fontSize: 32,
  },
  sportLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sportBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  togglesList: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
