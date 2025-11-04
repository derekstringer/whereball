/**
 * My Teams Screen - Shows DailyV3 filtered to user's followed teams
 * This is a wrapper around DailyV3 that filters to only show favorited teams' games
 */

import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { DailyV3 } from './DailyV3';
import { useAppStore } from '../../store/appStore';

export const MyTeamsScreen: React.FC = () => {
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
  
  return <DailyV3 viewMode="my-teams" />;
};
