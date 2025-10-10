/**
 * Filter Bottom Sheet - Redesigned Filter System
 * Unified filter experience with sports, teams, services, and game state
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  PanResponder,
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) onClose();
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: colors.filterSheetBg }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>
          
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sports Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sports</Text>
              <View style={styles.chipsRow}>
                {['nhl', 'nba', 'nfl', 'mlb'].map(sport => {
                  const isSelected = filters.sports.includes(sport);
                  return (
                    <TouchableOpacity
                      key={sport}
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
                      onPress={() => toggleSportFilter(sport)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.textSecondary },
                          isSelected && { color: colors.accent },
                        ]}
                      >
                        {sport.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Teams Section */}
            {followedTeamIds.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Teams</Text>
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
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
                    Available on your subscriptions
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
                    Discovery Mode
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Show games on ANY service
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
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    marginBottom: 16,
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
