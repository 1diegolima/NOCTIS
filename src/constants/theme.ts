/**
 * NOCTIS Design System
 * Aesthetic: Gothic / Batcave Dark Minimalist (Deep Blacks, Gunmetal, Blood Red Accent)
 * Tone: Direct, clean, elegant, focused.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    // Backgrounds
    background: '#09090B',
    backgroundElevated: '#121215',
    card: '#18181B',
    cardElevated: '#222226',
    cardBorder: '#27272A',
    cardBorderHighlight: '#3F3F46',

    // Text & Content
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',

    // Accent - Blood Red / Crimson
    primary: '#DC2626',
    primaryHover: '#EF4444',
    primaryMuted: '#7F1D1D',
    primaryDark: '#450A0A',
    primaryGlow: 'rgba(220, 38, 38, 0.12)',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#DC2626',

    // Tab Bar / Navigation
    tabBarBackground: '#09090B',
    tabBarBorder: '#27272A',
    tabBarActive: '#DC2626',
    tabBarInactive: '#71717A',
  },
  light: {
    background: '#09090B',
    backgroundElevated: '#121215',
    card: '#18181B',
    cardElevated: '#222226',
    cardBorder: '#27272A',
    cardBorderHighlight: '#3F3F46',

    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',

    primary: '#DC2626',
    primaryHover: '#EF4444',
    primaryMuted: '#7F1D1D',
    primaryDark: '#450A0A',
    primaryGlow: 'rgba(220, 38, 38, 0.12)',

    success: '#10B981',
    warning: '#F59E0B',
    danger: '#DC2626',

    tabBarBackground: '#09090B',
    tabBarBorder: '#27272A',
    tabBarActive: '#DC2626',
    tabBarInactive: '#71717A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
