import { Platform } from 'react-native';

export const darkColors = {
  bg: '#0e0e10',
  bgGrad: '#121214',
  card: 'rgba(28, 28, 30, 0.65)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  tabBar: 'rgba(18, 18, 20, 0.88)',
  tabBarBorder: 'rgba(255, 255, 255, 0.04)',
  text: '#f5f5f7',
  textSecondary: 'rgba(235, 235, 245, 0.60)',
  textTertiary: 'rgba(235, 235, 245, 0.30)',
  accent: '#0a84ff',
  accentDim: 'rgba(10, 132, 255, 0.12)',
  accentSoft: 'rgba(10, 132, 255, 0.20)',
  dot: 'rgba(255, 255, 255, 0.08)',
  dotActive: 'rgba(255, 255, 255, 0.45)',
  dotBright: 'rgba(255, 255, 255, 0.8)',
  success: '#30d158',
  successDim: 'rgba(48, 209, 88, 0.12)',
  error: '#ff453a',
  protein: '#64d2ff',
  carbs: '#ffd60a',
  fat: '#ff6961',
  border: 'rgba(255, 255, 255, 0.06)',
  inputBg: 'rgba(118, 118, 128, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  separator: 'rgba(84, 84, 88, 0.36)',
};

export const lightColors: typeof darkColors = {
  bg: '#f2f2f7',
  bgGrad: '#e5e5ea',
  card: 'rgba(255, 255, 255, 0.80)',
  cardBorder: 'rgba(0, 0, 0, 0.04)',
  tabBar: 'rgba(249, 249, 249, 0.88)',
  tabBarBorder: 'rgba(0, 0, 0, 0.04)',
  text: '#1c1c1e',
  textSecondary: 'rgba(60, 60, 67, 0.60)',
  textTertiary: 'rgba(60, 60, 67, 0.30)',
  accent: '#007aff',
  accentDim: 'rgba(0, 122, 255, 0.08)',
  accentSoft: 'rgba(0, 122, 255, 0.15)',
  dot: 'rgba(0, 0, 0, 0.06)',
  dotActive: 'rgba(0, 0, 0, 0.3)',
  dotBright: 'rgba(0, 0, 0, 0.6)',
  success: '#34c759',
  successDim: 'rgba(52, 199, 89, 0.10)',
  error: '#ff3b30',
  protein: '#007aff',
  carbs: '#ff9500',
  fat: '#ff3b30',
  border: 'rgba(60, 60, 67, 0.06)',
  inputBg: 'rgba(118, 118, 128, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  separator: 'rgba(60, 60, 67, 0.12)',
};

export type ThemeColors = typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  card: 16,
  full: 9999,
};

const systemFont = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  default: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
});

export const fonts = systemFont!;
