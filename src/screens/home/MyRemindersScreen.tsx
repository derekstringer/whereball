/**
 * My Reminders Screen - Shows DailyV3 filtered to games with reminders
 */

import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { useAppStore } from '../../store/appStore';

export const MyRemindersScreen: React.FC = () => {
  const { setExpandedGameId } = useAppStore();
  const isFocused = useIsFocused();
  
  // Collapse any expanded cards when LEAVING this screen (on blur)
  React.useEffect(() => {
    if (!isFocused) {
      // When screen loses focus, collapse all cards
      setExpandedGameId('nhl', null);
      setExpandedGameId('nba', null);
      setExpandedGameId('mlb', null);
      setExpandedGameId('nfl', null);
    }
  }, [isFocused, setExpandedGameId]);
  
  return <DailyV3 viewMode="reminders" />;
};
