/**
 * CollapsibleSection - Reusable collapsible header component
 * Used by Sports, Teams, and Services sections
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface Badge {
  text: string;
  icon?: string | React.ReactNode; // Optional icon - emoji string or React component (e.g., Lucide icon)
}

interface CollapsibleSectionProps {
  title: string;
  badges: Badge[]; // Array of badges for flexibility
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  badges,
  isExpanded,
  onToggle,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[
          styles.header,
          { backgroundColor: colors.card, borderColor: colors.border },
          isExpanded && {
            backgroundColor: colors.primary + '08',
            borderColor: colors.primary + '40',
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        
        <View style={styles.right}>
          {badges.map((badge, index) => (
            <View
              key={index}
              style={[
                styles.badge,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {badge.text}
              </Text>
              {badge.icon && (
                typeof badge.icon === 'string' ? (
                  <Text style={[styles.badgeIcon, { color: colors.primary }]}>
                    {badge.icon}
                  </Text>
                ) : (
                  <View style={styles.badgeIconComponent}>
                    {badge.icon}
                  </View>
                )
              )}
            </View>
          ))}
          
          <Text
            style={[
              styles.chevron,
              { color: colors.textSecondary },
              isExpanded && styles.chevronExpanded,
            ]}
          >
            ›
          </Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeIcon: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  badgeIconComponent: {
    marginLeft: 3,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    transform: [{ rotate: '0deg' }], // Right arrow (collapsed)
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }], // Down arrow (expanded)
  },
  content: {
    marginTop: 12,
  },
});
