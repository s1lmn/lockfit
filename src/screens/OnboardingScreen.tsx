import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

function StepCard({
  step,
  title,
  description,
  actionLabel,
  status,
  onPress,
}: {
  step: string;
  title: string;
  description: string;
  actionLabel: string;
  status: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
      <Card delay={90} style={styles.stepCard}>
      <View style={styles.stepHead}>
        <Text style={styles.stepLabel}>{step}</Text>
        <Text style={styles.stepStatus}>{status}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      <MotionPressable onPress={onPress} style={styles.inlineButton}>
        <Text style={styles.inlineButtonText}>{actionLabel}</Text>
      </MotionPressable>
    </Card>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const { state, finishOnboarding } = useLockFit();
  const styles = useThemedStyles(createStyles);
  const permissionCount = [
    state.permissionStatus.usageAccessGranted,
    state.permissionStatus.accessibilityGranted,
  ].filter(Boolean).length;
  const readyToFinish = state.blockedApps.length > 0 && permissionCount === 2;

  const handleContinue = async () => {
    await finishOnboarding();
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Первый запуск</Text>
        <Text style={styles.heroTitle}>
          Настроим LockFit так, чтобы дальше все было понятно с первого взгляда.
        </Text>
        <Text style={styles.heroDescription}>
          Ты выбираешь приложения, задаешь лимит для каждого, даешь Android нужные разрешения, а
          потом LockFit бережно, но настойчиво держит границы.
        </Text>
        <View style={styles.heroRibbon}>
          <Text style={styles.heroRibbonText}>3 коротких шага до готовности</Text>
        </View>
      </Card>

      <StepCard
        step="Шаг 1"
        title="Приложения и лимиты"
        description="Определи, какие приложения LockFit будет контролировать, и сколько минут в день можно тратить на каждое."
        actionLabel="Открыть список"
        status={
          state.blockedApps.length > 0
            ? `${state.blockedApps.length} выбрано`
            : 'Пока пусто'
        }
        onPress={() => navigation.navigate('ManageApps', { mode: 'onboarding' })}
      />

      <StepCard
        step="Шаг 2"
        title="Специальные разрешения"
        description="Android не выдает эти права обычным popup. Мы откроем нужные системные экраны и коротко покажем, что именно нужно включить."
        actionLabel="Показать инструкцию"
        status={`${permissionCount} из 2 доступных готово`}
        onPress={() => navigation.navigate('Permissions', { mode: 'onboarding' })}
      />

      <StepCard
        step="Шаг 3"
        title="Battery optimization"
        description="На некоторых прошивках фоновые сервисы засыпают слишком агрессивно. Здесь есть понятная памятка именно под производителя устройства."
        actionLabel="Посмотреть"
        status={state.manufacturer}
        onPress={() => navigation.navigate('Battery')}
      />

      <MotionPressable
        onPress={() => void handleContinue()}
        disabled={!readyToFinish}
        style={[
          styles.primaryButton,
          !readyToFinish && styles.primaryButtonDisabled,
        ]}
      >
        <Text style={styles.primaryButtonText}>Перейти на главный экран</Text>
      </MotionPressable>
      {!readyToFinish ? (
        <Text style={styles.footerHint}>
          Чтобы автоматическая блокировка работала сразу, выбери приложения и включи оба доступа.
        </Text>
      ) : null}
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 14,
    },
    heroEyebrow: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroTitle: {
      color: theme.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 36,
    },
    heroDescription: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 23,
    },
    heroRibbon: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.accentMuted,
    },
    heroRibbonText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    stepCard: {
      gap: 12,
    },
    stepHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    stepLabel: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    stepStatus: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    stepTitle: {
      color: theme.textPrimary,
      fontSize: 21,
      fontWeight: '800',
      lineHeight: 26,
    },
    stepDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    inlineButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.textPrimary,
    },
    inlineButtonText: {
      color: theme.surface,
      fontWeight: '800',
      fontSize: 13,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 22,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 2,
    },
    primaryButtonText: {
      color: theme.accentContrast,
      fontSize: 16,
      fontWeight: '900',
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    footerHint: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },
  });
