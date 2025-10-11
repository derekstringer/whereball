/**
 * Section Header - Sport section header with icon and collapsible caret
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SectionHeaderProps {
  sport: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const SPORT_ICONS: Record<string, string> = {
  NHL: '🏒',
  NBA: '🏀',
  NFL: '🏈',
  MLB: '⚾',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  sport,
  isCollapsed = false,
  onToggle,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={onToggle ? 0.7 : 1}
      disabled={!onToggle}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>{SPORT_ICONS[sport] || '🏆'}</Text>
        <Text style={[styles.label, { color: colors.text }]}>{sport}</Text>
      </View>
      {onToggle && (
        <Text style={[styles.caret, { color: colors.textSecondary }]}>
          {isCollapsed ? '▶' : '▼'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
  },
  caret: {
    fontSize: 12,
  },
});
