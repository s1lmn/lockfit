import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Screen } from '../components/Screen';
import {
  antiCheatChallenges,
  pickRandomChallenge,
} from '../features/exercise/antiCheat';
import { exercisePresets } from '../features/exercise/repetitionCounter';
import {
  LockFitNative,
  NativeExerciseSessionResult,
} from '../native/lockFitNative';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLockFit } from '../providers/LockFitProvider';
import type { AppTheme } from '../theme/palette';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { ExerciseType } from '../types/lockfit';

type Props = NativeStackScreenProps<RootStackParamList, 'Exercise'>;

export function ExerciseScreen({ navigation }: Props) {
  const { addWorkoutBonus, state } = useLockFit();
  const styles = useThemedStyles(createStyles);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('pushups');
  const [challenge, setChallenge] = useState(() => pickRandomChallenge());
  const [isLaunching, setIsLaunching] = useState(false);
  const [showCameraSetup, setShowCameraSetup] = useState(false);
  const [lastResult, setLastResult] = useState<NativeExerciseSessionResult | null>(null);
  const isConsumingResultRef = useRef(false);

  const preset = useMemo(() => exercisePresets[exerciseType], [exerciseType]);

  const consumeNativeResult = useCallback(async () => {
    if (isConsumingResultRef.current) {
      return;
    }

    isConsumingResultRef.current = true;

    try {
      const result = await LockFitNative.consumePendingExerciseResult();
      if (!result) {
        return;
      }

      setLastResult(result);
      setIsLaunching(false);

      if (result.status === 'completed') {
        await addWorkoutBonus({
          exerciseType: result.exerciseType,
          repetitions: result.repetitions,
          bonusMinutes: result.bonusMinutes,
          challengeType: result.challengeType,
        });

        setChallenge(pickRandomChallenge());
        Alert.alert(
          'Бонус начислен',
          `Ты получил +${result.bonusMinutes} минут после ${result.repetitions} повторов.`,
        );
        navigation.navigate('Home');
        return;
      }

      if (result.status === 'failed') {
        Alert.alert('Сессия не завершена', result.message);
      }
    } finally {
      isConsumingResultRef.current = false;
    }
  }, [addWorkoutBonus, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void consumeNativeResult();
    });

    return unsubscribe;
  }, [consumeNativeResult, navigation]);

  const launchNativeExercise = async () => {
    setIsLaunching(true);
    setLastResult(null);

    try {
      const started = await LockFitNative.launchExerciseUnlock({
        exerciseType,
        challengeType: challenge.id,
        requiredRepetitions: preset.requiredRepetitions,
        bonusMinutes: state.unlockBonusMinutes,
        bottomThreshold: preset.bottomThreshold,
        topThreshold: preset.topThreshold,
      });

      if (!started) {
        setIsLaunching(false);
        Alert.alert(
          'Не удалось открыть камеру',
          'Похоже, dev client пока не собран с новым нативным модулем.',
        );
      }
    } catch (error) {
      setIsLaunching(false);
      const message =
        error instanceof Error ? error.message : 'Произошла ошибка при запуске камеры.';
      Alert.alert('Ошибка запуска', message);
    }
  };

  const resultTone =
    lastResult?.status === 'completed'
      ? styles.resultSuccess
      : lastResult?.status === 'failed'
        ? styles.resultFailed
        : styles.resultNeutral;

  return (
    <Screen>
      <Card delay={40} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Real exercise unlock</Text>
        <Text style={styles.heroTitle}>Камера проверяет человека, жест и реальные повторы.</Text>
        <Text style={styles.secondaryText}>
          Откроется отдельная Android camera session: сначала mini anti-cheat challenge, потом
          счет повторений по позе тела через ML Kit.
        </Text>
      </Card>

      <Card delay={120}>
        <Text style={styles.sectionTitle}>Выбери упражнение</Text>
        <View style={styles.segmentRow}>
          {(['pushups', 'squats'] as ExerciseType[]).map((type) => {
            const active = type === exerciseType;
            const option = exercisePresets[type];

            return (
              <MotionPressable
                key={type}
                onPress={() => {
                  setExerciseType(type);
                  setShowCameraSetup(false);
                }}
                style={[styles.segment, active && styles.segmentActive]}
                pressScale={0.985}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </MotionPressable>
            );
          })}
        </View>
        <Text style={styles.secondaryText}>
          Нужно сделать {preset.requiredRepetitions} повторов. Полный повтор считается как
          переход через нижний порог {preset.bottomThreshold}° и возврат через верхний порог{' '}
          {preset.topThreshold}°.
        </Text>
      </Card>

      <Card delay={200} style={styles.challengeCard}>
        <Text style={styles.sectionTitle}>Случайный anti-cheat челлендж</Text>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.secondaryText}>{challenge.subtitle}</Text>
        <MotionPressable
          onPress={() => setChallenge(pickRandomChallenge())}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Сменить челлендж</Text>
        </MotionPressable>
      </Card>

      <Card delay={280} style={styles.flowCard}>
        <Text style={styles.sectionTitle}>Почему важна установка телефона</Text>
        <Text style={styles.secondaryText}>
          Камера измеряет углы суставов. Наклонённый, дрожащий или слишком близкий телефон
          делает даже правильное движение плохо различимым.
        </Text>
      </Card>

      {showCameraSetup ? (
        <Card delay={300} style={styles.setupCard}>
          <Text style={styles.setupEyebrow}>Проверка перед стартом</Text>
          <Text style={styles.sectionTitle}>Закрепи телефон и проверь кадр</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Поставь телефон вертикально и неподвижно, не держи его в руке.</Text>
            <Text style={styles.listItem}>2. Расположи камеру примерно на высоте таза.</Text>
            <Text style={styles.listItem}>3. Отойди на 2-2,5 метра и повернись к камере боком.</Text>
            <Text style={styles.listItem}>4. В кадре одновременно должны быть лицо, плечи, таз и стопы.</Text>
            <Text style={styles.listItem}>5. Включи ровный свет спереди; не стой спиной к яркому окну.</Text>
          </View>
          <Text style={styles.setupHint}>
            После запуска не двигай телефон. LockFit сначала проверит устойчивость кадра и жест,
            только затем начнёт считать повторы.
          </Text>
        </Card>
      ) : null}

      <Card delay={320} style={styles.flowCard}>
        <Text style={styles.sectionTitle}>Что проверяется</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>Полное тело и надёжность ключевых точек.</Text>
          <Text style={styles.listItem}>Положение корпуса и выбранная сторона тела.</Text>
          <Text style={styles.listItem}>Устойчивая верхняя и нижняя точки, а не один случайный кадр.</Text>
        </View>
      </Card>

      {lastResult ? (
        <Card delay={320} style={[styles.resultCard, resultTone]}>
          <Text style={styles.sectionTitle}>Последняя сессия</Text>
          <Text style={styles.resultTitle}>{formatResultTitle(lastResult)}</Text>
          <Text style={styles.secondaryText}>{lastResult.message}</Text>
        </Card>
      ) : null}

      <Card delay={360}>
        <Text style={styles.sectionTitle}>Текущие жесты</Text>
        <View style={styles.list}>
          {antiCheatChallenges.map((item) => (
            <Text key={item.id} style={styles.listItem}>
              {item.title}
            </Text>
          ))}
        </View>
      </Card>

      <MotionPressable
        disabled={isLaunching}
        onPress={() => {
          if (!showCameraSetup) {
            setShowCameraSetup(true);
            return;
          }
          void launchNativeExercise();
        }}
        style={[styles.primaryButton, isLaunching && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>
          {isLaunching
            ? 'Открываем camera session...'
            : showCameraSetup
              ? `Телефон установлен — начать за +${state.unlockBonusMinutes} минут`
              : 'Подготовить камеру'}
        </Text>
      </MotionPressable>
    </Screen>
  );
}

function formatResultTitle(result: NativeExerciseSessionResult) {
  if (result.status === 'completed') {
    return `${result.repetitions} / ${result.requiredRepetitions} повторов, +${result.bonusMinutes} минут`;
  }

  if (result.status === 'failed') {
    return 'Сессия завершилась с ошибкой';
  }

  return 'Сессия была отменена';
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
    heroTitle: {
      color: theme.textPrimary,
      fontFamily: 'serif',
      fontSize: 29,
      fontWeight: '900',
      lineHeight: 35,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '900',
    },
    secondaryText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 10,
    },
    segment: {
      flex: 1,
      backgroundColor: theme.surfaceMuted,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: theme.textPrimary,
    },
    segmentText: {
      color: theme.textPrimary,
      fontWeight: '800',
    },
    segmentTextActive: {
      color: theme.surface,
    },
    challengeCard: {
      backgroundColor: theme.name === 'midnight' ? '#483833' : '#F1DDD2',
      borderColor: theme.name === 'midnight' ? '#654A41' : '#E4CABC',
    },
    challengeTitle: {
      color: theme.warning,
      fontSize: 22,
      fontWeight: '900',
    },
    flowCard: {
      gap: 12,
    },
    setupCard: {
      gap: 12,
      backgroundColor: theme.name === 'midnight' ? '#30403C' : '#E2ECE4',
      borderColor: theme.name === 'midnight' ? '#49605A' : '#C8DACB',
    },
    setupEyebrow: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    setupHint: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 20,
    },
    list: {
      gap: 8,
    },
    listItem: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    secondaryButton: {
      marginTop: 14,
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 12,
      backgroundColor: theme.surfaceMuted,
      borderRadius: 18,
    },
    secondaryButtonText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 22,
      paddingVertical: 17,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.accentContrast,
      fontSize: 16,
      fontWeight: '900',
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.45,
    },
    resultCard: {
      gap: 10,
    },
    resultNeutral: {
      backgroundColor: theme.surfaceMuted,
    },
    resultSuccess: {
      backgroundColor: theme.name === 'midnight' ? '#30443D' : '#E2EFE8',
      borderColor: theme.name === 'midnight' ? '#4A655B' : '#BCD7C7',
    },
    resultFailed: {
      backgroundColor: theme.name === 'midnight' ? '#493535' : '#F2DFDF',
      borderColor: theme.name === 'midnight' ? '#6B4B4B' : '#DDBEBE',
    },
    resultTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 24,
    },
  });
