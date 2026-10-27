# LockFit field test plan

This plan is written for real Android phone testing on July 21, 2026 and later. The goal is simple: quickly understand where the exercise unlock flow already feels solid and where it still produces weak or confusing behavior.

## 1. Before testing

Use a real Android phone, not an emulator.

Prepare this setup:

1. Install the latest LockFit dev build that includes the native camera session.
2. Give camera permission.
3. Stand the phone up so it does not shake.
4. Leave roughly 1.5 to 2 meters between the phone and the person.
5. Use a room with visible full-body light first. Only after that move to harder conditions.

## 2. What the tester should understand

Tell each tester this in plain language:

- "Stand sideways to the camera."
- "Keep your whole body in frame."
- "Do the mini gesture first."
- "Then do full clean reps, not half reps."

If the tester does not understand that, the result is not useful, because we are testing recognition quality, not guessing behavior.

## 3. Core success scenarios

Run each case 3 times.

### A. Push-ups, ideal conditions

1. Good room light.
2. Phone fixed in one place.
3. Person stands sideways.
4. Person completes the anti-cheat challenge.
5. Person performs slow full push-ups.

Expected:

- the body is accepted in frame within a few seconds
- the anti-cheat challenge completes without weird retries
- only full push-ups are counted
- no extra repetitions appear while the person is resting

### B. Squats, ideal conditions

1. Same setup as above.
2. Person performs slow full squats.

Expected:

- top position is recognized before the first rep
- shallow squats should be rejected more often than full squats
- full squats should count consistently

## 4. False-positive tests

These are as important as success tests.

### A. No person in frame

Expected:

- LockFit should not start any challenge progress
- LockFit should not count any repetitions

### B. Person faces camera front-on instead of sideways

Expected:

- the app should keep asking the user to turn sideways
- repetitions should not count reliably from the wrong pose

### C. Half reps

Run:

- half push-ups
- half squats

Expected:

- some may approach thresholds, but repeated half reps should count much less often than full reps

### D. Random arm movement after challenge

Expected:

- random hand motion should not create squat reps
- random torso movement should not create push-up reps

### E. Replaying a video on another screen

Expected:

- the mini challenge should fail more often than with a real person
- even if pose points appear, behavior should feel worse than live performance

Note:

- current anti-cheat is still MVP level. This case is important to measure, not to assume perfect defense yet.

## 5. Hard-condition tests

Run each case at least once after ideal-condition tests.

### A. Slightly dim light

Expected:

- body lock may become slower
- debug overlay should help explain whether landmarks are being lost

### B. Person too close

Expected:

- the app should ask the tester to step back

### C. Person too far

Expected:

- the app should ask the tester to come closer or note that the body is too small

### D. Person not centered

Expected:

- the app should ask the tester to move to the center

## 6. What to write down after every run

For each run, capture these notes:

- exercise type
- phone model
- Android version
- room light: good / okay / bad
- distance: near / medium / far
- result: success / weak / failed
- counted reps vs real reps
- whether the anti-cheat challenge felt fair
- whether the on-screen debug text clearly explained the problem

## 7. Quick pass/fail rubric

Treat the build as "good enough for wider friend testing" only if these are true:

- in good light, full reps count correctly in most runs
- in good light, obvious half reps are usually rejected
- no accidental rep counting happens while standing still
- the debug overlay gives actionable hints instead of vague failure

Treat the build as "needs more tuning first" if any of these happen often:

- extra repetitions while resting
- start position rarely locks
- sideways stance is required, but the app does not explain that clearly
- challenge completion feels random

## 8. Best tester script

Give this script to a friend:

1. "Open the exercise screen."
2. "Choose push-ups."
3. "Read the mini challenge and do it."
4. "Do 5 slow clean reps."
5. "Do 5 shallow fake reps."
6. "Switch to squats."
7. "Repeat the same pattern."
8. "Tell me exactly where the app felt unfair or dumb."

## 9. What to improve next based on results

If push-ups undercount:

- lower the top threshold slightly
- reduce strictness of start-position locking

If push-ups overcount:

- increase stable-frame requirements
- increase cooldown between counted reps

If squats undercount:

- relax the lower angle threshold a bit
- improve side selection between left and right leg

If squats overcount:

- require deeper bottom angle
- tighten the upright / side-view checks

If anti-cheat feels weak:

- add hand landmark detection for a real open-palm check
- add a short temporal gesture classifier instead of simple frame heuristics
