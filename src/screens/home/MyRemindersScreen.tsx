/**
 * My Reminders Screen - Shows DailyV3 filtered to games with reminders
 */

import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { useAppStore } from '../../store/appStore';

export const MyRemindersScreen: React.FC = () => {
  const { setExpandedGameId } = useAppStore();
  
  // Collapse any expanded cards when LEAVING this screen (on blur)
  useFocusEffect(
    React.useCallback(() => {
      // Return cleanup function that runs when screen loses focus
      return () => {
        setExpandedGameId('nhl', null);
        setExpandedGameId('nba', null);
        setExpandedGameId('mlb', null);
        setExpandedGameId('nfl', null);
      };
    }, [setExpandedGameId])
  );
  
  return <DailyV3 viewMode="reminders" />;
};
