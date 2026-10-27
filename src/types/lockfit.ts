export type ExerciseType = 'pushups' | 'squats';
export type ActivityType = ExerciseType | 'steps';
export type ThemeName = 'sand' | 'midnight';
export type LanguagePreference =
  | 'system'
  | 'en'
  | 'ru'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'hi'
  | 'ar';

export type AntiCheatChallengeId = 'open-palm' | 'wave-hand' | 'touch-shoulder';

export type InstalledApp = {
  packageName: string;
  appName: string;
};

export type UserAccount = {
  email: string;
  nickname: string;
  createdAt: string;
};

export type BlockedApp = InstalledApp & {
  dailyLimitMinutes: number;
};

export type AppUsageRecord = {
  packageName: string;
  usedMinutes: number;
};

export type AppUsageSummary = BlockedApp & {
  usedMinutes: number;
  remainingMinutes: number;
  isLimitReached: boolean;
};

export type WorkoutLogEntry = {
  id: string;
  completedAt: string;
  exerciseType: ExerciseType;
  repetitions: number;
  bonusMinutes: number;
  challengeType: AntiCheatChallengeId;
};

export type StepDayRecord = {
  dateKey: string;
  steps: number;
  rewardedSteps: number;
  lastSensorValue: number | null;
  updatedAt: string;
};

export type StepRewardLogEntry = {
  id: string;
  completedAt: string;
  steps: number;
  bonusMinutes: number;
};

export type WeeklyActivityDay = {
  dateKey: string;
  steps: number;
  workouts: number;
  repetitions: number;
  bonusMinutes: number;
};

export type WeeklyActivitySummary = {
  startDateKey: string;
  endDateKey: string;
  activeDays: number;
  totalSteps: number;
  totalWorkouts: number;
  totalRepetitions: number;
  totalBonusMinutes: number;
  days: WeeklyActivityDay[];
};

export type PermissionStatus = {
  usageAccessGranted: boolean;
  accessibilityGranted: boolean;
  overlayGranted: boolean;
};

export type DeviceSnapshot = {
  installedApps: InstalledApp[];
  permissionStatus: PermissionStatus;
  manufacturer: string;
};

export type LockFitState = {
  isReady: boolean;
  initializationError: string | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  themePreference: ThemeName;
  languagePreference: LanguagePreference;
  account: UserAccount | null;
  installedApps: InstalledApp[];
  blockedApps: BlockedApp[];
  appUsageSummaries: AppUsageSummary[];
  totalLimitMinutes: number;
  unlockBonusMinutes: number;
  stepsPerReward: number;
  stepBonusMinutes: number;
  usageByPackage: AppUsageRecord[];
  totalUsedMinutes: number;
  bonusMinutesToday: number;
  remainingMinutes: number;
  workoutLog: WorkoutLogEntry[];
  stepRewardLog: StepRewardLogEntry[];
  todaySteps: StepDayRecord;
  availableRewardSteps: number;
  weeklyActivity: WeeklyActivitySummary;
  permissionStatus: PermissionStatus;
  manufacturer: string;
  todayKey: string;
};
