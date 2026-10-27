import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('native Android project remains versionable', async () => {
  const gitignore = await read('.gitignore');
  assert.equal(gitignore.split(/\r?\n/).includes('/android'), false);
  assert.match(gitignore, /android\/\.gradle/);
});

test('production manifest contract disables backup, cleartext, and broad overlay permission', async () => {
  const [mainManifest, releaseManifest, appConfig] = await Promise.all([
    read('android/app/src/main/AndroidManifest.xml'),
    read('android/app/src/release/AndroidManifest.xml'),
    read('app.json'),
  ]);
  const config = JSON.parse(appConfig);

  assert.match(mainManifest, /android:allowBackup="false"/);
  assert.match(mainManifest, /android:fullBackupContent="false"/);
  assert.match(mainManifest, /android:usesCleartextTraffic="false"/);
  assert.match(mainManifest, /SYSTEM_ALERT_WINDOW" tools:node="remove"/);
  assert.match(releaseManifest, /INTERNET" tools:node="remove"/);
  assert.equal(config.expo.android.allowBackup, false);
  assert.equal(
    config.expo.android.blockedPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW'),
    true,
  );
});

test('friend and Play builds cannot share the debug signing path', async () => {
  const [gradle, friendManifest, appConfig] = await Promise.all([
    read('android/app/build.gradle'),
    read('android/app/src/friend/AndroidManifest.xml'),
    read('app.json'),
  ]);
  const config = JSON.parse(appConfig);

  assert.match(gradle, /releaseStoreFilePath/);
  assert.match(gradle, /if \(hasReleaseSigning\) \{\s*signingConfig signingConfigs\.release/s);
  assert.doesNotMatch(gradle, /release \{[^}]*signingConfig signingConfigs\.debug/s);
  assert.match(gradle, /localFriendStoreFile/);
  assert.match(gradle, /signingConfig signingConfigs\.findByName\('friend'\) \?: signingConfigs\.debug/);
  assert.match(gradle, /gradle\.startParameter\.taskNames/);
  assert.match(gradle, /taskName == 'assembleRelease' \|\| taskName == 'bundleRelease'/);
  assert.match(friendManifest, /INTERNET" tools:node="remove"/);
  assert.equal(config.expo.version, '1.2.0');
  assert.equal(config.expo.android.versionCode, 3);
  assert.match(gradle, /versionCode 3/);
  assert.match(gradle, /versionName "1\.2\.0"/);
});

test('Accessibility service is narrow, private, and cannot retrieve screen content', async () => {
  const [manifest, serviceConfig] = await Promise.all([
    read('modules/lockfit-native/android/src/main/AndroidManifest.xml'),
    read('modules/lockfit-native/android/src/main/res/xml/lockfit_accessibility_service.xml'),
  ]);

  assert.match(manifest, /LockFitAccessibilityService/);
  assert.match(manifest, /android:exported="false"/);
  assert.match(manifest, /android\.permission\.BIND_ACCESSIBILITY_SERVICE/);
  assert.match(serviceConfig, /android:canRetrieveWindowContent="false"/);
  assert.match(serviceConfig, /android:isAccessibilityTool="false"/);
  assert.match(serviceConfig, /typeWindowStateChanged\|typeWindowsChanged/);
});

test('privacy and deletion disclosures cover sensitive local features', async () => {
  const [privacy, deletion] = await Promise.all([
    read('docs/privacy-policy.md'),
    read('docs/account-deletion.md'),
  ]);

  for (const phrase of ['PBKDF2', 'Usage Access', 'Accessibility', 'not saved', 'Delete']) {
    assert.match(privacy, new RegExp(phrase, 'i'));
  }
  assert.match(deletion, /clears native Accessibility blocking rules/i);
  assert.match(deletion, /public deletion page/i);
});
