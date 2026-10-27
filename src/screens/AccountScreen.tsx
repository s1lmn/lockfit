import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export function AccountScreen() {
  const { deleteAccount, state, updateAccountNickname } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [nickname, setNickname] = useState(state.account?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAccountNickname(nickname);
      Alert.alert('Сохранено', 'Никнейм обновлен.');
    } catch (error) {
      Alert.alert(
        'Не получилось сохранить',
        error instanceof Error ? error.message : 'Попробуй еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Удалить локальный аккаунт?',
      'Будут безвозвратно удалены профиль, выбранные приложения, лимиты, статистика шагов и журнал тренировок на этом устройстве.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить всё',
          style: 'destructive',
          onPress: () => {
            void deleteAccount().catch((error) => {
              Alert.alert(
                'Не удалось удалить данные',
                error instanceof Error ? error.message : 'Попробуй ещё раз.',
              );
            });
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Профиль</Text>
        <Text style={styles.title}>{state.account?.nickname ?? 'Аккаунт LockFit'}</Text>
        <Text style={styles.copy}>
          Пока профиль локальный и живет только на этом устройстве. Для первых тестов с друзьями
          это даже плюс: меньше трения, быстрее старт.
        </Text>
      </Card>

      <Card delay={120}>
        <Text style={styles.label}>Почта</Text>
        <View style={styles.valuePill}>
          <Text style={styles.value}>{state.account?.email ?? 'Не указана'}</Text>
        </View>
      </Card>

      <Card delay={200} style={styles.editorCard}>
        <Text style={styles.label}>Никнейм</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          style={styles.input}
          placeholder="Никнейм"
          placeholderTextColor={theme.textMuted}
        />
        <MotionPressable
          disabled={saving}
          onPress={() => void handleSave()}
          style={[styles.primaryButton, saving && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>Сохранить никнейм</Text>
        </MotionPressable>
      </Card>

      <Card delay={280} style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Удаление данных</Text>
        <Text style={styles.copy}>
          Аккаунт полностью локальный, поэтому удаление выполняется сразу на этом телефоне и не
          может быть отменено.
        </Text>
        <MotionPressable onPress={confirmDeletion} style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Удалить аккаунт и все данные</Text>
        </MotionPressable>
      </Card>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 10,
    },
    eyebrow: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 34,
    },
    copy: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    valuePill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    value: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: '700',
    },
    editorCard: {
      gap: 14,
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
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 15,
      fontWeight: '900',
    },
    disabledButton: {
      opacity: 0.45,
    },
    dangerCard: {
      gap: 14,
      borderColor: theme.danger,
    },
    dangerTitle: {
      color: theme.danger,
      fontSize: 18,
      fontWeight: '900',
    },
    dangerButton: {
      borderWidth: 1,
      borderColor: theme.danger,
      borderRadius: 18,
      paddingVertical: 15,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: '900',
    },
  });
