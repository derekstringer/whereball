/**
 * My Teams Screen - Shows DailyV3 filtered to user's followed teams
 * This is a wrapper around DailyV3 that filters to only show favorited teams' games
 */

import React from 'react';
import { DailyV3 } from './DailyV3';

export const MyTeamsScreen: React.FC = () => {
  // For now, just show DailyV3
  // TODO: In Phase 5, we'll add filtering logic to show only followed teams' games
  return <DailyV3 />;
};
