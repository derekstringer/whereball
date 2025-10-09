/**
 * useTheme Hook
 * Provides the current theme colors based on colorMode setting
 */

import { useColorScheme, Appearance } from 'react-native';
import { useAppStore } from '../store/appStore';
import { darkColors, lightColors, type ColorMode } from '../styles/tokens';
import { useEffect, useState } from 'react';

export const useTheme = () => {
  const { colorMode } = useAppStore();
  const systemColorScheme = useColorScheme();
  const [, forceUpdate] = useState({});
  
  // Force re-render when system theme changes
  useEffect(() => {
    if (colorMode === 'system') {
      const subscription = Appearance.addChangeListener(() => {
        forceUpdate({});
      });
      return () => subscription.remove();
    }
  }, [colorMode]);
  
  // Determine effective mode
  const effectiveMode: 'light' | 'dark' = 
    colorMode === 'system' 
      ? (systemColorScheme || 'dark')
      : colorMode;
  
  // Return appropriate colors
  const colors = effectiveMode === 'dark' ? darkColors : lightColors;
  
  return {
    colors,
    mode: effectiveMode,
    isDark: effectiveMode === 'dark',
  };
};
