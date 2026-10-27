import { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { LockFitNative } from '../native/lockFitNative';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

function PermissionCard({
  title,
  reason,
  steps,
  granted,
  available = true,
  onPress,
}: {
  title: string;
  reason: string;
  steps: string[];
  granted: boolean;
  available?: boolean;
  onPress: () => void | Promise<void>;
}) {
  const styles = useThemedStyles(createStyles);

  const handlePress = async () => {
    try {
      await onPress();
    } catch (error) {
      Alert.alert(
        'Не удалось открыть настройки',
        error instanceof Error ? error.message : 'Открой настройки Android вручную.',
      );
    }
  };

  return (
    <Card delay={120} style={[styles.permissionCard, granted && styles.permissionCardReady]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View
          style={[
            styles.badge,
            granted && available ? styles.badgeReady : styles.badgePending,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              granted && available ? styles.badgeTextReady : styles.badgeTextPending,
            ]}
          >
            {!available ? 'Ещё не готово' : granted ? 'Готово' : 'Нужно включить'}
          </Text>
        </View>
      </View>
      <Text style={styles.reason}>{reason}</Text>
      <View style={styles.stepsList}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
      {available ? (
        <MotionPressable onPress={() => void handlePress()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Открыть системный экран</Text>
        </MotionPressable>
      ) : null}
    </Card>
  );
}

export function PermissionsGuideScreen({ navigation, route }: Props) {
  const {
    state,
    refreshAppState,
    openAccessibilitySettings,
    openUsageAccessSettings,
  } = useLockFit();
  const styles = useThemedStyles(createStyles);

  const openAccessibilityDisclosure = () => {
    Alert.alert(
      'Как работает автоматическая блокировка',
      'LockFit получает только название приложения, которое сейчас открыто, чтобы сравнить его с выбранным списком и показать блокировку после лимита. Сервис не читает текст, пароли, сообщения, нажатия или содержимое экрана и не отправляет эти данные с телефона.',
      [
        { text: 'Не сейчас', style: 'cancel' },
        {
          text: 'Я понимаю и согласен',
          onPress: () => {
            void (async () => {
              await LockFitNative.confirmAccessibilityDisclosure();
              await openAccessibilitySettings();
            })();
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      void refreshAppState();
    }, [refreshAppState]),
  );

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Android permissions</Text>
        <Text style={styles.title}>
          Это тот самый сложный момент, который нужно объяснить честно и спокойно.
        </Text>
        <Text style={styles.description}>
          Здесь нет обычного popup. Приложение открывает системную страницу Android, а ты вручную
          включаешь доступ для LockFit.
        </Text>
        <Text style={styles.note}>
          Если после возврата статус не обновился, просто нажми "Проверить снова".
        </Text>
      </Card>

      <PermissionCard
        title="Usage access"
        reason="Нужно, чтобы LockFit видел, сколько минут уже потрачено на выбранные приложения за сегодня."
        steps={[
          'Нажми кнопку ниже и открой экран специального доступа.',
          'Найди в списке LockFit.',
          'Разреши доступ к статистике использования.',
        ]}
        granted={state.permissionStatus.usageAccessGranted}
        onPress={openUsageAccessSettings}
      />

      <PermissionCard
        title="Accessibility service"
        reason="Нужно только для определения открытого выбранного приложения и показа экрана LockFit после лимита. Содержимое экрана, сообщения, пароли и нажатия не читаются."
        steps={[
          'Открой раздел специальных возможностей Android.',
          'Зайди в Installed services или Downloaded apps.',
          'Выбери «LockFit: блокировка приложений».',
          'Включи Use LockFit и подтверди системное предупреждение.',
          'Вернись в приложение и нажми «Проверить снова».',
        ]}
        granted={state.permissionStatus.accessibilityGranted}
        onPress={openAccessibilityDisclosure}
      />

      <Card delay={280}>
        <Text style={styles.sectionTitle}>Зачем нужны оба доступа</Text>
        <Text style={styles.sectionText}>
          Usage access считает только длительность использования. Accessibility замечает, что
          открыто выбранное приложение, и показывает системный accessibility-overlay. Отдельное
          разрешение Draw over other apps LockFit не запрашивает.
        </Text>
      </Card>

      <View style={styles.actions}>
        <MotionPressable onPress={() => void refreshAppState()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Проверить снова</Text>
        </MotionPressable>
        {route.params.mode === 'onboarding' ? (
          <MotionPressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Вернуться к старту</Text>
          </MotionPressable>
        ) : null}
      </View>
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
    note: {
      color: theme.warning,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '700',
    },
    permissionCard: {
      gap: 14,
    },
    permissionCardReady: {
      backgroundColor: theme.accentMuted,
      borderColor: theme.accent,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    cardTitle: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '900',
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    badgeReady: {
      backgroundColor: theme.textPrimary,
    },
    badgePending: {
      backgroundColor: theme.isDark ? '#483833' : '#F1DDD2',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    badgeTextReady: {
      color: theme.surface,
    },
    badgeTextPending: {
      color: theme.warning,
    },
    reason: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    stepsList: {
      gap: 10,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    stepIndex: {
      width: 22,
      height: 22,
      borderRadius: 11,
      textAlign: 'center',
      lineHeight: 22,
      backgroundColor: theme.surfaceMuted,
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    stepText: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 13,
      lineHeight: 20,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '900',
    },
    sectionText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    actions: {
      gap: 10,
    },
    secondaryButton: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 18,
      paddingVertical: 15,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    primaryButton: {
      backgroundColor: theme.textPrimary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 15,
      fontWeight: '900',
    },
  });
