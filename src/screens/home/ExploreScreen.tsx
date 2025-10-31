/**
 * Explore Screen - Shows DailyV3 filtered to selected teams/sports
 * Phase 6 will add search interface
 */

import React from 'react';
import { DailyV3 } from './DailyV3';

export const ExploreScreen: React.FC = () => {
  return <DailyV3 viewMode="explore" />;
};
