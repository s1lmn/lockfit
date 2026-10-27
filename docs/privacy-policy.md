# LockFit Privacy Policy

Last updated: July 30, 2026

LockFit is an Android application that helps a user limit selected applications and earn temporary access through physical activity. This policy describes the current local-only MVP.

## Data processed on the device

LockFit stores the email address, nickname, salted password hash, selected application package names, daily limits, usage totals, step totals, workout history, theme, and language in private application storage on the user's Android device.

The camera is processed live on the device by Google ML Kit Pose Detection. LockFit uses body landmarks to assess framing, a random gesture, joint angles, and repetition state. Camera frames and body landmarks are not saved, uploaded, shared, or used for identity recognition.

Android Usage Access is used to calculate time spent in applications selected by the user. The Accessibility service receives the package name of the foreground application so it can show a blocking overlay after the selected limit. It is configured not to retrieve window content and does not read messages, passwords, typed text, taps, or screen contents.

Activity Recognition and the hardware step counter are used to calculate step rewards. LockFit does not request location.

## Sharing and sale

The current MVP has no LockFit server, advertising SDK, analytics SDK, or cloud account. LockFit does not sell personal data and does not transmit the local profile, usage history, camera data, or activity history to the developer or third parties. ML Kit pose inference runs on the device using the bundled model.

## Retention and deletion

Data remains on the device until the user deletes the local account, clears application storage, or uninstalls LockFit. The in-app Account screen includes “Delete account and all data”, which deletes the profile, password hash, application rules, usage totals, bonuses, steps, and workout logs. Android cloud backup and device-transfer backup are disabled for LockFit data.

## Security

Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes, not plaintext. Sensitive camera and blocking windows prevent screenshots. Temporary exercise unlocks are limited to the selected package and current device boot.

## Children and health notice

LockFit is not a medical device and does not provide diagnosis, treatment, or individualized exercise advice. The initial release is not directed to children. Users should stop an exercise if they feel pain or dizziness and follow appropriate professional guidance.

## Contact

Before publication, replace this paragraph with the developer's public support email and legal entity or individual developer name. The same policy must be hosted at a stable public HTTPS URL linked from Google Play and from inside the application.
