import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(18)).current;
  const glowShift = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const ambient = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowShift, {
            toValue: 1,
            duration: 4200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowShift, {
            toValue: 0,
            duration: 4200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.82,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    entrance.start();
    ambient.start();

    return () => {
      entrance.stop();
      ambient.stop();
    };
  }, [contentOpacity, contentTranslate, glowPulse, glowShift]);

  const content = (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslate }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowTop,
          {
            opacity: glowPulse,
            transform: [
              {
                translateY: glowShift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowRight,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0.82, 1],
              outputRange: [0.5, 0.68],
            }),
            transform: [
              {
                translateX: glowShift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowBottom,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0.82, 1],
              outputRange: [0.45, 0.62],
            }),
            transform: [
              {
                translateY: glowShift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}
      />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 28,
    },
    content: {
      padding: 20,
      gap: 18,
    },
    glowTop: {
      position: 'absolute',
      top: -70,
      left: -20,
      width: 240,
      height: 180,
      borderRadius: 100,
      backgroundColor: theme.backgroundCanvas,
    },
    glowRight: {
      position: 'absolute',
      top: 160,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.accentMuted,
    },
    glowBottom: {
      position: 'absolute',
      bottom: -50,
      left: 70,
      width: 220,
      height: 120,
      borderRadius: 70,
      backgroundColor: theme.backgroundAccent,
    },
  });
