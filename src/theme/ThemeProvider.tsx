import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import type { ThemeName } from '../types/lockfit';
import { getTheme } from './palette';

type ThemeContextValue = {
  themeName: ThemeName;
  theme: ReturnType<typeof getTheme>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  themeName,
}: PropsWithChildren<{ themeName: ThemeName }>) {
  const value = useMemo(
    () => ({
      themeName,
      theme: getTheme(themeName),
    }),
    [themeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}

export function useThemedStyles<T>(factory: (theme: ThemeContextValue['theme']) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
