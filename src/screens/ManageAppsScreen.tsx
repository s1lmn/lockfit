import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageApps'>;
type DraftLimitMap = Record<string, string>;

export function ManageAppsScreen({ navigation, route }: Props) {
  const { state, saveBlockedApps } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [limitsByPackage, setLimitsByPackage] = useState<DraftLimitMap>({});

  useEffect(() => {
    setSelectedPackages(state.blockedApps.map((app) => app.packageName));
    setLimitsByPackage(
      state.blockedApps.reduce<DraftLimitMap>((acc, app) => {
        acc[app.packageName] = String(app.dailyLimitMinutes);
        return acc;
      }, {}),
    );
  }, [state.blockedApps]);

  const installedApps = useMemo(
    () => {
      const appsByPackage = new Map(
        [...state.installedApps, ...state.blockedApps].map((app) => [
          app.packageName,
          { packageName: app.packageName, appName: app.appName },
        ]),
      );

      return [...appsByPackage.values()].sort((left, right) =>
        left.appName.localeCompare(right.appName),
      );
    },
    [state.blockedApps, state.installedApps],
  );

  const toggleApp = (packageName: string) => {
    setSelectedPackages((current) => {
      if (current.includes(packageName)) {
        return current.filter((item) => item !== packageName);
      }

      return [...current, packageName];
    });

    setLimitsByPackage((current) => ({
      ...current,
      [packageName]: current[packageName] ?? '30',
    }));
  };

  const handleSave = async () => {
    try {
      const selectedApps = installedApps
        .filter((app) => selectedPackages.includes(app.packageName))
        .map((app) => ({
          ...app,
          dailyLimitMinutes: Math.max(
            5,
            Number.parseInt(limitsByPackage[app.packageName] ?? '30', 10) || 30,
          ),
        }));

      if (route.params.mode === 'onboarding' && selectedApps.length === 0) {
        Alert.alert(
          'Нужно выбрать приложения',
          'Добавь хотя бы одно приложение для первого запуска.',
        );
        return;
      }

      await saveBlockedApps(selectedApps);
      Alert.alert('Сохранено', 'Список приложений и лимиты обновлены.');
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Не получилось сохранить',
        error instanceof Error ? error.message : 'Попробуй еще раз.',
      );
    }
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Контроль приложений</Text>
        <Text style={styles.title}>Для каждого приложения свой лимит и свое место в режиме.</Text>
        <Text style={styles.description}>
          Нажми на приложение, чтобы добавить его в блокировку. Для каждого выбранного приложения
          можно отдельно задать дневной лимит.
        </Text>
      </Card>

      {installedApps.map((app) => {
        const selected = selectedPackages.includes(app.packageName);

        return (
          <Card
            delay={110 + (installedApps.indexOf(app) % 8) * 35}
            key={app.packageName}
            style={[styles.appCard, selected && styles.appCardSelected]}
          >
            <MotionPressable
              onPress={() => toggleApp(app.packageName)}
              style={styles.appHeader}
              pressScale={0.99}
            >
              <View style={styles.appCopy}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={styles.packageName}>{app.packageName}</Text>
              </View>
              <View
                style={[
                  styles.stateBadge,
                  selected ? styles.stateBadgeActive : styles.stateBadgeIdle,
                ]}
              >
                <Text
                  style={[
                    styles.stateBadgeText,
                    selected && styles.stateBadgeTextActive,
                  ]}
                >
                  {selected ? 'В блоке' : 'Не выбрано'}
                </Text>
              </View>
            </MotionPressable>

            {selected ? (
              <View style={styles.limitRow}>
                <View style={styles.limitCopy}>
                  <Text style={styles.limitLabel}>Лимит в день</Text>
                  <Text style={styles.limitHint}>
                    Начни с 30 минут, а дальше уже подкрутим по реальному использованию.
                  </Text>
                </View>
                <TextInput
                  keyboardType="number-pad"
                  value={limitsByPackage[app.packageName] ?? '30'}
                  onChangeText={(value) =>
                    setLimitsByPackage((current) => ({
                      ...current,
                      [app.packageName]: value.replace(/[^0-9]/g, ''),
                    }))
                  }
                  style={styles.limitInput}
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            ) : null}
          </Card>
        );
      })}

      <MotionPressable onPress={() => void handleSave()} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Сохранить изменения</Text>
      </MotionPressable>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 12,
    },
    heroEyebrow: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    appCard: {
      gap: 14,
    },
    appCardSelected: {
      backgroundColor: theme.accentMuted,
      borderColor: theme.accent,
    },
    appHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    appCopy: {
      flex: 1,
    },
    appName: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    packageName: {
      color: theme.textMuted,
      fontSize: 12,
    },
    stateBadge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    stateBadgeActive: {
      backgroundColor: theme.textPrimary,
    },
    stateBadgeIdle: {
      backgroundColor: theme.surfaceMuted,
    },
    stateBadgeText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    stateBadgeTextActive: {
      color: theme.surface,
    },
    limitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    limitCopy: {
      flex: 1,
      gap: 4,
    },
    limitLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    limitHint: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    limitInput: {
      width: 92,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      backgroundColor: theme.surface,
    },
    primaryButton: {
      backgroundColor: theme.textPrimary,
      borderRadius: 22,
      paddingVertical: 17,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 16,
      fontWeight: '900',
    },
  });
