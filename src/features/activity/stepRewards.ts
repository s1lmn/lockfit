export type StepRewardConfig = {
  stepsPerReward: number;
  bonusMinutes: number;
};

export function normalizeStepRewardConfig(config: StepRewardConfig): StepRewardConfig {
  return {
    stepsPerReward: Number.isFinite(config.stepsPerReward)
      ? Math.min(100_000, Math.max(100, Math.round(config.stepsPerReward)))
      : 500,
    bonusMinutes: Number.isFinite(config.bonusMinutes)
      ? Math.min(240, Math.max(1, Math.round(config.bonusMinutes)))
      : 5,
  };
}

export function calculateStepDelta(
  previousSensorValue: number | null,
  currentSensorValue: number,
): number {
  if (!Number.isFinite(currentSensorValue)) return 0;
  const current = Math.max(0, Math.floor(currentSensorValue));

  if (previousSensorValue === null) {
    return 0;
  }

  if (!Number.isFinite(previousSensorValue)) return 0;
  const previous = Math.max(0, Math.floor(previousSensorValue));
  return current >= previous ? current - previous : 0;
}

export function getAvailableRewardSteps(totalSteps: number, rewardedSteps: number): number {
  return Math.max(0, Math.floor(totalSteps) - Math.floor(rewardedSteps));
}

export function getClaimableRewardCount(
  availableSteps: number,
  stepsPerReward: number,
): number {
  return Math.floor(
    Math.max(0, availableSteps) / Math.max(1, Math.floor(stepsPerReward)),
  );
}

export function getStepRewardProgress(
  availableSteps: number,
  stepsPerReward: number,
): number {
  const threshold = Math.max(1, Math.floor(stepsPerReward));
  return Math.min(1, (Math.max(0, availableSteps) % threshold) / threshold);
}
