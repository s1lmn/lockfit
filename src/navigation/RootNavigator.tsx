import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useI18n } from '../i18n/I18nProvider';
import { useLockFit } from '../providers/LockFitProvider';
import { AccountScreen } from '../screens/AccountScreen';
import { ActivityHubScreen } from '../screens/ActivityHubScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BatteryOptimizationScreen } from '../screens/BatteryOptimizationScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LockScreen } from '../screens/LockScreen';
import { ManageAppsScreen } from '../screens/ManageAppsScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PermissionsGuideScreen } from '../screens/PermissionsGuideScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  ManageApps: { mode: 'onboarding' | 'manage' };
  Permissions: { mode: 'onboarding' | 'manage' };
  Home: undefined;
  Menu: undefined;
  Account: undefined;
  Settings: undefined;
  Lock: undefined;
  Exercise: undefined;
  ActivityHub: undefined;
  Battery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MenuButton({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();

  return (
    <Pressable onPress={onPress} style={styles.menuButton}>
      <Text style={styles.menuButtonText}>{t('nav.menu')}</Text>
    </Pressable>
  );
}

export function RootNavigator() {
  const { state, refreshAppState } = useLockFit();
  const { theme } = useTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);

  const sharedScreenOptions = {
    headerStyle: { backgroundColor: theme.surface },
    headerTintColor: theme.textPrimary,
    contentStyle: { backgroundColor: theme.background },
    headerShadowVisible: false,
    headerTitleStyle: {
      fontSize: 18,
      fontWeight: '800' as const,
    },
  };

  if (!state.isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (state.initializationError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>LockFit не удалось запуститься</Text>
        <Text style={styles.errorText}>{state.initializationError}</Text>
        <Pressable onPress={() => void refreshAppState()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={sharedScreenOptions}>
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: t('nav.auth'), headerBackVisible: false }}
        />
      </Stack.Navigator>
    );
  }

  if (!state.onboardingCompleted) {
    return (
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={sharedScreenOptions}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ title: t('nav.onboarding'), headerBackVisible: false }}
        />
        <Stack.Screen
          name="ManageApps"
          component={ManageAppsScreen}
          options={{ title: t('nav.apps') }}
        />
        <Stack.Screen
          name="Permissions"
          component={PermissionsGuideScreen}
          options={{ title: t('nav.permissions') }}
        />
        <Stack.Screen
          name="Battery"
          component={BatteryOptimizationScreen}
          options={{ title: t('nav.battery') }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={sharedScreenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: t('nav.home'),
          headerLeft: () => null,
          headerRight: () => <MenuButton onPress={() => navigation.navigate('Menu')} />,
        })}
      />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: t('nav.menu') }} />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: t('nav.account') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('nav.settings') }}
      />
      <Stack.Screen
        name="ManageApps"
        component={ManageAppsScreen}
        options={{ title: t('nav.apps') }}
      />
      <Stack.Screen
        name="Permissions"
        component={PermissionsGuideScreen}
        options={{ title: t('nav.permissions') }}
      />
      <Stack.Screen
        name="Lock"
        component={LockScreen}
        options={{ title: t('nav.lock') }}
      />
      <Stack.Screen
        name="ActivityHub"
        component={ActivityHubScreen}
        options={{ title: t('nav.activity') }}
      />
      <Stack.Screen
        name="Exercise"
        component={ExerciseScreen}
        options={{ title: t('nav.exercise') }}
      />
      <Stack.Screen
        name="Battery"
        component={BatteryOptimizationScreen}
        options={{ title: t('nav.battery') }}
      />
    </Stack.Navigator>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    errorScreen: {
      flex: 1,
      justifyContent: 'center',
      padding: 28,
      gap: 14,
      backgroundColor: theme.background,
    },
    errorTitle: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '900',
    },
    errorText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    retryButton: {
      alignSelf: 'flex-start',
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 13,
      backgroundColor: theme.accent,
    },
    retryButtonText: {
      color: theme.accentContrast,
      fontWeight: '900',
    },
    menuButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
    },
    menuButtonText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
  });
