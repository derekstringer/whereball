/**
 * ServicesSection - Service chips grouped by owned/not-owned
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { STREAMING_SERVICES } from '../../../constants/services';
import { Service } from '../../../types';
import { CollapsibleSection } from './CollapsibleSection';

interface ServicesSectionProps {
  selectedServices: string[];
  ownedServices: string[];
  onToggleService: (serviceCode: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  selectedServices,
  ownedServices,
  onToggleService,
  isExpanded,
  onToggleExpanded,
}) => {
  const { colors } = useTheme();

  const ownedServicesList = STREAMING_SERVICES.filter(s => ownedServices.includes(s.code));
  const notOwnedServicesList = STREAMING_SERVICES.filter(s => !ownedServices.includes(s.code));

  // Badges
  const badges = useMemo(() => {
    if (selectedServices.length === 0) return [{ text: 'ALL' }];
    return [{ text: String(selectedServices.length) }];
  }, [selectedServices.length]);

  const renderServiceChip = (service: Service, isOwned: boolean) => {
    const isSelected = selectedServices.includes(service.code);

    return (
      <TouchableOpacity
        key={service.code}
        style={[
          styles.serviceChip,
          { backgroundColor: colors.card, borderColor: colors.stroke },
          isSelected && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '15',
          },
        ]}
        onPress={() => onToggleService(service.code)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.serviceLabel,
            { color: colors.text },
            isSelected && { color: colors.primary, fontWeight: '700' },
          ]}
        >
          {service.name}
        </Text>
        {isOwned && (
          <View style={[styles.ownedBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.ownedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CollapsibleSection
      title="Streaming Services"
      badges={badges}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      {/* Owned Services */}
      {ownedServicesList.length > 0 && (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
            Your Services
          </Text>
          <View style={styles.chipsGrid}>
            {ownedServicesList.map(service => renderServiceChip(service, true))}
          </View>
        </View>
      )}

      {/* Not Owned Services */}
      {notOwnedServicesList.length > 0 && (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
            Other Services
          </Text>
          <View style={styles.chipsGrid}>
            {notOwnedServicesList.map(service => renderServiceChip(service, false))}
          </View>
        </View>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  ownedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
