/**
 * ServicesSectionV3 - Grid-based service selection with star + check
 * Simple 2-control system: Star = own/subscribe, Check = include in current filter
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { CollapsibleSection } from './CollapsibleSection';
import { STREAMING_SERVICES } from '../../../constants/services';

interface ServicesSectionV3Props {
  selectedServices: string[]; // Service codes included in current filter
  ownedServices: string[]; // Service codes user owns (saved to profile)
  onToggleOwned: (serviceCode: string) => void; // Star - saves to profile
  onToggleInclude: (serviceCode: string) => void; // Check - this filter only
  isExpanded: boolean; // Accordion state from parent
  onToggleExpanded: () => void; // Accordion toggle from parent
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 4;
const SCROLLVIEW_PADDING = 48; // 24px on each side from FiltersSheetV2
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - SCROLLVIEW_PADDING - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

export const ServicesSectionV3: React.FC<ServicesSectionV3Props> = ({
  selectedServices,
  ownedServices,
  onToggleOwned,
  onToggleInclude,
  isExpanded,
  onToggleExpanded,
}) => {
  const { colors } = useTheme();

  // Get display name (abbreviate DIRECTV STREAM)
  const getDisplayName = (name: string) => {
    if (name === 'DIRECTV STREAM') return 'DirecTV';
    return name;
  };

  // Sort services: ★ (owned), ✓ (checked but not owned), rest
  const sortedServices = useMemo(() => {
    return [...STREAMING_SERVICES].sort((a, b) => {
      const aOwned = ownedServices.includes(a.code);
      const bOwned = ownedServices.includes(b.code);
      const aIncluded = selectedServices.includes(a.code);
      const bIncluded = selectedServices.includes(b.code);

      // Priority 1: ALL ★ owned services (regardless of check state)
      if (aOwned && !bOwned) return -1;
      if (!aOwned && bOwned) return 1;

      // Priority 2: ✓ only (checked but not owned)
      const aCheckedOnly = !aOwned && aIncluded;
      const bCheckedOnly = !bOwned && bIncluded;
      if (aCheckedOnly && !bCheckedOnly) return -1;
      if (!aCheckedOnly && bCheckedOnly) return 1;

      // Alphabetical within same priority
      return a.name.localeCompare(b.name);
    });
  }, [ownedServices, selectedServices]);

  // Badge logic: Show counts with icons (★ for owned, ✓ for checked-only)
  const badges = useMemo(() => {
    const ownedCount = ownedServices.length;
    const checkedOnlyCount = selectedServices.filter(code => !ownedServices.includes(code)).length;
    
    // Case 1: Nothing selected
    if (selectedServices.length === 0) {
      return [{ text: 'ALL' }];
    }
    
    // Case 2: Only owned services (no additional checked)
    if (checkedOnlyCount === 0) {
      return [{ text: String(ownedCount), icon: '★' }];
    }
    
    // Case 3: Both owned and checked-only services
    return [
      { text: String(ownedCount), icon: '★' },
      { text: String(checkedOnlyCount), icon: '✓' },
    ];
  }, [selectedServices, ownedServices]);

  // Handle ownership toggle with auto-check behavior
  const handleOwnershipToggle = (serviceCode: string) => {
    const isOwned = ownedServices.includes(serviceCode);
    const isIncluded = selectedServices.includes(serviceCode);

    // Always toggle ownership first
    onToggleOwned(serviceCode);
    
    if (isOwned) {
      // Un-owning → auto-uncheck if it's checked
      if (isIncluded) {
        onToggleInclude(serviceCode); // Remove from filter
      }
    } else {
      // Owning → auto-check
      if (!isIncluded) {
        onToggleInclude(serviceCode); // Add to filter
      }
    }
  };

  return (
    <CollapsibleSection
      title="Streaming Services"
      badges={badges}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      {/* Services Grid */}
      <View style={styles.grid}>
        {sortedServices.map((service) => {
          const isOwned = ownedServices.includes(service.code);
          const isIncluded = selectedServices.includes(service.code);

          return (
            <View
              key={service.code}
              style={[
                styles.serviceCard,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Row 1: Service name */}
              <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
                {getDisplayName(service.name)}
              </Text>

              {/* Row 2: Controls */}
              <View style={styles.controls}>
                {/* Star (Own) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isOwned ? colors.primary : colors.border },
                  ]}
                  onPress={() => handleOwnershipToggle(service.code)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isOwned ? colors.primary : colors.textSecondary }}>
                    {isOwned ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>

                {/* Check (Include in filter) */}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { borderColor: isIncluded ? colors.primary : colors.border },
                  ]}
                  onPress={() => onToggleInclude(service.code)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: isIncluded ? colors.primary : colors.textSecondary }}>
                    {isIncluded ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  serviceCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
