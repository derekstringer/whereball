/**
 * Design Tokens - Dark Mode First Design System
 * Version 1.2 - Electric Cyan Theme
 */

export type ColorMode = 'light' | 'dark' | 'system';

// Dark Mode Colors (Default)
export const darkColors = {
  // Backgrounds
  bg: '#0B0D12',
  bgGradientStart: '#0B0D12',
  bgGradientEnd: '#0E1220',
  surface: '#11151C',
  card: '#131821',
  
  // Text
  text: '#E6EAF2',
  textSecondary: '#8A93A6',
  
  // Brand
  primary: '#00E5FF',      // Electric cyan
  accent: '#22D1EE',       // Lighter cyan
  
  // Semantic
  success: '#2AD678',
  warning: '#F6C445',
  danger: '#FF4D67',
  
  // Utility
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Light Mode Colors
export const lightColors = {
  // Backgrounds
  bg: '#FFFFFF',
  bgGradientStart: '#FFFFFF',
  bgGradientEnd: '#F8F9FA',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  
  // Text
  text: '#000000',
  textSecondary: '#666666',
  
  // Brand (same as dark)
  primary: '#00E5FF',
  accent: '#22D1EE',
  
  // Semantic
  success: '#2AD678',
  warning: '#F6C445',
  danger: '#FF4D67',
  
  // Utility
  border: 'rgba(0, 0, 0, 0.06)',
  borderStrong: 'rgba(0, 0, 0, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Typography Scale
export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};

// Spacing (8pt grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

// Shadows (Dark mode)
export const shadowsDark = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Shadows (Light mode)
export const shadowsLight = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Animation timings
export const animation = {
  fast: 150,
  normal: 200,
  slow: 300,
};

// Export combined tokens
export const tokens = {
  darkColors,
  lightColors,
  typography,
  spacing,
  radii,
  shadowsDark,
  shadowsLight,
  animation,
};

export default tokens;
