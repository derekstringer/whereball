/**
 * Filter Bottom Sheet
 * Global filter UI for all game views
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
  Animated,
} from 'react-native';
import { useAppStore, type GameFilters } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  hideLiveFilter?: boolean; // Hide "Live Only" for Weekly/Team views
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  hideLiveFilter = false,
}) => {
  const { colors } = useTheme();
  const { filters, toggleFilter, resetFilters } = useAppStore();
  const activeCount = Object.values(filters).filter(Boolean).length;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          // Could add animation here if desired
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 50px, dismiss
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;

  const handleToggle = (filterKey: keyof GameFilters) => {
    toggleFilter(filterKey);
  };

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
            <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.content}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                filters.myTeamsOnly && { 
                  borderColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                },
              ]}
              onPress={() => handleToggle('myTeamsOnly')}
              activeOpacity={0.8}
            >
              <View style={styles.filterLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.myTeamsOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.myTeamsOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, { color: colors.text }, filters.myTeamsOnly && { color: colors.accent }]}>
                    My Teams Only
                  </Text>
                  <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                    Show games for teams you follow
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                filters.nationalOnly && { 
                  borderColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                },
              ]}
              onPress={() => handleToggle('nationalOnly')}
              activeOpacity={0.8}
            >
              <View style={styles.filterLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.nationalOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.nationalOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, { color: colors.text }, filters.nationalOnly && { color: colors.accent }]}>
                    National Games Only
                  </Text>
                  <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                    ESPN, TNT, ABC, NHL Network
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                filters.availableOnly && { 
                  borderColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                },
              ]}
              onPress={() => handleToggle('availableOnly')}
              activeOpacity={0.8}
            >
              <View style={styles.filterLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.availableOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.availableOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, { color: colors.text }, filters.availableOnly && { color: colors.accent }]}>
                    On MY Services
                  </Text>
                  <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                    Available on your subscriptions
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                filters.streamingOnly && { 
                  borderColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                },
              ]}
              onPress={() => handleToggle('streamingOnly')}
              activeOpacity={0.8}
            >
              <View style={styles.filterLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.streamingOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.streamingOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, { color: colors.text }, filters.streamingOnly && { color: colors.accent }]}>
                    On ANY Services
                  </Text>
                  <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                    Streaming anywhere, not just your subscriptions
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {!hideLiveFilter && (
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: colors.card, borderColor: colors.stroke },
                  filters.liveOnly && { 
                    borderColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                  },
                ]}
                onPress={() => handleToggle('liveOnly')}
                activeOpacity={0.8}
              >
                <View style={styles.filterLeft}>
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                    filters.liveOnly && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}>
                    {filters.liveOnly && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.filterText}>
                    <Text style={[styles.filterLabel, { color: colors.text }, filters.liveOnly && { color: colors.accent }]}>
                      Live Only
                    </Text>
                    <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                      Games currently in progress
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={[
                styles.filterOption,
                { backgroundColor: colors.card, borderColor: colors.stroke },
                filters.showAll && { 
                  borderColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                },
              ]}
              onPress={() => handleToggle('showAll')}
              activeOpacity={0.8}
            >
              <View style={styles.filterLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  filters.showAll && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {filters.showAll && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, { color: colors.text }, filters.showAll && { color: colors.accent }]}>
                    Show All Games
                  </Text>
                  <Text style={[styles.filterDescription, { color: colors.textSecondary }]}>
                    Override all filters
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '80%',
    paddingBottom: 40,
  },
  handleContainer: {
    paddingVertical: 8,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  content: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  filterOptionActive: {
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxActive: {
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  filterText: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterLabelActive: {
  },
  filterDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#0066CC',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
