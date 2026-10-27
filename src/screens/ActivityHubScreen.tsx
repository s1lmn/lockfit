import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { getClaimableRewardCount } from '../features/activity/stepRewards';
import { useI18n } from '../i18n/I18nProvider';
import type { NativeStepCounterSnapshot } from '../native/lockFitNative';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityHub'>;

export function ActivityHubScreen({ navigation }: Props) {
  const {
    state,
    claimStepBonus,
    requestStepPermission,
    syncStepsFromDevice,
  } = useLockFit();
  const styles = useThemedStyles(createStyles);
  const { formatNumber, locale, t } = useI18n();
  const [sensor, setSensor] = useState<NativeStepCounterSnapshot | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const syncingRef = useRef(false);

  const syncSteps = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      setSensor(await syncStepsFromDevice());
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [syncStepsFromDevice]);

  useFocusEffect(
    useCallback(() => {
      void syncSteps();
    }, [syncSteps]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncSteps();
      }
    });
    return () => subscription.remove();
  }, [syncSteps]);

  const handlePermission = async () => {
    const granted = await requestStepPermission();
    if (!granted) {
      Alert.alert(
        'Доступ не выдан',
        'Без разрешения «Физическая активность» Android не передаёт LockFit данные шагомера.',
      );
      return;
    }
    await syncSteps();
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      await syncSteps();
      await claimStepBonus();
      Alert.alert(
        'Время начислено',
        `${state.stepsPerReward} шагов обменены на +${state.stepBonusMinutes} минут.`,
      );
    } catch (error) {
      Alert.alert(
        'Пока не получилось',
        error instanceof Error ? error.message : 'Обнови шаги и попробуй ещё раз.',
      );
    } finally {
      setClaiming(false);
    }
  };

  const claimableRewards = getClaimableRewardCount(
    state.availableRewardSteps,
    state.stepsPerReward,
  );
  const stepProgress = Math.min(
    100,
    Math.round((state.availableRewardSteps / Math.max(1, state.stepsPerReward)) * 100),
  );
  const maxDayActivity = Math.max(
    1,
    ...state.weeklyActivity.days.map((day) => day.steps + day.repetitions * 40),
  );

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>{t('activity.eyebrow')}</Text>
        <Text style={styles.heroTitle}>{t('activity.title')}</Text>
        <Text style={styles.secondaryText}>{t('activity.description')}</Text>
      </Card>

      <View style={styles.activityGrid}>
        <Card delay={100} style={styles.activityCard}>
          <Text style={styles.activityMark}>01</Text>
          <Text style={styles.activityTitle}>{t('activity.exercise')}</Text>
          <Text style={styles.secondaryText}>{t('activity.exerciseDescription')}</Text>
          <Text style={styles.rewardText}>+{state.unlockBonusMinutes} {t('common.minutesShort')}</Text>
          <MotionPressable
            onPress={() => navigation.navigate('Exercise')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{t('activity.openCamera')}</Text>
          </MotionPressable>
        </Card>

        <Card delay={160} style={[styles.activityCard, styles.stepCard]}>
          <Text style={styles.activityMark}>02</Text>
          <Text style={styles.activityTitle}>{t('activity.steps')}</Text>
          <Text style={styles.secondaryText}>
            {t('activity.stepRule', { steps: formatNumber(state.stepsPerReward), minutes: state.stepBonusMinutes })}
          </Text>
          <Text style={styles.rewardText}>{formatNumber(state.todaySteps.steps)}</Text>
          <Text style={styles.smallLabel}>{t('activity.stepsToday')}</Text>
        </Card>
      </View>

      <Card delay={220} style={styles.progressCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.sectionTitle}>{t('activity.nextReward')}</Text>
            <Text style={styles.secondaryText}>
              {t('activity.progress', { current: formatNumber(state.availableRewardSteps), target: formatNumber(state.stepsPerReward) })}
            </Text>
          </View>
          <Text style={styles.percent}>{stepProgress}%</Text>
        </View>
        <AnimatedProgressBar progress={stepProgress} />

        {sensor && !sensor.supported ? (
          <Text style={styles.warningText}>
            {t('activity.unsupported')}
          </Text>
        ) : sensor && !sensor.permissionGranted ? (
          <MotionPressable onPress={() => void handlePermission()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{t('activity.permission')}</Text>
          </MotionPressable>
        ) : (
          <View style={styles.actionRow}>
            <MotionPressable onPress={() => void syncSteps()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{syncing ? t('activity.syncing') : t('activity.refresh')}</Text>
            </MotionPressable>
            <MotionPressable
              disabled={claimableRewards < 1 || claiming}
              onPress={() => void handleClaim()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {claimableRewards > 0 ? t('activity.claim', { minutes: state.stepBonusMinutes }) : t('activity.needMore')}
              </Text>
            </MotionPressable>
          </View>
        )}
      </Card>

      <Card delay={300}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.sectionTitle}>{t('activity.last7')}</Text>
            <Text style={styles.secondaryText}>{t('activity.activeDays', { count: state.weeklyActivity.activeDays })}</Text>
          </View>
          <Text style={styles.weekBonus}>+{state.weeklyActivity.totalBonusMinutes} мин</Text>
        </View>
        <View style={styles.chart}>
          {state.weeklyActivity.days.map((day) => {
            const activity = day.steps + day.repetitions * 40;
            const height = Math.max(8, Math.round((activity / maxDayActivity) * 92));
            return (
              <View key={day.dateKey} style={styles.chartColumn}>
                <View style={[styles.chartBar, { height }]} />
                <Text style={styles.chartLabel}>{formatWeekday(day.dateKey, locale)}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.weekStats}>
          <Text style={styles.weekStat}>{formatNumber(state.weeklyActivity.totalSteps)} {t('activity.stepsUnit')}</Text>
          <Text style={styles.weekStat}>{formatNumber(state.weeklyActivity.totalRepetitions)} {t('activity.repsUnit')}</Text>
          <Text style={styles.weekStat}>{formatNumber(state.weeklyActivity.totalWorkouts)} {t('activity.workoutsUnit')}</Text>
        </View>
      </Card>
    </Screen>
  );
}

function formatWeekday(dateKey: string, locale: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' });
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: { gap: 10 },
    eyebrow: { color: theme.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    heroTitle: { color: theme.textPrimary, fontFamily: 'serif', fontSize: 30, fontWeight: '900', lineHeight: 36 },
    secondaryText: { color: theme.textSecondary, fontSize: 14, lineHeight: 21 },
    activityGrid: { flexDirection: 'row', gap: 12 },
    activityCard: { flex: 1, padding: 16, borderRadius: 24 },
    stepCard: { backgroundColor: theme.accentMuted },
    activityMark: { color: theme.textMuted, fontSize: 12, fontWeight: '900' },
    activityTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '900' },
    rewardText: { color: theme.textPrimary, fontSize: 25, fontWeight: '900' },
    smallLabel: { color: theme.textMuted, fontSize: 12 },
    progressCard: { gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    headerCopy: { flex: 1, gap: 3 },
    sectionTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '900' },
    percent: { color: theme.accent, fontSize: 23, fontWeight: '900' },
    warningText: { color: theme.warning, fontSize: 13, lineHeight: 20, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 10 },
    primaryButton: { flex: 1, backgroundColor: theme.accent, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center' },
    primaryButtonText: { color: theme.accentContrast, fontSize: 13, fontWeight: '900', textAlign: 'center' },
    secondaryButton: { flex: 1, backgroundColor: theme.surfaceMuted, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center' },
    secondaryButtonText: { color: theme.textPrimary, fontSize: 13, fontWeight: '800', textAlign: 'center' },
    weekBonus: { color: theme.accent, fontSize: 16, fontWeight: '900' },
    chart: { height: 122, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    chartColumn: { flex: 1, alignItems: 'center', gap: 7 },
    chartBar: { width: '72%', minHeight: 8, borderRadius: 999, backgroundColor: theme.accent },
    chartLabel: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase' },
    weekStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekStat: { color: theme.textSecondary, backgroundColor: theme.surfaceMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, fontWeight: '700' },
  });
