import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { useI18n } from '../i18n/I18nProvider';
import { languageOptions } from '../i18n/translations';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { ThemeName } from '../types/lockfit';

export function SettingsScreen() {
  const {
    state,
    saveStepRewardSettings,
    saveLanguagePreference,
    saveThemePreference,
    saveUnlockBonusMinutes,
  } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useI18n();
  const [bonusMinutes, setBonusMinutes] = useState(String(state.unlockBonusMinutes));
  const [stepsPerReward, setStepsPerReward] = useState(String(state.stepsPerReward));
  const [stepBonusMinutes, setStepBonusMinutes] = useState(String(state.stepBonusMinutes));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveUnlockBonusMinutes(Number.parseInt(bonusMinutes, 10) || 15);
      Alert.alert('Сохранено', 'Бонус за тренировку обновлен.');
    } catch (error) {
      Alert.alert(
        'Не получилось сохранить',
        error instanceof Error ? error.message : 'Попробуй еще раз.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (themeName: ThemeName) => {
    await saveThemePreference(themeName);
  };

  const handleSaveStepReward = async () => {
    try {
      setSaving(true);
      await saveStepRewardSettings({
        stepsPerReward: Number.parseInt(stepsPerReward, 10) || 500,
        stepBonusMinutes: Number.parseInt(stepBonusMinutes, 10) || 5,
      });
      Alert.alert('Сохранено', 'Награда за новые шаги обновлена. Уже обменённые шаги не изменятся.');
    } catch (error) {
      Alert.alert('Не получилось сохранить', error instanceof Error ? error.message : 'Попробуй ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Настройки</Text>
        <Text style={styles.title}>
          Оставил только то, что действительно влияет на ежедневный ритм.
        </Text>
        <Text style={styles.copy}>
          Сначала лучше сделать несколько сильных настроек понятными, чем прятать десятки опций в
          перегруженном экране.
        </Text>
      </Card>

      <Card delay={120} style={styles.editorCard}>
        <Text style={styles.label}>{t('settings.language')}</Text>
        <Text style={styles.hint}>{t('settings.languageHint')}</Text>
        <View style={styles.languageGrid}>
          {languageOptions.map((option) => {
            const active = option.id === state.languagePreference;
            return (
              <MotionPressable
                key={option.id}
                onPress={() => void saveLanguagePreference(option.id)}
                style={[styles.languageChip, active && styles.languageChipActive]}
              >
                <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>
                  {option.id === 'system' ? t('settings.systemLanguage') : option.label}
                </Text>
              </MotionPressable>
            );
          })}
        </View>
      </Card>

      <Card delay={160} style={styles.editorCard}>
        <Text style={styles.label}>Тема приложения</Text>
        <Text style={styles.hint}>
          `Meadow Mist` - светлая молочно-шалфейная тема, `Evening Clay` - мягкая вечерняя.
        </Text>
        <View style={styles.themeRow}>
          <MotionPressable
            onPress={() => void handleThemeChange('sand')}
            style={[
              styles.themeCard,
              state.themePreference === 'sand' && styles.themeCardActive,
            ]}
            pressScale={0.985}
          >
            <View style={styles.themePreviewSand} />
            <Text style={styles.themeName}>Meadow Mist</Text>
            <Text style={styles.themeText}>Молочная и шалфейная</Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => void handleThemeChange('midnight')}
            style={[
              styles.themeCard,
              state.themePreference === 'midnight' && styles.themeCardActive,
            ]}
            pressScale={0.985}
          >
            <View style={styles.themePreviewMidnight} />
            <Text style={styles.themeName}>Evening Clay</Text>
            <Text style={styles.themeText}>Графитовая и глиняная</Text>
          </MotionPressable>
        </View>
      </Card>

      <Card delay={220} style={styles.editorCard}>
        <Text style={styles.label}>Сколько минут давать за успешную тренировку</Text>
        <TextInput
          keyboardType="number-pad"
          value={bonusMinutes}
          onChangeText={(value) => setBonusMinutes(value.replace(/[^0-9]/g, ''))}
          style={styles.input}
          placeholder="15"
          placeholderTextColor={theme.textMuted}
        />
        <Text style={styles.hint}>
          Сейчас этот бонус добавляется к общему остатку времени на текущий день.
        </Text>
        <MotionPressable
          disabled={saving}
          onPress={() => void handleSave()}
          style={[styles.primaryButton, saving && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>Сохранить бонус</Text>
        </MotionPressable>
      </Card>

      <Card delay={300}>
        <Text style={styles.label}>Награда за ходьбу</Text>
        <Text style={styles.hint}>
          Минимум 100 шагов за обмен. Лучше начинать с 500 шагов за 5 минут, чтобы награда оставалась честной.
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputCaption}>Новые шаги</Text>
            <TextInput
              keyboardType="number-pad"
              value={stepsPerReward}
              onChangeText={(value) => setStepsPerReward(value.replace(/[^0-9]/g, ''))}
              style={styles.input}
              placeholder="500"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputCaption}>Бонус, минут</Text>
            <TextInput
              keyboardType="number-pad"
              value={stepBonusMinutes}
              onChangeText={(value) => setStepBonusMinutes(value.replace(/[^0-9]/g, ''))}
              style={styles.input}
              placeholder="5"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>
        <MotionPressable
          disabled={saving}
          onPress={() => void handleSaveStepReward()}
          style={[styles.primaryButton, saving && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>Сохранить награду за шаги</Text>
        </MotionPressable>
      </Card>

      <Card delay={380}>
        <Text style={styles.label}>Текущее состояние</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{state.manufacturer}</Text>
            <Text style={styles.statusLabel}>производитель</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{state.blockedApps.length}</Text>
            <Text style={styles.statusLabel}>приложения</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{state.totalUsedMinutes}</Text>
            <Text style={styles.statusLabel}>минут сегодня</Text>
          </View>
        </View>
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
      fontFamily: 'serif',
      fontSize: 29,
      fontWeight: '900',
      lineHeight: 35,
    },
    copy: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    editorCard: {
      gap: 14,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    hint: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    languageChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    languageChipActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accent,
    },
    languageChipText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    languageChipTextActive: {
      color: theme.accentContrast,
    },
    themeCard: {
      flex: 1,
      padding: 12,
      borderRadius: 20,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: 'transparent',
      gap: 8,
    },
    themeCardActive: {
      borderColor: theme.accent,
    },
    themePreviewSand: {
      height: 54,
      borderRadius: 14,
      backgroundColor: '#F7F5F0',
      borderWidth: 1,
      borderColor: '#DDDCD4',
    },
    themePreviewMidnight: {
      height: 54,
      borderRadius: 14,
      backgroundColor: '#202626',
      borderWidth: 1,
      borderColor: '#E2A18B',
    },
    themeName: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    themeText: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '800',
      backgroundColor: theme.surfaceMuted,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 10,
    },
    inputGroup: {
      flex: 1,
      gap: 7,
    },
    inputCaption: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.accentContrast,
      fontSize: 15,
      fontWeight: '900',
    },
    statusGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    statusItem: {
      flex: 1,
      backgroundColor: theme.surfaceMuted,
      borderRadius: 18,
      padding: 14,
      gap: 4,
    },
    statusValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    statusLabel: {
      color: theme.textMuted,
      fontSize: 12,
    },
    disabledButton: {
      opacity: 0.45,
    },
  });
