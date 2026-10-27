import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

function MenuItem({
  title,
  subtitle,
  accent,
  onPress,
}: {
  title: string;
  subtitle: string;
  accent: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <MotionPressable onPress={onPress} style={styles.menuItem} pressScale={0.99}>
      <View style={[styles.menuAccent, { backgroundColor: accent }]} />
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </MotionPressable>
  );
}

export function MenuScreen({ navigation }: Props) {
  const { state, logout } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleLogout = async () => {
    await logout();
    Alert.alert('Выход выполнен', 'Локальная сессия на этом устройстве завершена.');
  };

  const accentCards = theme.name === 'midnight'
    ? ['#354642', '#493B35', '#324442', '#4A4230', '#413847', '#34414A']
    : ['#E2ECE4', '#F1DDD2', '#DCEBE5', '#EEE6C9', '#ECDDD5', '#DEE8EE'];

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.headerEyebrow}>Меню</Text>
        <Text style={styles.headerTitle}>{state.account?.nickname ?? 'Профиль'}</Text>
        <Text style={styles.headerText}>
          {state.account?.email ?? 'Нет почты'} • здесь собраны аккаунт, настройки, приложения и
          системные инструкции.
        </Text>
        <View style={styles.themePill}>
          <Text style={styles.themePillText}>
            Тема: {state.themePreference === 'midnight' ? 'Evening Clay' : 'Meadow Mist'}
          </Text>
        </View>
      </Card>

      <Card delay={120} style={styles.menuCard}>
        <MenuItem
          title="Аккаунт"
          subtitle="Почта, никнейм и базовые данные входа."
          accent={accentCards[0]}
          onPress={() => navigation.navigate('Account')}
        />
        <MenuItem
          title="Настройки"
          subtitle="Бонус за тренировку, тема и текущие параметры."
          accent={accentCards[1]}
          onPress={() => navigation.navigate('Settings')}
        />
        <MenuItem
          title="Движение и награды"
          subtitle="Упражнения, шагомер и недельный результат."
          accent={accentCards[2]}
          onPress={() => navigation.navigate('ActivityHub')}
        />
        <MenuItem
          title="Приложения и лимиты"
          subtitle="Добавить новые приложения в блокировку или изменить лимиты."
          accent={accentCards[3]}
          onPress={() => navigation.navigate('ManageApps', { mode: 'manage' })}
        />
        <MenuItem
          title="Разрешения Android"
          subtitle="Пошаговая инструкция по Usage Access и Accessibility."
          accent={accentCards[4]}
          onPress={() => navigation.navigate('Permissions', { mode: 'manage' })}
        />
        <MenuItem
          title="Battery optimization"
          subtitle="Памятка для Xiaomi, Samsung, Huawei и других прошивок."
          accent={accentCards[5]}
          onPress={() => navigation.navigate('Battery')}
        />
      </Card>

      <MotionPressable onPress={() => void handleLogout()} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </MotionPressable>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    heroCard: {
      gap: 10,
    },
    headerEyebrow: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 34,
    },
    headerText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    themePill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
    },
    themePillText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    menuCard: {
      gap: 14,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 2,
    },
    menuAccent: {
      width: 14,
      height: 54,
      borderRadius: 10,
    },
    menuCopy: {
      flex: 1,
      gap: 4,
    },
    menuTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    menuSubtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    chevron: {
      color: theme.textMuted,
      fontSize: 30,
      lineHeight: 30,
    },
    logoutButton: {
      backgroundColor: theme.surfaceStrong,
      borderRadius: 20,
      paddingVertical: 17,
      alignItems: 'center',
    },
    logoutText: {
      color: theme.accentContrast,
      fontSize: 15,
      fontWeight: '900',
    },
  });
