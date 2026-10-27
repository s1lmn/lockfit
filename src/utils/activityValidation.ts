import type { StepRewardLogEntry, WorkoutLogEntry } from '../types/lockfit';
import { coerceInteger } from './validation.ts';

export function normalizeStepSensorValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Шагомер вернул некорректное значение.');
  }
  return Math.floor(value);
}

export function normalizeWorkoutEntry(entry: WorkoutLogEntry): WorkoutLogEntry {
  if (entry.exerciseType !== 'pushups' && entry.exerciseType !== 'squats') {
    throw new Error('Неизвестный тип упражнения.');
  }
  if (entry.challengeType !== 'wave-hand' && entry.challengeType !== 'touch-shoulder') {
    throw new Error('Неизвестный anti-cheat челлендж.');
  }
  if (!entry.id || !Number.isFinite(Date.parse(entry.completedAt))) {
    throw new Error('Некорректная запись тренировки.');
  }

  return {
    ...entry,
    repetitions: coerceInteger(entry.repetitions, 1, 100, 1),
    bonusMinutes: coerceInteger(entry.bonusMinutes, 1, 240, 1),
  };
}

export function normalizeStepRewardClaim(payload: {
  steps: number;
  bonusMinutes: number;
}): Pick<StepRewardLogEntry, 'steps' | 'bonusMinutes'> {
  if (!Number.isFinite(payload.steps) || !Number.isFinite(payload.bonusMinutes)) {
    throw new Error('Некорректные параметры награды за шаги.');
  }
  return {
    steps: coerceInteger(payload.steps, 1, 100_000, 1),
    bonusMinutes: coerceInteger(payload.bonusMinutes, 1, 240, 1),
  };
}
