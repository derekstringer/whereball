/**
 * useTheme Hook
 * Provides the current theme colors based on colorMode setting
 */

import { Appearance } from 'react-native';
import { useAppStore } from '../store/appStore';
import { darkColors, lightColors } from '../styles/tokens';
import { useEffect } from 'react';

export const useTheme = () => {
  const { colorMode, systemThemeUpdateTrigger, triggerSystemThemeUpdate } = useAppStore();
  
  // Listen for system theme changes and trigger store update
  useEffect(() => {
    if (colorMode === 'system') {
      const subscription = Appearance.addChangeListener(() => {
        triggerSystemThemeUpdate();
      });
      return () => subscription.remove();
    }
  }, [colorMode, triggerSystemThemeUpdate]);
  
  // Determine effective mode - always get fresh value from Appearance when system mode
  const effectiveMode: 'light' | 'dark' = 
    colorMode === 'system' 
      ? (Appearance.getColorScheme() || 'dark')
      : colorMode;
  
  // Return appropriate colors
  const colors = effectiveMode === 'dark' ? darkColors : lightColors;
  
  return {
    colors,
    mode: effectiveMode,
    isDark: effectiveMode === 'dark',
  };
};
