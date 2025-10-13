/**
 * Date Header - Apple Calendar style date separator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface DateHeaderProps {
  date: Date;
  isToday?: boolean;
}

export const DateHeader: React.FC<DateHeaderProps> = ({ date, isToday = false }) => {
  const { colors } = useTheme();

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const cyanColor = '#00D9FF';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {isToday && <View style={[styles.todayDot, { backgroundColor: cyanColor }]} />}
        <Text style={[styles.dateText, { color: isToday ? cyanColor : colors.text }]}>
          {dayName} – {monthDay}
        </Text>
        {isToday && (
          <View style={[styles.todayBadge, { backgroundColor: cyanColor }]}>
            <Text style={styles.todayBadgeText}>TODAY</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
