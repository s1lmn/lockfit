import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { demoInstalledApps } from '../utils/demoInstalledApps';
import type {
  AntiCheatChallengeId,
  AppUsageRecord,
  BlockedApp,
  DeviceSnapshot,
  ExerciseType,
} from '../types/lockfit';

export type NativeExerciseSessionResult = {
  bonusMinutes: number;
  challengeType: AntiCheatChallengeId;
  completedAt: string;
  exerciseType: ExerciseType;
  message: string;
  repetitions: number;
  requiredRepetitions: number;
  status: 'completed' | 'cancelled' | 'failed';
};

export type NativeStepCounterSnapshot = {
  supported: boolean;
  permissionGranted: boolean;
  sensorValue: number | null;
};

type LockFitNativeModuleShape = {
  getDeviceSnapshotAsync?: () => Promise<DeviceSnapshot>;
  getTodayUsageByPackageAsync?: (packageNames: string[]) => Promise<AppUsageRecord[]>;
  getStepCounterSnapshotAsync?: () => Promise<NativeStepCounterSnapshot>;
  openUsageAccessSettingsAsync?: () => Promise<void>;
  openAccessibilitySettingsAsync?: () => Promise<void>;
  openOverlaySettingsAsync?: () => Promise<void>;
  confirmAccessibilityDisclosureAsync?: () => Promise<boolean>;
  syncBlockingConfigAsync?: (apps: BlockedApp[]) => Promise<boolean>;
  hashPasswordAsync?: (password: string) => Promise<string>;
  verifyPasswordAsync?: (password: string, encoded: string) => Promise<boolean>;
  clearLocalDataAsync?: () => Promise<boolean>;
  launchExerciseUnlockAsync?: (
    exerciseType: ExerciseType,
    challengeType: AntiCheatChallengeId,
    requiredRepetitions: number,
    bonusMinutes: number,
    bottomThreshold: number,
    topThreshold: number,
  ) => Promise<boolean>;
  consumePendingExerciseResultAsync?: () => Promise<NativeExerciseSessionResult | null>;
};

const nativeModule =
  requireOptionalNativeModule<LockFitNativeModuleShape>('LockFitNative');

const fallbackSnapshot: DeviceSnapshot = {
  installedApps: demoInstalledApps,
  manufacturer: 'generic',
  permissionStatus: {
    usageAccessGranted: false,
    accessibilityGranted: false,
    overlayGranted: false,
  },
};

function notifyStub(feature: string) {
  Alert.alert(
    'Нужна Android-сборка LockFit',
    `${feature} недоступен в этой сборке. Установи APK или dev client с нативным модулем LockFit.`,
  );
}

export const LockFitNative = {
  async getDeviceSnapshot(): Promise<DeviceSnapshot> {
    if (nativeModule?.getDeviceSnapshotAsync) {
      return nativeModule.getDeviceSnapshotAsync();
    }

    return fallbackSnapshot;
  },

  async getTodayUsageByPackage(packageNames: string[]): Promise<AppUsageRecord[]> {
    if (nativeModule?.getTodayUsageByPackageAsync) {
      return nativeModule.getTodayUsageByPackageAsync(packageNames);
    }

    return packageNames.map((packageName) => ({
      packageName,
      usedMinutes: 0,
    }));
  },

  async requestActivityRecognitionPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || Platform.Version < 29) {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;
    const current = await PermissionsAndroid.check(permission);
    if (current) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission, {
      title: 'Доступ к физической активности',
      message:
        'LockFit использует системный шагомер, чтобы обменивать реальные шаги на время в приложениях.',
      buttonPositive: 'Разрешить',
      buttonNegative: 'Не сейчас',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  },

  async getStepCounterSnapshot(): Promise<NativeStepCounterSnapshot> {
    if (nativeModule?.getStepCounterSnapshotAsync) {
      return nativeModule.getStepCounterSnapshotAsync();
    }

    return {
      supported: false,
      permissionGranted: false,
      sensorValue: null,
    };
  },

  async openUsageAccessSettings(): Promise<void> {
    if (nativeModule?.openUsageAccessSettingsAsync) {
      return nativeModule.openUsageAccessSettingsAsync();
    }

    notifyStub('Экран выдачи Usage Access');
  },

  async openAccessibilitySettings(): Promise<void> {
    if (nativeModule?.openAccessibilitySettingsAsync) {
      return nativeModule.openAccessibilitySettingsAsync();
    }

    notifyStub('Экран включения Accessibility Service');
  },

  async openOverlaySettings(): Promise<void> {
    if (nativeModule?.openOverlaySettingsAsync) {
      return nativeModule.openOverlaySettingsAsync();
    }

    notifyStub('Экран выдачи Overlay permission');
  },

  async confirmAccessibilityDisclosure(): Promise<boolean> {
    if (nativeModule?.confirmAccessibilityDisclosureAsync) {
      return nativeModule.confirmAccessibilityDisclosureAsync();
    }

    notifyStub('Подтверждение Accessibility disclosure');
    return false;
  },

  async syncBlockingConfig(apps: BlockedApp[]): Promise<boolean> {
    if (nativeModule?.syncBlockingConfigAsync) {
      return nativeModule.syncBlockingConfigAsync(apps);
    }

    return false;
  },

  async hashPassword(password: string): Promise<string> {
    if (!nativeModule?.hashPasswordAsync) {
      throw new Error('Безопасное хранение пароля доступно только в Android-сборке LockFit.');
    }
    return nativeModule.hashPasswordAsync(password);
  },

  async verifyPassword(password: string, encoded: string): Promise<boolean> {
    if (!nativeModule?.verifyPasswordAsync) {
      return false;
    }
    return nativeModule.verifyPasswordAsync(password, encoded);
  },

  async clearLocalData(): Promise<boolean> {
    if (nativeModule?.clearLocalDataAsync) {
      return nativeModule.clearLocalDataAsync();
    }
    return false;
  },

  async launchExerciseUnlock(payload: {
    exerciseType: ExerciseType;
    challengeType: AntiCheatChallengeId;
    requiredRepetitions: number;
    bonusMinutes: number;
    bottomThreshold: number;
    topThreshold: number;
  }): Promise<boolean> {
    if (nativeModule?.launchExerciseUnlockAsync) {
      return nativeModule.launchExerciseUnlockAsync(
        payload.exerciseType,
        payload.challengeType,
        payload.requiredRepetitions,
        payload.bonusMinutes,
        payload.bottomThreshold,
        payload.topThreshold,
      );
    }

    notifyStub('Нативная exercise camera session');
    return false;
  },

  async consumePendingExerciseResult(): Promise<NativeExerciseSessionResult | null> {
    if (nativeModule?.consumePendingExerciseResultAsync) {
      return nativeModule.consumePendingExerciseResultAsync();
    }

    return null;
  },
};
