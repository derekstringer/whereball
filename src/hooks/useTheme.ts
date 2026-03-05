import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useAppStore } from '../store/appStore';
import { darkColors, lightColors } from '../styles/tokens';

export const useTheme = () => {
  const colorMode = useAppStore((s) => s.colorMode);

  useEffect(() => {
    if (colorMode !== 'system') return;
    const sub = Appearance.addChangeListener(() => {});
    return () => sub.remove();
  }, [colorMode]);

  const effectiveMode: 'light' | 'dark' =
    colorMode === 'system'
      ? (Appearance.getColorScheme() ?? 'dark')
      : colorMode;

  return {
    colors: effectiveMode === 'dark' ? darkColors : lightColors,
    mode: effectiveMode,
    isDark: effectiveMode === 'dark',
  };
};
