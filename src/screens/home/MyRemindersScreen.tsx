/**
 * My Reminders Screen - Shows DailyV3 filtered to games with reminders
 * This is a wrapper around DailyV3 that filters to only show games with active reminders
 */

import React from 'react';
import { DailyV3 } from './DailyV3';

export const MyRemindersScreen: React.FC = () => {
  // For now, just show DailyV3
  // TODO: In Phase 5, we'll add filtering logic to show only games with reminders
  return <DailyV3 />;
};
