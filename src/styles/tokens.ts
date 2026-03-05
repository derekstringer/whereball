export type ColorMode = 'light' | 'dark' | 'system';

// Modern dark palette — inspired by Lemonade's clean aesthetic
export const darkColors = {
  bg: '#08080C',
  surface: '#111118',
  card: '#181824',
  cardHover: '#222236',
  text: '#F5F5FA',
  textSecondary: '#9898B0',
  textMuted: '#5E5E78',
  primary: '#8B5CF6',       // Vibrant purple
  primaryLight: '#A78BFA',
  primaryDim: 'rgba(139, 92, 246, 0.15)',
  accent: '#F472B6',        // Warm pink — hearts / favorites
  accentDim: 'rgba(244, 114, 182, 0.15)',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FB7185',
  border: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.04)',
  overlay: 'rgba(0,0,0,0.7)',
  filterSheetBg: '#111118',
  // Species badges
  dogBadge: '#FB923C',
  catBadge: '#8B5CF6',
  rabbitBadge: '#34D399',
  birdBadge: '#38BDF8',
  otherBadge: '#A78BFA',
};

export const lightColors = {
  bg: '#FAFAFE',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F5F3FF',
  text: '#0F0F1A',
  textSecondary: '#64648C',
  textMuted: '#9898B0',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDim: 'rgba(124, 58, 237, 0.08)',
  accent: '#EC4899',
  accentDim: 'rgba(236, 72, 153, 0.08)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  border: 'rgba(0,0,0,0.06)',
  divider: 'rgba(0,0,0,0.04)',
  overlay: 'rgba(0,0,0,0.4)',
  filterSheetBg: '#FFFFFF',
  dogBadge: '#FB923C',
  catBadge: '#7C3AED',
  rabbitBadge: '#10B981',
  birdBadge: '#0EA5E9',
  otherBadge: '#8B5CF6',
};

export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionBold: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 11, lineHeight: 16, fontWeight: '400' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  card: 20,
  pill: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
