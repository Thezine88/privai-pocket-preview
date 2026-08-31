import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

test('packages the local web bundle without a remote server URL', async () => {
  const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
  assert.equal(config.appId, 'app.restamio.mobile');
  assert.equal(config.appName, 'RestaMio');
  assert.equal(config.webDir, 'www');
  assert.equal(config.server?.url, undefined);
});

test('keeps the generated Android project at the approved SDK levels', async () => {
  const variables = await readFile(new URL('../android/variables.gradle', import.meta.url), 'utf8');
  const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  const appGradle = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
  assert.match(variables, /minSdkVersion\s*=\s*24/);
  assert.match(variables, /compileSdkVersion\s*=\s*36/);
  assert.match(variables, /targetSdkVersion\s*=\s*36/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android\.intent\.action\.SEND/);
  assert.match(manifest, /android:mimeType="application\/pdf"/);
  assert.match(manifest, /android:mimeType="text\/plain"/);
  assert.match(manifest, /android:mimeType="image\/\*"/);
  assert.doesNotMatch(manifest, /READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE/);
  assert.match(appGradle, /applicationId "app\.restamio\.owner"/);
  assert.match(appGradle, /resValue "string", "app_name", "RestaMio Owner"/);
});

test('keeps incoming shares private, bounded and recoverably cleaned up', async () => {
  const plugin = await readFile(new URL('../android/app/src/main/java/app/privai/pocket/RestaMioSharePlugin.java', import.meta.url), 'utf8');
  assert.match(plugin, /MAX_BYTES\s*=\s*20L\s*\*\s*1024L\s*\*\s*1024L/);
  assert.match(plugin, /getCacheDir\(\).*"incoming-share"/s);
  assert.match(plugin, /if \(staged != null && staged\.exists\(\)\) staged\.delete\(\)/);
  assert.match(plugin, /catch \(Exception error\) \{ call\.reject\("Impossibile eliminare il contenuto temporaneo"\); \}/);
  assert.match(plugin, /name == null \? "contenuto-condiviso" : name/);
  assert.match(plugin, /Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.TIRAMISU/);
  assert.match(plugin, /getParcelableExtra\(Intent\.EXTRA_STREAM, Uri\.class\)/);
  assert.match(plugin, /@PluginMethod public void recognize\(PluginCall call\)/);
  assert.match(plugin, /TextRecognition\.getClient\(TextRecognizerOptions\.DEFAULT_OPTIONS\)/);
  const appGradle = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
  assert.match(appGradle, /implementation ['"]com\.google\.mlkit:text-recognition:16\.0\.1['"]/);
  assert.doesNotMatch(plugin, /Log\.|System\.out|printStackTrace/);
});

test('bundles the exact approved RestaMio launcher artwork', async () => {
  const icon = await readFile(new URL('../assets/logoapp.png', import.meta.url));
  assert.equal(createHash('sha256').update(icon).digest('hex'), 'cf6b18e1e5278b17a4fd2a76953bab52e0e9c10187e134458c19d25f9c2fcae2');
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
  assert.match(workflow, /gradlew assembleOwnerDebug/);
  assert.match(workflow, /android\/app\/build\/outputs\/apk\/owner\/debug\/app-owner-debug\.apk/);
  assert.match(workflow, /retention-days:\s*7/);
  assert.doesNotMatch(workflow, /secrets\./);
});
