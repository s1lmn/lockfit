import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';

type AnimatedProgressBarProps = {
  danger?: boolean;
  progress: number;
};

export function AnimatedProgressBar({
  danger = false,
  progress,
}: AnimatedProgressBarProps) {
  const styles = useThemedStyles(createStyles);
  const scaleX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scaleX, {
      toValue: Math.max(0, Math.min(1, progress / 100)),
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, scaleX]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          danger && styles.fillDanger,
          {
            transform: [{ scaleX }],
          },
        ]}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    track: {
      width: '100%',
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceMuted,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      width: '100%',
      borderRadius: 999,
      backgroundColor: theme.accent,
      transformOrigin: 'left center' as never,
    },
    fillDanger: {
      backgroundColor: theme.danger,
    },
  });
