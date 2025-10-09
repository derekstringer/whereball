/**
 * Filter Bottom Sheet
 * Global filter UI for all game views
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useAppStore, type GameFilters } from '../../store/appStore';

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
  const { filters, toggleFilter, resetFilters } = useAppStore();

  const activeCount = Object.values(filters).filter(Boolean).length;

  const handleToggle = (filterKey: keyof GameFilters) => {
    toggleFilter(filterKey);
  };

  const handleClear = () => {
    resetFilters();
  };

  const handleApply = () => {
    onClose();
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
          style={styles.sheet}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.content}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.myTeamsOnly && styles.filterOptionActive,
              ]}
              onPress={() => handleToggle('myTeamsOnly')}
              activeOpacity={0.7}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.checkbox, filters.myTeamsOnly && styles.checkboxActive]}>
                  {filters.myTeamsOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, filters.myTeamsOnly && styles.filterLabelActive]}>
                    My Teams Only
                  </Text>
                  <Text style={styles.filterDescription}>
                    Show games for teams you follow
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.nationalOnly && styles.filterOptionActive,
              ]}
              onPress={() => handleToggle('nationalOnly')}
              activeOpacity={0.7}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.checkbox, filters.nationalOnly && styles.checkboxActive]}>
                  {filters.nationalOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, filters.nationalOnly && styles.filterLabelActive]}>
                    National Games Only
                  </Text>
                  <Text style={styles.filterDescription}>
                    ESPN, TNT, ABC, NHL Network
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.availableOnly && styles.filterOptionActive,
              ]}
              onPress={() => handleToggle('availableOnly')}
              activeOpacity={0.7}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.checkbox, filters.availableOnly && styles.checkboxActive]}>
                  {filters.availableOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, filters.availableOnly && styles.filterLabelActive]}>
                    On MY Services
                  </Text>
                  <Text style={styles.filterDescription}>
                    Available on your subscriptions
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.streamingOnly && styles.filterOptionActive,
              ]}
              onPress={() => handleToggle('streamingOnly')}
              activeOpacity={0.7}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.checkbox, filters.streamingOnly && styles.checkboxActive]}>
                  {filters.streamingOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, filters.streamingOnly && styles.filterLabelActive]}>
                    On ANY Services
                  </Text>
                  <Text style={styles.filterDescription}>
                    Streaming anywhere, not just your subscriptions
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {!hideLiveFilter && (
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.liveOnly && styles.filterOptionActive,
                ]}
                onPress={() => handleToggle('liveOnly')}
                activeOpacity={0.7}
              >
                <View style={styles.filterLeft}>
                  <View style={[styles.checkbox, filters.liveOnly && styles.checkboxActive]}>
                    {filters.liveOnly && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.filterText}>
                    <Text style={[styles.filterLabel, filters.liveOnly && styles.filterLabelActive]}>
                      Live Only
                    </Text>
                    <Text style={styles.filterDescription}>
                      Games currently in progress
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={[
                styles.filterOption,
                filters.showAll && styles.filterOptionActive,
              ]}
              onPress={() => handleToggle('showAll')}
              activeOpacity={0.7}
            >
              <View style={styles.filterLeft}>
                <View style={[styles.checkbox, filters.showAll && styles.checkboxActive]}>
                  {filters.showAll && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.filterText}>
                  <Text style={[styles.filterLabel, filters.showAll && styles.filterLabelActive]}>
                    Show All Games
                  </Text>
                  <Text style={styles.filterDescription}>
                    Override all filters
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Apply</Text>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
    color: '#000000',
  },
  badge: {
    backgroundColor: '#0066CC',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#E6F2FF',
    borderColor: '#0066CC',
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
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
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
    color: '#333333',
    marginBottom: 2,
  },
  filterLabelActive: {
    color: '#0066CC',
  },
  filterDescription: {
    fontSize: 13,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
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
