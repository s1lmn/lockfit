# LockFit architecture notes

This document is written in simple language on purpose. It started as a first map before the Kotlin implementation, and now also describes the first working Android-native exercise flow.

## 1. File structure plan

```text
LockFit/
  App.tsx
  app.json
  src/
    components/
      Card.tsx
      Screen.tsx
    features/
      exercise/
        antiCheat.ts
        repetitionCounter.ts
    navigation/
      RootNavigator.tsx
    native/
      lockFitNative.ts
    providers/
      LockFitProvider.tsx
    screens/
      OnboardingScreen.tsx
      HomeScreen.tsx
      LockScreen.tsx
      ExerciseScreen.tsx
      BatteryOptimizationScreen.tsx
    storage/
      database.ts
      repositories.ts
    theme/
      palette.ts
    types/
      lockfit.ts
    utils/
      battery.ts
      date.ts
      demoInstalledApps.ts
      format.ts
  docs/
    lockfit-architecture.md
```

## 2. What each screen does

- `OnboardingScreen`
  - user picks apps to block
  - user sets the daily limit in minutes
  - user is guided to three special Android settings screens
- `HomeScreen`
  - shows how much time is left today
  - shows per-app usage
  - shows workout history
- `LockScreen`
  - will become the full-screen overlay shown above a blocked app
  - currently acts as a visual prototype inside React Navigation
- `ExerciseScreen`
  - launches the real Android camera session
  - receives exercise results back from the native side
- `BatteryOptimizationScreen`
  - explains vendor-specific steps for keeping the guard service alive

## 3. Local storage design

We use SQLite because the app has structured local data and we will read/write it often.

Tables:

- `settings`
  - `daily_limit_minutes`
  - `unlock_bonus_minutes`
- `blocked_apps`
  - saved package names selected in onboarding
- `daily_usage`
  - one row per day and per package
  - stores minutes used for the current day
- `daily_bonus`
  - total bonus minutes granted today by workouts
- `workout_log`
  - date, exercise type, repetitions, anti-cheat challenge, granted bonus

Daily reset is simple:

- we do not "wipe the database at midnight"
- instead we store every value under `YYYY-MM-DD`
- when the date changes on the phone, the app starts reading a new day key automatically

## 4. Android native architecture

We will split the Android-native side into two bundles of responsibility:

### Module A: `LockFitUsageModule`

Purpose:

- list installed launchable apps with `PackageManager`
- read today's usage for selected package names with `UsageStatsManager`
- open the Android settings screen where the user grants usage access

JS methods planned:

- `getDeviceSnapshotAsync()`
- `getTodayUsageByPackageAsync(packageNames)`
- `openUsageAccessSettingsAsync()`

Android APIs:

- `PackageManager`
- `UsageStatsManager`
- `AppOpsManager` to verify whether usage access is granted
- `Settings.ACTION_USAGE_ACCESS_SETTINGS`

### Module B: `LockFitGuardModule` + `LockFitAccessibilityService`

Purpose:

- detect when a blocked app becomes foreground
- compare that package with the locally saved blocked list and today's remaining time
- if the limit is exhausted, show a full-screen overlay
- route the user into the React Native exercise screen

Main Android pieces:

- `AccessibilityService`
- shared storage between JS and service
- overlay launcher
- intent to bring the app to the `ExerciseScreen`

Android APIs:

- `AccessibilityService`
- `AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED`
- `Settings.ACTION_ACCESSIBILITY_SETTINGS`
- `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`
- overlay window through `SYSTEM_ALERT_WINDOW`

### Current native exercise flow

The first working exercise unlock flow is now implemented as a dedicated Android activity:

- `ExerciseUnlockActivity`
  - opens the front camera through CameraX
  - sends frames into ML Kit Pose Detection in `STREAM_MODE`
  - checks that the body is large enough and centered enough in frame
  - asks for one anti-cheat gesture before counting starts
  - counts push-ups by elbow angle
  - counts squats by knee angle
  - saves the session result into shared preferences so React Native can consume it when the user returns

Support files:

- `ExerciseSessionStore`
  - stores the last native exercise result until JS reads it
- `LockFitNativeModule`
  - opens the exercise activity
  - returns the pending exercise result back to React Native

### How repetition counting works right now

- the user must first enter a clear top position
- the app waits for several stable frames before accepting that start position
- then the app waits for the angle to cross the lower threshold for several frames
- then it waits for the angle to cross back above the upper threshold for several frames
- only after the full cycle does it count one repetition

This extra stability layer is important because raw landmark coordinates can jump a bit from frame to frame.

## 5. Permissions the user must grant manually

These are not normal runtime permissions, so Android does not show the usual small popup.

### A. Usage access

Why we need it:

- without it, LockFit cannot know how many minutes the user already spent in Instagram, TikTok, YouTube, and other blocked apps today

How to request:

- open `Settings.ACTION_USAGE_ACCESS_SETTINGS`
- show a short instruction card before opening system settings
- ask the user to find `LockFit` in the list and toggle access on

Friendly onboarding copy:

- "LockFit needs app usage access only to count time spent in the apps you choose. We do not need your messages or passwords."

### B. Accessibility service

Why we need it:

- without it, LockFit will not know that a blocked app is currently on screen
- it is the only reliable way to react immediately when the user opens Instagram or TikTok

How to request:

- open `Settings.ACTION_ACCESSIBILITY_SETTINGS`
- show a clear explanation first because this permission can sound scary
- tell the user exactly what they will see: `Downloaded apps -> LockFit -> On`

Friendly onboarding copy:

- "Android asks for a powerful permission here. LockFit uses it only to detect which app is open and to place the lock screen at the right moment."

### C. Overlay permission

Why we need it:

- without it, the app cannot show a full-screen blocker above the social app

How to request:

- open `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`
- ask the user to allow `Display over other apps`

Friendly onboarding copy:

- "This lets LockFit place the lock screen above the blocked app. It does not let LockFit control other apps."

## 6. Recommended onboarding order

The order matters because it feels less scary:

1. Show the goal in plain words:
   - "Pick the apps you want to limit."
2. Let the user choose apps and daily limit first.
3. Ask for `Usage access` second:
   - easiest to explain
   - low emotional friction
4. Ask for `Accessibility` third:
   - only after the user already understands the benefit
5. Ask for `Overlay` fourth:
   - tied to the visual lock screen concept
6. Show `Battery optimization` advice last:
   - helpful, but not a hard blocker for first-run success

## 7. Manual testing notes

- Test on a real Android phone, not an emulator.
- For local development build install:
  - enable Developer options
  - enable USB debugging
- Use sideloaded APK or `expo run:android` with a dev client.
- For the Accessibility and overlay flow, verify behavior after the phone sits idle for 15-30 minutes.
- For the exercise flow, test in both good and mediocre light, and from at least two distances.
