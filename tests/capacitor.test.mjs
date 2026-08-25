import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('packages the local web bundle without a remote server URL', async () => {
  const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
  assert.equal(config.appId, 'app.privai.pocket');
  assert.equal(config.appName, 'PrivAI Pocket');
  assert.equal(config.webDir, 'www');
  assert.equal(config.server?.url, undefined);
});

test('keeps the generated Android project at the approved SDK levels', async () => {
  const variables = await readFile(new URL('../android/variables.gradle', import.meta.url), 'utf8');
  const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  const instrumentedTest = await readFile(new URL('../android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java', import.meta.url), 'utf8');
  assert.match(variables, /minSdkVersion\s*=\s*24/);
  assert.match(variables, /compileSdkVersion\s*=\s*36/);
  assert.match(variables, /targetSdkVersion\s*=\s*36/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(instrumentedTest, /assertEquals\("app\.privai\.pocket", appContext\.getPackageName\(\)\)/);
});

test('builds a debug APK in CI without runtime service credentials', async () => {
  const workflow = await readFile(new URL('../.github/workflows/android-debug.yml', import.meta.url), 'utf8');
  assert.match(workflow, /on:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:|\n\s*push:/);
  assert.match(workflow, /runs-on:\s*ubuntu-latest/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /java-version:\s*21/);
  assert.match(workflow, /checkPackageSafety\('www'\)/);
  assert.match(workflow, /cap sync android/);
  assert.match(workflow, /gradlew assembleDebug/);
  assert.match(workflow, /android\/app\/build\/outputs\/apk\/debug\/app-debug\.apk/);
  assert.match(workflow, /retention-days:\s*7/);
  assert.doesNotMatch(workflow, /secrets\./);
});
