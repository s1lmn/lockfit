# LockFit

`LockFit` is an Android-only React Native app built with Expo development builds. The app blocks selected social apps after the daily limit is exhausted, then asks the user to unlock access through a short exercise session.

## Current status

The repository now includes:

- Expo dev client project scaffold
- React Navigation flow
- onboarding, home, lock, exercise, and battery-optimization screens
- local SQLite storage for settings, blocked apps, usage snapshots, and workout logs
- Android native module for installed apps, usage stats, and system-permission deep links
- Android native camera session with ML Kit pose detection for push-ups and squats
- anti-cheat gesture checks before exercise counting
- live debug overlay in the camera session for angle, pose quality, and challenge progress
- architecture notes and a field test plan in `docs/`

## Field test documents

- [Architecture notes](docs/lockfit-architecture.md)
- [Field test plan](docs/lockfit-field-test-plan.md)

## Manual setup

1. Install Android Studio with the Android SDK and platform tools.
2. On a real Android phone, enable Developer options:
   - Open `Settings -> About phone`
   - Tap `Build number` 7 times
3. Turn on `USB debugging` in `Developer options`.
4. Connect the phone by USB and confirm the trust dialog on the device.
5. Install dependencies:

```bash
PATH=/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm install
```

6. Generate the native Android project:

```bash
PATH=/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm expo prebuild --platform android
```

7. Build and install the dev client on the phone:

```bash
PATH=/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm expo run:android
```

8. Start Metro:

```bash
PATH=/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/s1lm3n/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm expo start --dev-client
```

## Why a real phone is required

- `UsageStatsManager` needs actual app usage history.
- `AccessibilityService` must observe real foreground apps.
- overlay permission and battery optimization behavior are not realistic in the emulator.
- the camera + pose detection flow should be tested on an actual device with real lighting and distance.
