/**
 * BadgesLabelsSection - Independent visual badge toggles
 * Lives at the bottom of the filters sheet
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface BadgesLabelsSectionProps {
  showElsewhereBadges: boolean;
  showNationalBadges: boolean;
  onToggleElsewhere: () => void;
  onToggleNational: () => void;
}

export const BadgesLabelsSection: React.FC<BadgesLabelsSectionProps> = ({
  showElsewhereBadges,
  showNationalBadges,
  onToggleElsewhere,
  onToggleNational,
}) => {
  const { colors } = useTheme();

  const renderToggle = (
    label: string,
    description: string,
    isOn: boolean,
    onToggle: () => void
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.toggleRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        
        {/* Toggle switch */}
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: isOn ? colors.primary : colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              {
                backgroundColor: '#FFFFFF',
                transform: [{ translateX: isOn ? 20 : 2 }],
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        BADGES & LABELS
      </Text>

      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        Visual indicators only • Does not change results
      </Text>

      <View style={styles.toggles}>
        {renderToggle(
          'Show "Available Elsewhere" badges',
          'Yellow pills on rows for other legal options',
          showElsewhereBadges,
          onToggleElsewhere
        )}

        {renderToggle(
          'Show "Nationally Televised" badge',
          'Indicator for games on national broadcasts',
          showNationalBadges,
          onToggleNational
        )}
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
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  toggles: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
