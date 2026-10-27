export type NativeInstalledApp = {
  packageName: string;
  appName: string;
};

export type NativePermissionStatus = {
  usageAccessGranted: boolean;
  accessibilityGranted: boolean;
  overlayGranted: boolean;
};

export type NativeDeviceSnapshot = {
  installedApps: NativeInstalledApp[];
  permissionStatus: NativePermissionStatus;
  manufacturer: string;
};

export type NativeUsageRecord = {
  packageName: string;
  usedMinutes: number;
};

export type NativeExerciseSessionResult = {
  bonusMinutes: number;
  challengeType: string;
  completedAt: string;
  exerciseType: string;
  message: string;
  repetitions: number;
  requiredRepetitions: number;
  status: 'completed' | 'cancelled' | 'failed';
};
