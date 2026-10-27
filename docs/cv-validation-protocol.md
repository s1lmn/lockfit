# LockFit computer-vision validation protocol

This protocol is the release gate for exercise recognition. Unit tests prove that the math and state machines behave as designed; they do not prove accuracy on real people, phones, clothing, rooms, or body types.

## Privacy boundary

- Ask every tester for explicit consent before a session.
- Do not record, upload, or retain camera frames by default.
- Record only anonymous totals and device/environment labels in the results sheet.
- If a diagnostic video is ever needed, use a separate opt-in consent, keep it local, set a deletion date, and never include a face when a body-only crop is sufficient.

## Test matrix

Use at least five adult testers with varied height, build, clothing, and exercise familiarity. Cover at least three Android performance tiers and both common camera orientations supported by the UI.

For every exercise, collect at least 100 labeled valid repetitions and 100 labeled invalid attempts across the complete matrix:

- good, moderate, and dim-but-usable light
- plain and visually busy backgrounds
- fitted and loose clothing
- 15-20 FPS stressed device, about 30 FPS normal device, and higher-FPS device
- left and right body side toward the camera
- correct distance, too close, too far, and partially cropped body

## Positive scenarios

- Full push-up: stable plank, elbow passes the lower threshold, then returns to full extension.
- Full squat: upright start, knee passes the lower threshold, then returns to full extension.
- Deliberately slow and normal-tempo repetitions within the accepted 0.65-12 second window.
- A brief landmark loss shorter than the tracking grace period.

## Negative scenarios

- No person, two people, printed person, and a person shown on another screen.
- Head, active joint, hip, or ankle outside the frame.
- Front-facing stance when a side view is requested.
- Half repetitions, bouncing near a threshold, static holds, and one-frame landmark spikes.
- A repetition faster than 0.65 seconds or slower than 12 seconds.
- Static raised hand, one-way hand movement, moving the phone with the hand still, and switching hands midway through the anti-cheat gesture.

## Ground truth

One observer labels each attempt as valid or invalid using the written form rules. A second observer independently reviews every disagreement and a random 20% sample. Change thresholds only after reviewing labeled failures, never to make one tester's session look better.

## Metrics

- `true positive`: a valid repetition counted exactly once
- `false negative`: a valid repetition not counted
- `false positive`: an invalid attempt or rest movement counted
- `precision = TP / (TP + FP)`
- `recall = TP / (TP + FN)`
- `count error = abs(counted - valid ground truth)`
- anti-cheat false accept and false reject rates are measured separately

## MVP release gates

- Repetition recall is at least 95% in good light for each exercise.
- Repetition false-positive rate is below 2% across all invalid attempts.
- No repetitions are counted in no-person, two-person, missing-head, or low-confidence scenarios.
- The same prerecorded landmark trace produces the same count when resampled to 15, 30, and 60 FPS.
- Anti-cheat never passes a static hand, camera translation, or hand-switch sequence in the test set.
- Every failed frame gives an actionable placement/form hint and recovers without restarting the app.

Do not describe the recognizer as "perfect" or store-ready until this matrix has passed on physical devices. ML Kit Pose Detection is a single-person beta API, so results must also be repeated when its model version changes.
