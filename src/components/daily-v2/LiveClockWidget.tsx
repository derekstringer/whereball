/**
 * Live Clock Widget - Shows game clock and period for live games
 * Replaces "@" symbol in center of card when game is live
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NHLGame } from '../../lib/nhl-api';

interface LiveClockWidgetProps {
  clock: NHLGame['clock'];
}

export const LiveClockWidget: React.FC<LiveClockWidgetProps> = ({ clock }) => {
  if (!clock) return null;

  // Determine color based on game state
  let textColor = '#FFFFFF'; // White for regular play (matches city codes/scores)
  let displayTime = clock.timeRemaining;
  let displayPeriod = clock.periodOrdinal;

  if (clock.inIntermission) {
    textColor = '#FFC107'; // Amber for intermission
    displayTime = 'Int';
  } else if (clock.periodType === 'SO') {
    textColor = '#9C27B0'; // Purple for shootout
    displayTime = 'SO';
    displayPeriod = '';
  } else if (clock.periodType === 'OT') {
    textColor = '#FF6B00'; // Orange for overtime
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.time, { color: textColor }]}>{displayTime}</Text>
      {displayPeriod && (
        <Text style={[styles.period, { color: textColor }]}>{displayPeriod}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  period: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
});
