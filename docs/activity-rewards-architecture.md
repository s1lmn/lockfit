# LockFit activity and reward model

## Reward sources

- Push-ups and squats grant the configured workout bonus only after the native camera session finishes successfully.
- Walking grants the configured step bonus for each complete block of new steps. The default is 500 steps for 5 minutes.
- All granted minutes are added to `daily_bonus`, so the home screen and future blocker use one reward balance.

## Step integrity

Android's step-counter sensor reports a cumulative value since the last reboot. LockFit stores:

- today's accepted step total;
- the last cumulative sensor value;
- how many of today's steps were already exchanged for time.

Only a positive difference between two sensor readings is accepted. A lower value is treated as a phone reboot and grants zero steps for that transition. Claiming a reward updates used steps, the reward log, and daily bonus in one SQLite transaction.

## Weekly result

The weekly summary always covers the current local day and the six previous local dates. It combines:

- accepted steps from `step_daily`;
- workouts and repetitions from `workout_log`;
- all granted minutes from `daily_bonus`.

Using local date keys avoids a destructive midnight reset and keeps past days available for history.

## Language setting

`language_preference` starts as `system`. Supported manual choices are English, Russian, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Hindi, and Arabic. The localization layer will resolve `system` to the closest supported device language.

## Known sensor boundary

If LockFit receives its first-ever sensor reading in the middle of a day, it uses that reading as a safe baseline and does not retroactively grant steps. This prevents fake rewards. Continuous daily capture is handled by the Android pedometer integration stage.
