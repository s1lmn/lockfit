import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';
import { getBatteryInstruction } from '../utils/battery';

export function BatteryOptimizationScreen() {
  const { state } = useLockFit();
  const styles = useThemedStyles(createStyles);
  const instruction = getBatteryInstruction(state.manufacturer);

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Battery optimization</Text>
        <Text style={styles.title}>{instruction.title}</Text>
        <Text style={styles.copy}>
          На некоторых Android-прошивках система слишком агрессивно выгружает фоновое приложение.
          Если это произойдет, блокировка может перестать срабатывать после долгого простоя.
        </Text>
      </Card>

      <Card delay={140}>
        <Text style={styles.subtitle}>Что сделать вручную</Text>
        <View style={styles.steps}>
          {instruction.bullets.map((item, index) => (
            <View key={item} style={styles.stepRow}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
              <Text style={styles.bullet}>{item}</Text>
            </View>
          ))}
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
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    subtitle: {
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '900',
    },
    copy: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    steps: {
      gap: 12,
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
    bullet: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
  });
