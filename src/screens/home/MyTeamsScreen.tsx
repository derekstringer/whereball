/**
 * My Teams Screen - Shows DailyV3 filtered to user's followed teams
 * This is a wrapper around DailyV3 that filters to only show favorited teams' games
 */

import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { useAppStore } from '../../store/appStore';

export const MyTeamsScreen: React.FC = () => {
  const { setExpandedGameId } = useAppStore();
  
  const isFocused = useIsFocused();
  
  // Collapse any expanded cards when LEAVING this screen (on blur)
  React.useEffect(() => {
    if (!isFocused) {
      // When screen loses focus, collapse all cards
      setExpandedGameId('NHL', null);
      setExpandedGameId('NBA', null);
      setExpandedGameId('MLB', null);
      setExpandedGameId('NFL', null);
    }
  }, [isFocused, setExpandedGameId]);
  
  return <DailyV3 viewMode="my-teams" />;
};
