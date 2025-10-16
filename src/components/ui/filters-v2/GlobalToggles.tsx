/**
 * GlobalToggles - Badge visibility preferences
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface GlobalTogglesProps {
  showElsewhereBadges: boolean;
  showNationalBadges: boolean;
  onToggleElsewhere: () => void;
  onToggleNational: () => void;
}

export const GlobalToggles: React.FC<GlobalTogglesProps> = ({
  showElsewhereBadges,
  showNationalBadges,
  onToggleElsewhere,
  onToggleNational,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        BADGE VISIBILITY
      </Text>

      <View style={styles.togglesList}>
        {/* Elsewhere Badges Toggle */}
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.card, borderColor: colors.stroke },
          ]}
        >
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Show 'Available Elsewhere' badges
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              See games on services you don't own
            </Text>
          </View>
          <Switch
            value={showElsewhereBadges}
            onValueChange={onToggleElsewhere}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* National Badges Toggle */}
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: colors.card, borderColor: colors.stroke },
          ]}
        >
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Show 'Nationally Televised' badge
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Highlight games available nationwide
            </Text>
          </View>
          <Switch
            value={showNationalBadges}
            onValueChange={onToggleNational}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  togglesList: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
  },
});
