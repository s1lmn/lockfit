import type { ThemeName } from '../types/lockfit';

export type AppTheme = {
  name: ThemeName;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
  background: string;
  backgroundCanvas: string;
  backgroundAccent: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  border: string;
  accent: string;
  accentMuted: string;
  accentContrast: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  shadow: string;
  overlayGlow: string;
};

export const themes: Record<ThemeName, AppTheme> = {
  sand: {
    name: 'sand',
    isDark: false,
    statusBarStyle: 'dark',
    background: '#F7F5F0',
    backgroundCanvas: '#E2EBDD',
    backgroundAccent: '#F2DDD3',
    surface: '#FFFCF8',
    surfaceMuted: '#ECEAE4',
    surfaceStrong: '#4E6A59',
    border: '#DDDCD4',
    accent: '#55735F',
    accentMuted: '#DFECE2',
    accentContrast: '#FFFCF8',
    warning: '#A9663E',
    danger: '#A95353',
    textPrimary: '#29332D',
    textSecondary: '#59665F',
    textMuted: '#858D87',
    shadow: 'rgba(57, 65, 59, 0.07)',
    overlayGlow: 'rgba(85, 115, 95, 0.08)',
  },
  midnight: {
    name: 'midnight',
    isDark: true,
    statusBarStyle: 'light',
    background: '#202626',
    backgroundCanvas: '#303B38',
    backgroundAccent: '#493934',
    surface: '#293130',
    surfaceMuted: '#343E3C',
    surfaceStrong: '#E2A18B',
    border: '#414B48',
    accent: '#E2A18B',
    accentMuted: '#483833',
    accentContrast: '#271F1D',
    warning: '#E5C07B',
    danger: '#E99494',
    textPrimary: '#F2EEE8',
    textSecondary: '#C1C9C4',
    textMuted: '#909C96',
    shadow: 'rgba(7, 11, 10, 0.22)',
    overlayGlow: 'rgba(226, 161, 139, 0.1)',
  },
};

export const palette = themes.sand;

export function getTheme(themeName: ThemeName): AppTheme {
  return themes[themeName] ?? themes.sand;
}
