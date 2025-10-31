/**
 * My Profile Screen - Wrapper for SettingsScreen
 * Shows settings/profile as a full screen in bottom tabs
 */

import React from 'react';
import { SettingsScreen } from '../settings/SettingsScreen';

export const MyProfileScreen: React.FC = () => {
  // SettingsScreen doesn't need onClose in tab context
  // isBottomSheet is false by default
  return <SettingsScreen onClose={() => {}} />;
};
