import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MotionPressable } from '../components/MotionPressable';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { formatMinutes } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Lock'>;

export function LockScreen({ navigation }: Props) {
  const { state } = useLockFit();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.panel}>
        <Text style={styles.kicker}>LockFit active</Text>
        <Text style={styles.lockTitle}>Лимит исчерпан</Text>
        <Text style={styles.lockSubtitle}>
          На сегодня время для выбранных приложений уже закончилось. После подключения
          AccessibilityService этот экран будет подниматься автоматически поверх соцсети.
        </Text>

        <View style={styles.meter}>
          <Text style={styles.meterLabel}>Осталось времени</Text>
          <Text style={styles.meterValue}>{formatMinutes(state.remainingMinutes)}</Text>
        </View>

        <View style={styles.supportRibbon}>
          <Text style={styles.supportRibbonText}>
            {theme.name === 'midnight'
              ? 'Включена вечерняя тема Evening Clay'
              : 'Можно переключить тему в настройках'}
          </Text>
        </View>

        <MotionPressable
          onPress={() => navigation.navigate('Exercise')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Разблокировать через упражнение</Text>
        </MotionPressable>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.name === 'midnight' ? '#081018' : '#17130F',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    glowOne: {
      position: 'absolute',
      top: 80,
      left: -20,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: theme.name === 'midnight' ? '#24433E' : '#3B5D44',
      opacity: 0.35,
    },
    glowTwo: {
      position: 'absolute',
      bottom: 120,
      right: -20,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: theme.name === 'midnight' ? '#6A3D1B' : '#7A5325',
      opacity: 0.28,
    },
    panel: {
      width: '100%',
      borderRadius: 30,
      backgroundColor: theme.name === 'midnight'
        ? 'rgba(18, 32, 42, 0.82)'
        : 'rgba(255, 249, 239, 0.08)',
      borderWidth: 1,
      borderColor: theme.name === 'midnight'
        ? 'rgba(238,245,244,0.14)'
        : 'rgba(255,249,239,0.14)',
      padding: 24,
      gap: 18,
    },
    kicker: {
      color: theme.name === 'midnight' ? '#D7E6E4' : '#D6C8B8',
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    lockTitle: {
      color: theme.accentContrast,
      fontSize: 36,
      fontWeight: '900',
      lineHeight: 40,
    },
    lockSubtitle: {
      color: theme.name === 'midnight' ? '#C7D7D5' : '#DCCFC0',
      fontSize: 16,
      lineHeight: 24,
    },
    meter: {
      backgroundColor: theme.name === 'midnight'
        ? 'rgba(238,245,244,0.08)'
        : 'rgba(255,249,239,0.1)',
      borderRadius: 24,
      padding: 22,
      alignItems: 'center',
      gap: 6,
    },
    meterLabel: {
      color: theme.name === 'midnight' ? '#B7CBCA' : '#C9BCAA',
      fontSize: 13,
      fontWeight: '700',
    },
    meterValue: {
      color: theme.danger,
      fontSize: 42,
      fontWeight: '900',
    },
    supportRibbon: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: theme.name === 'midnight'
        ? 'rgba(238,245,244,0.08)'
        : 'rgba(255,249,239,0.08)',
    },
    supportRibbonText: {
      color: theme.accentContrast,
      fontSize: 12,
      fontWeight: '700',
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 20,
      paddingVertical: 17,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.accentContrast,
      fontSize: 16,
      fontWeight: '900',
    },
  });
