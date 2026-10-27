import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

import { LockFitNative } from '../native/lockFitNative';
import {
  getAvailableRewardSteps,
  normalizeStepRewardConfig,
} from '../features/activity/stepRewards';
import {
  addWorkoutLogEntry,
  claimStepReward,
  deleteLocalAccount,
  getBlockedApps,
  getSettings,
  getStepDay,
  getStepRewardLog,
  getTodayBonusMinutes,
  getTodayUsage,
  getUserAccount,
  getWeeklyActivitySummary,
  getWorkoutLog,
  incrementUsageForDemo,
  loginUserAccount,
  logoutUserAccount,
  registerUserAccount,
  recordStepSensorValue,
  replaceBlockedApps,
  saveSettings,
  updateNickname,
  upsertTodayUsage,
} from '../storage/repositories';
import { initializeDatabase } from '../storage/database';
import { getLocalDateKey } from '../utils/date';
import { normalizeEmail, normalizeNickname, validatePassword } from '../utils/validation';
import type {
  AntiCheatChallengeId,
  BlockedApp,
  ExerciseType,
  LanguagePreference,
  LockFitState,
  ThemeName,
  WorkoutLogEntry,
} from '../types/lockfit';
import type { NativeStepCounterSnapshot } from '../native/lockFitNative';

type LockFitContextValue = {
  state: LockFitState;
  register: (payload: {
    email: string;
    password: string;
    nickname: string;
  }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateAccountNickname: (nickname: string) => Promise<void>;
  saveBlockedApps: (apps: BlockedApp[]) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  saveUnlockBonusMinutes: (minutes: number) => Promise<void>;
  saveThemePreference: (themeName: ThemeName) => Promise<void>;
  saveLanguagePreference: (language: LanguagePreference) => Promise<void>;
  saveStepRewardSettings: (payload: {
    stepsPerReward: number;
    stepBonusMinutes: number;
  }) => Promise<void>;
  recordStepSnapshot: (sensorValue: number) => Promise<void>;
  requestStepPermission: () => Promise<boolean>;
  syncStepsFromDevice: () => Promise<NativeStepCounterSnapshot>;
  claimStepBonus: () => Promise<void>;
  refreshAppState: () => Promise<void>;
  refreshUsageFromDevice: () => Promise<void>;
  addDemoUsage: (minutes: number) => Promise<void>;
  addWorkoutBonus: (payload: {
    exerciseType: ExerciseType;
    repetitions: number;
    bonusMinutes: number;
    challengeType: AntiCheatChallengeId;
  }) => Promise<void>;
  openUsageAccessSettings: () => Promise<void>;
  openAccessibilitySettings: () => Promise<void>;
  openOverlaySettings: () => Promise<void>;
};

const initialState: LockFitState = {
  isReady: false,
  initializationError: null,
  isAuthenticated: false,
  onboardingCompleted: false,
  themePreference: 'sand',
  languagePreference: 'system',
  account: null,
  installedApps: [],
  blockedApps: [],
  appUsageSummaries: [],
  totalLimitMinutes: 0,
  unlockBonusMinutes: 15,
  stepsPerReward: 500,
  stepBonusMinutes: 5,
  usageByPackage: [],
  totalUsedMinutes: 0,
  bonusMinutesToday: 0,
  remainingMinutes: 0,
  workoutLog: [],
  stepRewardLog: [],
  todaySteps: {
    dateKey: getLocalDateKey(),
    steps: 0,
    rewardedSteps: 0,
    lastSensorValue: null,
    updatedAt: new Date().toISOString(),
  },
  availableRewardSteps: 0,
  weeklyActivity: {
    startDateKey: getLocalDateKey(),
    endDateKey: getLocalDateKey(),
    activeDays: 0,
    totalSteps: 0,
    totalWorkouts: 0,
    totalRepetitions: 0,
    totalBonusMinutes: 0,
    days: [],
  },
  permissionStatus: {
    usageAccessGranted: false,
    accessibilityGranted: false,
    overlayGranted: false,
  },
  manufacturer: 'generic',
  todayKey: getLocalDateKey(),
};

const LockFitContext = createContext<LockFitContextValue | null>(null);

function toWorkoutId() {
  return `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LockFitProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<LockFitState>(initialState);

  const refreshState = useCallback(async () => {
    const todayKey = getLocalDateKey();
    const [
      deviceSnapshot,
      settings,
      account,
      blockedApps,
      usageByPackage,
      bonusMinutesToday,
      workoutLog,
      stepRewardLog,
      todaySteps,
      weeklyActivity,
    ] = await Promise.all([
      LockFitNative.getDeviceSnapshot(),
      getSettings(),
      getUserAccount(),
      getBlockedApps(),
      getTodayUsage(todayKey),
      getTodayBonusMinutes(todayKey),
      getWorkoutLog(),
      getStepRewardLog(),
      getStepDay(todayKey),
      getWeeklyActivitySummary(),
    ]);

    const usageByPackageMap = new Map(
      usageByPackage.map((record) => [record.packageName, record.usedMinutes]),
    );
    const appUsageSummaries = blockedApps.map((app) => {
      const usedMinutes = usageByPackageMap.get(app.packageName) ?? 0;
      const remainingMinutes = Math.max(0, app.dailyLimitMinutes - usedMinutes);

      return {
        ...app,
        usedMinutes,
        remainingMinutes,
        isLimitReached: usedMinutes >= app.dailyLimitMinutes,
      };
    });
    const totalLimitMinutes = appUsageSummaries.reduce(
      (sum, app) => sum + app.dailyLimitMinutes,
      0,
    );
    const totalUsedMinutes = appUsageSummaries.reduce(
      (sum, app) => sum + app.usedMinutes,
      0,
    );
    const remainingMinutes = Math.max(
      0,
      totalLimitMinutes + bonusMinutesToday - totalUsedMinutes,
    );

    await LockFitNative.syncBlockingConfig(
      account && settings.sessionActive && settings.onboardingCompleted ? blockedApps : [],
    );

    setState({
      isReady: true,
      initializationError: null,
      isAuthenticated: Boolean(account && settings.sessionActive),
      onboardingCompleted: settings.onboardingCompleted,
      themePreference: settings.themePreference,
      languagePreference: settings.languagePreference,
      account,
      installedApps: deviceSnapshot.installedApps,
      blockedApps,
      appUsageSummaries,
      totalLimitMinutes,
      unlockBonusMinutes: settings.unlockBonusMinutes,
      stepsPerReward: settings.stepsPerReward,
      stepBonusMinutes: settings.stepBonusMinutes,
      usageByPackage,
      totalUsedMinutes,
      bonusMinutesToday,
      remainingMinutes,
      workoutLog,
      stepRewardLog,
      todaySteps,
      availableRewardSteps: getAvailableRewardSteps(
        todaySteps.steps,
        todaySteps.rewardedSteps,
      ),
      weeklyActivity,
      permissionStatus: deviceSnapshot.permissionStatus,
      manufacturer: deviceSnapshot.manufacturer,
      todayKey,
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await initializeDatabase();
        await refreshState();
      } catch (error) {
        setState((current) => ({
          ...current,
          isReady: true,
          initializationError:
            error instanceof Error ? error.message : 'Не удалось открыть локальную базу LockFit.',
        }));
      }
    })();
  }, [refreshState]);

  const refreshAppState = useCallback(async () => {
    await initializeDatabase();
    await refreshState();
  }, [refreshState]);

  const syncStepsFromDevice = useCallback<LockFitContextValue['syncStepsFromDevice']>(async () => {
    const snapshot = await LockFitNative.getStepCounterSnapshot();
    if (snapshot.permissionGranted && snapshot.sensorValue !== null) {
      await recordStepSensorValue(snapshot.sensorValue, getLocalDateKey());
      await refreshState();
    }
    return snapshot;
  }, [refreshState]);

  const requestStepPermission = useCallback<LockFitContextValue['requestStepPermission']>(
    async () => {
      const granted = await LockFitNative.requestActivityRecognitionPermission();
      if (granted) {
        await syncStepsFromDevice();
      }
      return granted;
    },
    [syncStepsFromDevice],
  );

  const register = useCallback<LockFitContextValue['register']>(
    async ({ email, password, nickname }) => {
      await registerUserAccount({
        email: normalizeEmail(email),
        password: validatePassword(password),
        nickname: normalizeNickname(nickname),
      });
      await refreshState();
    },
    [refreshState],
  );

  const login = useCallback<LockFitContextValue['login']>(
    async ({ email, password }) => {
      await loginUserAccount({
        email: normalizeEmail(email),
        password: validatePassword(password),
      });
      await refreshState();
    },
    [refreshState],
  );

  const logout = useCallback(async () => {
    await logoutUserAccount();
    await refreshState();
  }, [refreshState]);

  const deleteAccount = useCallback(async () => {
    await deleteLocalAccount();
    await LockFitNative.clearLocalData();
    await refreshState();
  }, [refreshState]);

  const updateAccountNickname = useCallback<
    LockFitContextValue['updateAccountNickname']
  >(
    async (nickname) => {
      await updateNickname(normalizeNickname(nickname));
      await refreshState();
    },
    [refreshState],
  );

  const saveBlockedApps = useCallback<LockFitContextValue['saveBlockedApps']>(
    async (apps) => {
      await replaceBlockedApps(
        apps.map((app) => ({
          ...app,
          dailyLimitMinutes: Math.max(5, Math.round(app.dailyLimitMinutes || 0)),
        })),
      );
      await refreshState();
    },
    [refreshState],
  );

  const finishOnboarding = useCallback(async () => {
    if (state.blockedApps.length === 0) {
      Alert.alert(
        'Нужно выбрать приложения',
        'Сначала добавь хотя бы одно приложение в блокировку.',
      );
      return;
    }

    await saveSettings({ onboardingCompleted: true });
    await refreshState();
  }, [refreshState, state.blockedApps.length]);

  const saveUnlockBonusMinutes = useCallback<
    LockFitContextValue['saveUnlockBonusMinutes']
  >(
    async (minutes) => {
      const safeMinutes = Math.max(5, Math.round(minutes || 0));
      await saveSettings({ unlockBonusMinutes: safeMinutes });
      await refreshState();
    },
    [refreshState],
  );

  const saveThemePreference = useCallback<
    LockFitContextValue['saveThemePreference']
  >(async (themeName) => {
    await saveSettings({ themePreference: themeName });
    await refreshState();
  }, [refreshState]);

  const saveLanguagePreference = useCallback<
    LockFitContextValue['saveLanguagePreference']
  >(async (language) => {
    await saveSettings({ languagePreference: language });
    await refreshState();
  }, [refreshState]);

  const saveStepRewardSettings = useCallback<
    LockFitContextValue['saveStepRewardSettings']
  >(async ({ stepsPerReward, stepBonusMinutes }) => {
    const config = normalizeStepRewardConfig({
      stepsPerReward,
      bonusMinutes: stepBonusMinutes,
    });
    await saveSettings({
      stepsPerReward: config.stepsPerReward,
      stepBonusMinutes: config.bonusMinutes,
    });
    await refreshState();
  }, [refreshState]);

  const recordStepSnapshot = useCallback<LockFitContextValue['recordStepSnapshot']>(
    async (sensorValue) => {
      await recordStepSensorValue(sensorValue, getLocalDateKey());
      await refreshState();
    },
    [refreshState],
  );

  const claimStepBonus = useCallback<LockFitContextValue['claimStepBonus']>(async () => {
    await claimStepReward({
      steps: state.stepsPerReward,
      bonusMinutes: state.stepBonusMinutes,
      dateKey: getLocalDateKey(),
    });
    await refreshState();
  }, [refreshState, state.stepBonusMinutes, state.stepsPerReward]);

  const refreshUsageFromDevice = useCallback(async () => {
    if (state.blockedApps.length === 0) {
      await refreshState();
      return;
    }

    const deviceSnapshot = await LockFitNative.getDeviceSnapshot();
    if (!deviceSnapshot.permissionStatus.usageAccessGranted) {
      await refreshState();
      throw new Error(
        'Сначала выдай LockFit доступ к статистике использования в настройках Android.',
      );
    }

    const usage = await LockFitNative.getTodayUsageByPackage(
      state.blockedApps.map((app) => app.packageName),
    );
    await upsertTodayUsage(usage, getLocalDateKey());
    await refreshState();
  }, [refreshState, state.blockedApps]);

  const addDemoUsage = useCallback(
    async (minutes: number) => {
      const targetPackage =
        state.blockedApps[0]?.packageName ?? state.installedApps[0]?.packageName;

      if (!targetPackage) {
        return;
      }

      await incrementUsageForDemo(targetPackage, minutes, getLocalDateKey());
      await refreshState();
    },
    [refreshState, state.blockedApps, state.installedApps],
  );

  const addWorkoutBonus = useCallback<
    LockFitContextValue['addWorkoutBonus']
  >(
    async ({ exerciseType, repetitions, bonusMinutes, challengeType }) => {
      const entry: WorkoutLogEntry = {
        id: toWorkoutId(),
        completedAt: new Date().toISOString(),
        exerciseType,
        repetitions,
        bonusMinutes,
        challengeType,
      };

      await addWorkoutLogEntry(entry, getLocalDateKey());
      await refreshState();
    },
    [refreshState],
  );

  const value = useMemo<LockFitContextValue>(
    () => ({
      state,
      register,
      login,
      logout,
      deleteAccount,
      updateAccountNickname,
      saveBlockedApps,
      finishOnboarding,
      saveUnlockBonusMinutes,
      saveThemePreference,
      saveLanguagePreference,
      saveStepRewardSettings,
      recordStepSnapshot,
      requestStepPermission,
      syncStepsFromDevice,
      claimStepBonus,
      refreshAppState,
      refreshUsageFromDevice,
      addDemoUsage,
      addWorkoutBonus,
      openUsageAccessSettings: LockFitNative.openUsageAccessSettings,
      openAccessibilitySettings: LockFitNative.openAccessibilitySettings,
      openOverlaySettings: LockFitNative.openOverlaySettings,
    }),
    [
      addDemoUsage,
      addWorkoutBonus,
      finishOnboarding,
      login,
      logout,
      deleteAccount,
      refreshAppState,
      refreshUsageFromDevice,
      register,
      saveBlockedApps,
      saveUnlockBonusMinutes,
      saveThemePreference,
      saveLanguagePreference,
      saveStepRewardSettings,
      recordStepSnapshot,
      requestStepPermission,
      syncStepsFromDevice,
      claimStepBonus,
      state,
      updateAccountNickname,
    ],
  );

  return (
    <LockFitContext.Provider value={value}>{children}</LockFitContext.Provider>
  );
}

export function useLockFit() {
  const context = useContext(LockFitContext);

  if (!context) {
    throw new Error('useLockFit must be used inside LockFitProvider');
  }

  return context;
}
