/**
 * My Reminders Screen - Shows DailyV3 filtered to games with reminders
 */

import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { useAppStore } from '../../store/appStore';

export const MyRemindersScreen: React.FC = () => {
  const { setExpandedGameId } = useAppStore();
  
  // Collapse any expanded cards when this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setExpandedGameId('nhl', null);
      setExpandedGameId('nba', null);
      setExpandedGameId('mlb', null);
      setExpandedGameId('nfl', null);
    }, [setExpandedGameId])
  );
  
  return <DailyV3 viewMode="reminders" />;
};
