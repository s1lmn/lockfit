import type { ExerciseType } from '../../types/lockfit';

type Point = {
  x: number;
  y: number;
};

export type CounterSnapshot = {
  repetitions: number;
  phase: 'top' | 'bottom';
  countedOnFrame: boolean;
};

export type ExercisePreset = {
  type: ExerciseType;
  label: string;
  bottomThreshold: number;
  topThreshold: number;
  requiredRepetitions: number;
  bonusMinutes: number;
};

export const exercisePresets: Record<ExerciseType, ExercisePreset> = {
  pushups: {
    type: 'pushups',
    label: 'Отжимания',
    bottomThreshold: 75,
    topThreshold: 155,
    requiredRepetitions: 10,
    bonusMinutes: 15,
  },
  squats: {
    type: 'squats',
    label: 'Приседания',
    bottomThreshold: 95,
    topThreshold: 165,
    requiredRepetitions: 12,
    bonusMinutes: 15,
  },
};

export function calculateAngleDegrees(first: Point, middle: Point, last: Point): number {
  const radians =
    Math.atan2(last.y - middle.y, last.x - middle.x) -
    Math.atan2(first.y - middle.y, first.x - middle.x);

  const degrees = Math.abs((radians * 180) / Math.PI);
  return degrees > 180 ? 360 - degrees : degrees;
}

export function createRepCounter(preset: ExercisePreset) {
  let repetitions = 0;
  let phase: 'top' | 'bottom' = 'top';

  return {
    pushAngle(angle: number): CounterSnapshot {
      let countedOnFrame = false;

      if (phase === 'top' && angle <= preset.bottomThreshold) {
        phase = 'bottom';
      } else if (phase === 'bottom' && angle >= preset.topThreshold) {
        phase = 'top';
        repetitions += 1;
        countedOnFrame = true;
      }

      return { repetitions, phase, countedOnFrame };
    },
    reset(): CounterSnapshot {
      repetitions = 0;
      phase = 'top';
      return { repetitions, phase, countedOnFrame: false };
    },
  };
}
