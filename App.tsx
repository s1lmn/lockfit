import 'react-native-gesture-handler';

import { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { I18nProvider } from './src/i18n/I18nProvider';
import { LockFitProvider, useLockFit } from './src/providers/LockFitProvider';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { getTheme } from './src/theme/palette';

function AppShell() {
  const { state } = useLockFit();
  const themeName = state.themePreference;

const navigationTheme = useMemo(() => {
    const theme = getTheme(state.themePreference);
    return {
      ...DefaultTheme,
      dark: theme.isDark,
      colors: {
        ...DefaultTheme.colors,
        background: theme.background,
        card: theme.surface,
        border: theme.border,
        text: theme.textPrimary,
        primary: theme.accent,
        notification: theme.danger,
      },
    };
  }, [state.themePreference]);

  const linking = useMemo(
    () => ({
      prefixes: ['lockfit://'],
      config: {
        screens: {
          Exercise: 'exercise',
        },
      },
    }),
    [],
  );

  return (
    <I18nProvider preference={state.languagePreference}>
      <ThemeProvider themeName={themeName}>
        <NavigationContainer theme={navigationTheme} linking={linking}>
          <StatusBar style={themeName === 'midnight' ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LockFitProvider>
        <AppShell />
      </LockFitProvider>
    </SafeAreaProvider>
  );
}
