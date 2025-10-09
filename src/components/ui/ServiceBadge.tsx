/**
 * Service Badge Component
 * Shows streaming service with brand colors
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SERVICE_BRAND_COLORS, STREAMING_SERVICES } from '../../constants/services';

interface ServiceBadgeProps {
  serviceCode: string;
  size?: 'small' | 'medium';
  onPress?: () => void;
}

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({
  serviceCode,
  size = 'small',
  onPress,
}) => {
  const service = STREAMING_SERVICES.find(s => s.code === serviceCode);
  const brandColor = SERVICE_BRAND_COLORS[serviceCode] || '#666666';
  
  if (!service) return null;

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        size === 'small' ? styles.badgeSmall : styles.badgeMedium,
        { backgroundColor: brandColor },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text
        style={[
          styles.badgeText,
          size === 'small' ? styles.badgeTextSmall : styles.badgeTextMedium,
          styles.badgeTextWhite,
        ]}
        numberOfLines={1}
      >
        {service.name}
      </Text>
    </TouchableOpacity>
  );
};

interface ServiceBadgesRowProps {
  serviceCodes: string[];
  maxVisible?: number;
  onBadgePress?: (serviceCode: string) => void;
  onMorePress?: () => void;
}

export const ServiceBadgesRow: React.FC<ServiceBadgesRowProps> = ({
  serviceCodes,
  maxVisible = 3,
  onBadgePress,
  onMorePress,
}) => {
  const visibleServices = serviceCodes.slice(0, maxVisible);
  const remainingCount = serviceCodes.length - maxVisible;

  return (
    <View style={styles.row}>
      {visibleServices.map((code) => (
        <ServiceBadge
          key={code}
          serviceCode={code}
          size="small"
          onPress={onBadgePress ? () => onBadgePress(code) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <TouchableOpacity
          style={styles.moreBadge}
          onPress={onMorePress}
          activeOpacity={0.7}
        >
          <Text style={styles.moreBadgeText}>+{remainingCount}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface NotAvailableBadgeProps {
  onPress?: () => void;
}

export const NotAvailableBadge: React.FC<NotAvailableBadgeProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.notAvailableBadge}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.notAvailableText}>—</Text>
    </TouchableOpacity>
  );
};

interface BlackoutBadgeProps {
  onPress?: () => void;
}

export const BlackoutBadge: React.FC<BlackoutBadgeProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.blackoutBadge}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.blackoutText}>🚫 Blackout</Text>
    </TouchableOpacity>
  );
};

interface TooltipProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ visible, message, onDismiss }) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.tooltipContainer}>
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  badgeSmall: {
    minWidth: 60,
    maxWidth: 80,
  },
  badgeMedium: {
    minWidth: 80,
    maxWidth: 120,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeTextWhite: {
    color: '#FFFFFF',
  },
  badgeTextSmall: {
    fontSize: 11,
  },
  badgeTextMedium: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  moreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999999',
    backgroundColor: '#F5F5F5',
    minWidth: 40,
  },
  moreBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    textAlign: 'center',
  },
  notAvailableBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    color: '#757575',
  },
  blackoutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFE6E6',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  blackoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D32F2F',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  tooltip: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
