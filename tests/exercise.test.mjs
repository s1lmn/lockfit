import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateAngleDegrees,
  createRepCounter,
  exercisePresets,
} from '../src/features/exercise/repetitionCounter.ts';
import {
  antiCheatChallenges,
  pickRandomChallenge,
} from '../src/features/exercise/antiCheat.ts';
import {
  calculateStepDelta,
  getAvailableRewardSteps,
  getClaimableRewardCount,
  normalizeStepRewardConfig,
} from '../src/features/activity/stepRewards.ts';
import { resolveLanguage } from '../src/i18n/locale.ts';
import { themes } from '../src/theme/palette.ts';
import { contrastRatio } from '../src/theme/contrast.ts';
import {
  coerceInteger,
  normalizeBlockedApps,
  normalizeEmail,
  normalizeLanguage,
  normalizeNickname,
  validatePassword,
} from '../src/utils/validation.ts';
import {
  normalizeStepRewardClaim,
  normalizeStepSensorValue,
  normalizeWorkoutEntry,
} from '../src/utils/activityValidation.ts';

test('calculateAngleDegrees returns a straight and a right angle', () => {
  assert.equal(
    calculateAngleDegrees(
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ),
    180,
  );
  assert.equal(
    calculateAngleDegrees(
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ),
    90,
  );
});

test('rep counter counts only a full bottom-to-top cycle', () => {
  const counter = createRepCounter(exercisePresets.pushups);

  assert.equal(counter.pushAngle(160).repetitions, 0);
  assert.equal(counter.pushAngle(110).repetitions, 0);
  assert.equal(counter.pushAngle(74).phase, 'bottom');
  assert.equal(counter.pushAngle(120).repetitions, 0);

  const completed = counter.pushAngle(156);
  assert.equal(completed.repetitions, 1);
  assert.equal(completed.countedOnFrame, true);
  assert.equal(completed.phase, 'top');
});

test('rep counter rejects repeated half movements', () => {
  const counter = createRepCounter(exercisePresets.squats);

  for (const angle of [165, 130, 110, 130, 165, 120, 100, 150, 166]) {
    assert.equal(counter.pushAngle(angle).repetitions, 0);
  }
});

test('random anti-cheat challenge always comes from the supported list', () => {
  const supportedIds = new Set(antiCheatChallenges.map((challenge) => challenge.id));

  for (let index = 0; index < 50; index += 1) {
    assert.equal(supportedIds.has(pickRandomChallenge().id), true);
  }
});

test('step rewards never count the same sensor value twice', () => {
  assert.equal(calculateStepDelta(null, 12_000), 0);
  assert.equal(calculateStepDelta(12_000, 12_340), 340);
  assert.equal(calculateStepDelta(12_340, 12_340), 0);
});

test('step counter reset cannot create fake steps', () => {
  assert.equal(calculateStepDelta(25_000, 120), 0);
  assert.equal(calculateStepDelta(120, 170), 50);
});

test('only unrewarded steps can be claimed', () => {
  const available = getAvailableRewardSteps(1_760, 1_000);
  assert.equal(available, 760);
  assert.equal(getClaimableRewardCount(available, 500), 1);
  assert.equal(getAvailableRewardSteps(200, 500), 0);
});

test('step reward settings are normalized to safe minimums', () => {
  assert.deepEqual(
    normalizeStepRewardConfig({ stepsPerReward: 20, bonusMinutes: 0 }),
    { stepsPerReward: 100, bonusMinutes: 1 },
  );
});

test('system language resolves supported Android locales and falls back to English', () => {
  assert.equal(resolveLanguage('system', 'ru-RU'), 'ru');
  assert.equal(resolveLanguage('system', 'zh-Hans-CN'), 'zh');
  assert.equal(resolveLanguage('system', 'tr-TR'), 'en');
  assert.equal(resolveLanguage('de', 'ru-RU'), 'de');
});

test('both themes keep primary text and buttons readable', () => {
  for (const theme of Object.values(themes)) {
    assert.equal(contrastRatio(theme.textPrimary, theme.surface) >= 4.5, true);
    assert.equal(contrastRatio(theme.accent, theme.accentContrast) >= 4.5, true);
    assert.equal(contrastRatio(theme.surfaceStrong, theme.accentContrast) >= 4.5, true);
  }
});

test('credentials are normalized and weak values are rejected', () => {
  assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com');
  assert.equal(normalizeNickname('  Alex   Fit  '), 'Alex Fit');
  assert.equal(validatePassword('correct horse'), 'correct horse');
  assert.throws(() => normalizeEmail('not-an-email'));
  assert.throws(() => validatePassword('short'));
  assert.throws(() => normalizeNickname('x'));
});

test('blocked apps are deduplicated and limits stay inside one day', () => {
  assert.deepEqual(
    normalizeBlockedApps([
      { packageName: 'com.example.social', appName: ' Social ', dailyLimitMinutes: -2 },
      { packageName: 'invalid', appName: 'Bad', dailyLimitMinutes: 20 },
      { packageName: 'com.example.social', appName: 'Social 2', dailyLimitMinutes: 2_000 },
    ]),
    [{ packageName: 'com.example.social', appName: 'Social 2', dailyLimitMinutes: 1_440 }],
  );
  assert.equal(coerceInteger(Number.NaN, 1, 10, 4), 4);
});

test('invalid persisted language safely falls back to system', () => {
  assert.equal(normalizeLanguage('broken'), 'system');
  assert.equal(normalizeLanguage('ja'), 'ja');
});

test('activity records reject non-finite and forged native values', () => {
  assert.throws(() => normalizeStepSensorValue(Number.POSITIVE_INFINITY));
  assert.throws(() => normalizeStepRewardClaim({ steps: Number.NaN, bonusMinutes: 5 }));
  assert.throws(() =>
    normalizeWorkoutEntry({
      id: 'forged',
      completedAt: new Date().toISOString(),
      exerciseType: 'burpees',
      repetitions: 10,
      bonusMinutes: 15,
      challengeType: 'wave-hand',
    }),
  );
});

test('activity rewards are capped before persistence', () => {
  assert.deepEqual(
    normalizeStepRewardConfig({ stepsPerReward: 1_000_000, bonusMinutes: 1_000 }),
    { stepsPerReward: 100_000, bonusMinutes: 240 },
  );
  assert.deepEqual(
    normalizeStepRewardClaim({ steps: 1_000_000, bonusMinutes: 1_000 }),
    { steps: 100_000, bonusMinutes: 240 },
  );
  assert.equal(normalizeStepSensorValue(123.9), 123);
});
