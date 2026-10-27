# LockFit MVP and store-readiness audit

Date: 2026-07-30

## Product boundary

LockFit is an Android digital-wellbeing app. Camera frames and pose landmarks are processed on
device and must never be stored or transmitted. The app is not a medical product, does not identify
people, and must not claim perfect recognition or health outcomes.

## Official constraints

- ML Kit Pose Detection tracks 33 landmarks for the most prominent single person. The official
  model card lists repetition counting as an intended use, but excludes multiple people, hidden
  heads, people farther than about four metres, identity recognition, surveillance, and metrically
  accurate depth.
- The model needs a centered full body with margin, sufficient pixel area, stable orientation and
  reasonable lighting. Noise, motion blur, occlusion and extreme lighting increase landmark jitter.
- `STREAM_MODE` and the base model are the documented real-time path. The accurate model is slower;
  it should only replace the base model after measured device testing proves the trade-off useful.
- Accessibility API use must be narrow, deterministic, disclosed in the app and Play listing, and
  accepted by an affirmative user action. LockFit is not an accessibility tool and must never set
  `isAccessibilityTool=true`.
- New Google Play apps are uploaded as Android App Bundles signed by a private upload key. A debug
  certificate is never a production release credential.

Official references:

- https://developers.google.com/ml-kit/vision/pose-detection/android
- https://developers.google.com/ml-kit/images/vision/pose-detection/pose_model_card.pdf
- https://support.google.com/googleplay/android-developer/answer/10964491
- https://support.google.com/googleplay/android-developer/answer/10144311
- https://developer.android.com/studio/publish/app-signing

## Risk closure status

| Priority | Risk | Status |
| --- | --- | --- |
| P0 | Password stored as plaintext in SQLite | Closed: salted PBKDF2, constant-time comparison, legacy migration and negative tests |
| P0 | Release variant uses Android debug certificate | Closed: friend-only debug signing; release requires a private upload key |
| P0 | Accessibility blocking service missing | Closed: narrow detector, explicit consent, private service and decision tests |
| P0 | No real-device CV benchmark | Open: complete the labelled protocol before quality claims or store rollout |
| P1 | Android backup exposes local data | Closed: backup and data extraction disabled in source and packaged manifests |
| P1 | Local account has no deletion path | Closed: in-app deletion clears SQLite and native state |
| P1 | Privacy and Accessibility disclosures absent | Partial: repository documents exist; public HTTPS pages and Play assets remain |
| P1 | Broad overlay permission requested | Closed: System Alert Window removed; accessibility-scoped overlay only |
| P1 | Camera can be screen-recorded during anti-cheat | Closed: `FLAG_SECURE` on exercise and blocking windows |
| P1 | Validation only exists in UI | Closed: repository/native validation and forged-value tests |
| P2 | ML Kit Pose API is beta | Accepted: pinned behind native adapter; monitor release notes |
| P2 | Native camera text is only partially localized | Open: does not block Russian MVP testing; blocks international rollout |
| P2 | Friend APK contains all ABIs and dev-client dependencies | Accepted for sideloading; Play uses an optimized AAB |

## CV acceptance gates

No release may claim recognition quality until a labelled field dataset passes these gates:

- At least 5 users with different heights/body proportions, 3 Android performance tiers, both
  exercises, front and side mistakes, three lighting conditions, loose and fitted clothing.
- At least 100 valid and 100 invalid repetitions per exercise in aggregate.
- False positive rate on partial/incorrect movements below 2%.
- Valid-repetition recall at or above 95% under the documented setup conditions.
- Zero counted repetitions when no person is present, two people overlap, the head is absent, or
  tracking confidence remains below the threshold.
- Repetition totals differ by no more than one across 15, 30 and 60 FPS replays of the same motion.
- Tracking loss shorter than the grace period preserves a cycle; longer loss cancels the cycle.

## Store submission blockers outside source code

- Google Play developer identity and package ownership.
- Public privacy-policy URL and, if the local profile is presented as an account, a public deletion
  request URL.
- Accessibility declaration, affirmative-disclosure screenshots and reviewer video.
- Data Safety, content rating, target audience, store text, screenshots and feature graphic.
- Private upload keystore supplied through CI secrets and Play App Signing enrollment.
- Closed-track testing and Play pre-launch report on real devices.

The repository can produce a technically hardened release candidate, but these owner-controlled
Play Console and real-device steps cannot be truthfully completed by source-code changes alone.
