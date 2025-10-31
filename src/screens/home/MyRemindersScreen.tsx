/**
 * My Reminders Screen - Shows DailyV3 filtered to games with reminders
 */

import React from 'react';
import { DailyV3 } from './DailyV3';

export const MyRemindersScreen: React.FC = () => {
  return <DailyV3 viewMode="reminders" />;
};
