import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { useI18n } from '../i18n/I18nProvider';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';
import { formatDateTimeLabel } from '../utils/date';
import { formatMinutes } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { state, refreshUsageFromDevice } = useLockFit();
  const styles = useThemedStyles(createStyles);
  const { formatNumber, t } = useI18n();
  const nickname = state.account?.nickname ?? 'друг';
  const permissionsReady = [
    state.permissionStatus.usageAccessGranted,
    state.permissionStatus.accessibilityGranted,
  ].filter(Boolean).length;
  const limitReachedCount = state.appUsageSummaries.filter((app) => app.isLimitReached).length;

  const handleRefreshUsage = async () => {
    try {
      await refreshUsageFromDevice();
    } catch (error) {
      Alert.alert(
        'Не удалось обновить статистику',
        error instanceof Error ? error.message : 'Попробуй ещё раз.',
      );
    }
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.kicker}>{t('home.todayFor', { nickname })}</Text>
        <Text style={styles.remaining}>{formatMinutes(state.remainingMinutes)}</Text>
        <Text style={styles.supportText}>
          {t('home.baseLimit', {
            limit: `${formatNumber(state.totalLimitMinutes)} ${t('common.minutesShort')}`,
            bonus: `${formatNumber(state.bonusMinutesToday)} ${t('common.minutesShort')}`,
          })}
        </Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatLight}>
            <Text style={styles.heroStatValue}>{state.appUsageSummaries.length}</Text>
            <Text style={styles.heroStatLabel}>{t('home.appsControlled')}</Text>
          </View>
          <View style={styles.heroStatDark}>
            <Text style={styles.heroStatValueDark}>{limitReachedCount}</Text>
            <Text style={styles.heroStatLabelDark}>{t('home.limitReached')}</Text>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterText}>
            {state.remainingMinutes > 0
              ? 'Темп под контролем. Можно спокойно продолжать день.'
              : 'Лимит на сегодня закончился. Пора вернуть время через движение.'}
          </Text>
        </View>
      </Card>

      <Card delay={120}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Система и разрешения</Text>
          <MotionPressable
            onPress={() => navigation.navigate('Permissions', { mode: 'manage' })}
            style={styles.smallGhostButton}
          >
            <Text style={styles.smallGhostButtonText}>Проверить</Text>
          </MotionPressable>
        </View>
        <Text style={styles.secondaryText}>
          Сейчас готово {permissionsReady}/2 системных разрешений. Для автоматической блокировки
          нужны оба: одно считает время, второе замечает открытие выбранного приложения.
        </Text>
        <View style={styles.permissionChips}>
          <View style={styles.permissionChip}>
            <Text style={styles.permissionChipText}>
              Usage {state.permissionStatus.usageAccessGranted ? 'готово' : 'не выдано'}
            </Text>
          </View>
          <View style={styles.permissionChip}>
            <Text style={styles.permissionChipText}>
              Accessibility {state.permissionStatus.accessibilityGranted ? 'готово' : 'не выдано'}
            </Text>
          </View>
        </View>
      </Card>

      <Card delay={200}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Приложения и лимиты</Text>
          <MotionPressable
            onPress={() => navigation.navigate('ManageApps', { mode: 'manage' })}
            style={styles.smallGhostButton}
          >
            <Text style={styles.smallGhostButtonText}>Изменить</Text>
          </MotionPressable>
        </View>

        {state.appUsageSummaries.length === 0 ? (
          <Text style={styles.secondaryText}>
            Пока ничего не выбрано. Добавь приложения в меню управления.
          </Text>
        ) : (
          state.appUsageSummaries.map((app) => {
            const progress = Math.min(
              100,
              Math.round((app.usedMinutes / Math.max(1, app.dailyLimitMinutes)) * 100),
            );

            return (
              <View key={app.packageName} style={styles.appCard}>
                <View style={styles.usageRow}>
                  <View style={styles.appCopy}>
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.packageName}>{app.packageName}</Text>
                  </View>
                  <Text
                    style={[
                      styles.usageMinutes,
                      app.isLimitReached && styles.usageMinutesDanger,
                    ]}
                  >
                    {formatMinutes(app.usedMinutes)}
                  </Text>
                </View>

                <AnimatedProgressBar danger={app.isLimitReached} progress={progress} />

                <View style={styles.appMetaRow}>
                  <Text style={styles.appMeta}>
                    Лимит {formatMinutes(app.dailyLimitMinutes)}
                  </Text>
                  <Text style={styles.appMeta}>
                    Осталось {formatMinutes(app.remainingMinutes)}
                  </Text>
                </View>

                {app.isLimitReached ? (
                  <MotionPressable
                    onPress={() => navigation.navigate('Lock')}
                    style={styles.limitReachedButton}
                  >
                    <Text style={styles.limitReachedButtonText}>
                      Открыть экран блокировки
                    </Text>
                  </MotionPressable>
                ) : null}
              </View>
            );
          })
        )}
      </Card>

      <Card delay={280}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <View style={styles.buttonsRow}>
          <MotionPressable
            onPress={() => void handleRefreshUsage()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Обновить usage</Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => navigation.navigate('ActivityHub')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Получить время движением</Text>
          </MotionPressable>
        </View>
        <View style={styles.buttonsRow}>
          <MotionPressable
            onPress={() => navigation.navigate('Battery')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Battery tips</Text>
          </MotionPressable>
        </View>
      </Card>

      <Card delay={320} style={styles.weekCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('home.week')}</Text>
            <Text style={styles.secondaryText}>{t('home.activeOutOf7', { count: state.weeklyActivity.activeDays })}</Text>
          </View>
          <Text style={styles.weekBonus}>+{state.weeklyActivity.totalBonusMinutes} мин</Text>
        </View>
        <View style={styles.weekSummaryRow}>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>{formatNumber(state.weeklyActivity.totalSteps)}</Text>
            <Text style={styles.weekSummaryLabel}>{t('activity.stepsUnit')}</Text>
          </View>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>{state.weeklyActivity.totalRepetitions}</Text>
            <Text style={styles.weekSummaryLabel}>{t('activity.repsUnit')}</Text>
          </View>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>{state.weeklyActivity.totalWorkouts}</Text>
            <Text style={styles.weekSummaryLabel}>{t('activity.workoutsUnit')}</Text>
          </View>
        </View>
        <MotionPressable onPress={() => navigation.navigate('ActivityHub')} style={styles.weekButton}>
          <Text style={styles.weekButtonText}>{t('home.openActivity')}</Text>
        </MotionPressable>
      </Card>

      <Card delay={360}>
        <Text style={styles.sectionTitle}>Последние тренировки</Text>
        {state.workoutLog.length === 0 ? (
          <Text style={styles.secondaryText}>
            Пока нет ни одной сессии разблокировки.
          </Text>
        ) : (
          state.workoutLog.map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <View>
                <Text style={styles.logTitle}>
                  {entry.exerciseType === 'pushups' ? 'Отжимания' : 'Приседания'} •{' '}
                  {entry.repetitions} повторов
                </Text>
                <Text style={styles.packageName}>
                  {formatDateTimeLabel(entry.completedAt)}
                </Text>
              </View>
              <Text style={styles.logBonus}>+{entry.bonusMinutes} мин</Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: theme.surfaceStrong,
      borderColor: theme.surfaceStrong,
      gap: 14,
    },
    kicker: {
      color: theme.accentContrast,
      fontSize: 14,
      fontWeight: '700',
      opacity: 0.76,
    },
    remaining: {
      color: theme.accentContrast,
      fontSize: 46,
      fontWeight: '900',
      letterSpacing: -1,
      fontFamily: 'serif',
    },
    supportText: {
      color: theme.accentContrast,
      fontSize: 14,
      lineHeight: 21,
    },
    heroStatsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroStatLight: {
      flex: 1,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.surface,
    },
    heroStatDark: {
      flex: 1,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.accentMuted,
    },
    heroStatValue: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '900',
    },
    heroStatLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    heroStatValueDark: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '900',
    },
    heroStatLabelDark: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    heroFooter: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: theme.surface,
    },
    heroFooterText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    weekCard: {
      backgroundColor: theme.accentMuted,
    },
    weekBonus: {
      color: theme.accent,
      fontSize: 18,
      fontWeight: '900',
    },
    weekSummaryRow: {
      flexDirection: 'row',
      gap: 8,
    },
    weekSummaryItem: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      gap: 3,
    },
    weekSummaryValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    weekSummaryLabel: {
      color: theme.textMuted,
      fontSize: 11,
    },
    weekButton: {
      alignItems: 'center',
      borderRadius: 16,
      paddingVertical: 13,
      backgroundColor: theme.surfaceStrong,
    },
    weekButtonText: {
      color: theme.accentContrast,
      fontSize: 13,
      fontWeight: '900',
    },
    secondaryText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    smallGhostButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      backgroundColor: theme.surfaceMuted,
    },
    smallGhostButtonText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    permissionChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    permissionChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceMuted,
    },
    permissionChipText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    appCard: {
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 14,
    },
    usageRow: {
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
      fontSize: 16,
      fontWeight: '800',
    },
    packageName: {
      color: theme.textMuted,
      fontSize: 12,
    },
    usageMinutes: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: '900',
    },
    usageMinutesDanger: {
      color: theme.danger,
    },
    appMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    appMeta: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    limitReachedButton: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
      backgroundColor: theme.surfaceStrong,
      alignItems: 'center',
    },
    limitReachedButtonText: {
      color: theme.accentContrast,
      fontWeight: '800',
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 15,
      paddingHorizontal: 12,
      backgroundColor: theme.surfaceMuted,
      borderRadius: 18,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'center',
    },
    logRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 14,
    },
    logTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    logBonus: {
      color: theme.accent,
      fontWeight: '900',
    },
  });
