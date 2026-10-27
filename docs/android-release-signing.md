# Android signing and builds

LockFit has two non-debug build targets:

- `pnpm build:friend` creates an autonomous APK for direct installation. It reuses `android/app/debug.keystore` when that local test key exists, otherwise Android's user-level debug key. The file is ignored by Git and must never be uploaded to Google Play.
- `pnpm build:play` creates the production AAB. It refuses to run without a private upload key and enables R8 code shrinking.

## Create the upload key once

Run this outside the repository and keep both the keystore and passwords in a password manager:

```bash
keytool -genkeypair -v \
  -keystore "$HOME/.android/lockfit-upload.jks" \
  -alias lockfit-upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

Back up the keystore in a separate encrypted location. Losing it requires the Google Play upload-key reset process.

## Configure local Gradle secrets

Add these values to `~/.gradle/gradle.properties`, never to the project files:

```properties
LOCKFIT_UPLOAD_STORE_FILE=/absolute/path/to/lockfit-upload.jks
LOCKFIT_UPLOAD_STORE_PASSWORD=replace_me
LOCKFIT_UPLOAD_KEY_ALIAS=lockfit-upload
LOCKFIT_UPLOAD_KEY_PASSWORD=replace_me
```

Then run:

```bash
pnpm verify:all
pnpm build:play
```

The Play artifact is `android/app/build/outputs/bundle/release/app-release.aab`. Before uploading it, complete the Accessibility API declaration, attach a reviewer video, publish the privacy-policy and account-deletion pages on public HTTPS URLs, and finish the physical-device test matrix in `docs/cv-validation-protocol.md`.
