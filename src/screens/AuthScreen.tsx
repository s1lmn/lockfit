import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({}: Props) {
  const { state, login, register } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<'login' | 'register'>(
    state.account ? 'login' : 'register',
  );
  const [email, setEmail] = useState(state.account?.email ?? '');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(state.account?.nickname ?? '');
  const [submitting, setSubmitting] = useState(false);

  const description = useMemo(() => {
    if (mode === 'register') {
      return 'Создай локальный аккаунт на этом телефоне, чтобы LockFit запомнил твой профиль, приложения и лимиты.';
    }

    return 'Вход вернет тебя в уже настроенный LockFit на этом устройстве.';
  }, [mode]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (mode === 'register') {
        await register({ email, password, nickname });
      } else {
        await login({ email, password });
      }
    } catch (error) {
      Alert.alert(
        'Не получилось',
        error instanceof Error ? error.message : 'Попробуй еще раз.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>LockFit</Text>
        <Text style={styles.title}>Контроль соцсетей через ритм, а не через запрет.</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>1</Text>
            <Text style={styles.heroStatLabel}>локальный профиль на устройстве</Text>
          </View>
          <View style={styles.heroStatAccent}>
            <Text style={styles.heroStatValueAccent}>
              {theme.name === 'midnight' ? 'Night mode' : 'Android first'}
            </Text>
            <Text style={styles.heroStatLabelAccent}>
              {theme.name === 'midnight'
                ? 'вторая полная тема уже доступна в настройках'
                : 'пока без лишних шагов и подтверждений'}
            </Text>
          </View>
        </View>
      </Card>

      <Card delay={140} style={styles.formCard}>
        <View style={styles.segmentRow}>
          <MotionPressable
            onPress={() => setMode('login')}
            style={[styles.segment, mode === 'login' && styles.segmentActive]}
            pressScale={0.985}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'login' && styles.segmentTextActive,
              ]}
            >
              Вход
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => setMode('register')}
            style={[styles.segment, mode === 'register' && styles.segmentActive]}
            pressScale={0.985}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'register' && styles.segmentTextActive,
              ]}
            >
              Регистрация
            </Text>
          </MotionPressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Почта</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            secureTextEntry
            placeholder="Любой непустой пароль"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {mode === 'register' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Никнейм</Text>
            <TextInput
              placeholder="Как к тебе обращаться"
              placeholderTextColor={theme.textMuted}
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
            />
          </View>
        ) : null}

        <MotionPressable
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[styles.primaryButton, submitting && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>
            {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </Text>
        </MotionPressable>

        {state.account && mode === 'register' ? (
          <Text style={styles.helperText}>
            Аккаунт на устройстве уже есть. Если ты просто возвращаешься в приложение, открой
            вкладку "Вход".
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
      gap: 16,
    },
    eyebrow: {
      color: theme.accentContrast,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      opacity: 0.9,
    },
    title: {
      color: theme.accentContrast,
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 36,
      maxWidth: '92%',
    },
    description: {
      color: theme.accentContrast,
      fontSize: 15,
      lineHeight: 22,
      maxWidth: '90%',
      opacity: 0.92,
    },
    heroStats: {
      flexDirection: 'row',
      gap: 12,
    },
    heroStat: {
      flex: 1,
      borderRadius: 20,
      padding: 14,
      backgroundColor: theme.isDark ? 'rgba(255,245,238,0.14)' : 'rgba(255,249,239,0.14)',
    },
    heroStatAccent: {
      flex: 1.2,
      borderRadius: 20,
      padding: 14,
      backgroundColor: theme.surface,
    },
    heroStatValue: {
      color: theme.accentContrast,
      fontSize: 28,
      fontWeight: '900',
    },
    heroStatLabel: {
      color: theme.accentContrast,
      fontSize: 12,
      lineHeight: 18,
      opacity: 0.92,
    },
    heroStatValueAccent: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    heroStatLabelAccent: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    formCard: {
      gap: 16,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 10,
      padding: 6,
      borderRadius: 20,
      backgroundColor: theme.surfaceMuted,
    },
    segment: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 13,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    segmentText: {
      color: theme.textMuted,
      fontWeight: '800',
    },
    segmentTextActive: {
      color: theme.textPrimary,
    },
    formGroup: {
      gap: 8,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.textPrimary,
      fontSize: 16,
      backgroundColor: theme.surfaceMuted,
    },
    primaryButton: {
      backgroundColor: theme.textPrimary,
      borderRadius: 20,
      paddingVertical: 17,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 16,
      fontWeight: '900',
    },
    helperText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    disabledButton: {
      opacity: 0.45,
    },
  });
