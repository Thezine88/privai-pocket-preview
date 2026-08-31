import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, posix, win32 } from 'node:path';
import { buildWeb, isBuildOutputInsideProject } from '../scripts/build-web.mjs';

test('accepts only build outputs inside the project on Windows and POSIX', () => {
  assert.equal(isBuildOutputInsideProject('C:\\project', 'C:\\project\\www', win32), true);
  assert.equal(isBuildOutputInsideProject('C:\\project', 'C:\\project-copy\\www', win32), false);
  assert.equal(isBuildOutputInsideProject('/project', '/project/www', posix), true);
  assert.equal(isBuildOutputInsideProject('/project', '/project-copy/www', posix), false);
});

test('builds only the web application files into the output directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'privai-build-'));
  const output = join(root, 'www');
  await mkdir(join(root, 'src', 'domain'), { recursive: true });
  await mkdir(join(root, 'assets'), { recursive: true });
  await mkdir(join(root, 'vendor'), { recursive: true });
  await mkdir(join(root, 'tests'), { recursive: true });
  for (const file of ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js']) await writeFile(join(root, file), file);
  await writeFile(join(root, 'src', 'domain', 'app.mjs'), 'app');
  await writeFile(join(root, 'assets', 'icon.svg'), '<svg/>');
  await writeFile(join(root, 'vendor', 'pdf.mjs'), 'pdf');
  await writeFile(join(root, 'tests', 'secret.txt'), 'must not ship');

  await buildWeb({ sourceRoot: root, outputRoot: output });

  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), 'index.html');
  assert.equal(await readFile(join(output, 'src', 'domain', 'app.mjs'), 'utf8'), 'app');
  assert.equal(await readFile(join(output, 'vendor', 'pdf.mjs'), 'utf8'), 'pdf');
  await assert.rejects(readFile(join(output, 'tests', 'secret.txt')));
});

test('writes owner build metadata into the web bundle', async () => {
  const root = await mkdtemp(join(tmpdir(), 'restamio-owner-build-'));
  const output = join(root, 'www');
  await mkdir(join(root, 'src'), { recursive: true });
  await mkdir(join(root, 'assets'));
  await mkdir(join(root, 'vendor'));
  for (const file of ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js']) await writeFile(join(root, file), file);

  await buildWeb({ sourceRoot: root, outputRoot: output, channel: 'owner' });

  assert.deepEqual(JSON.parse(await readFile(join(output, 'build-meta.json'), 'utf8')), {
    channel: 'owner',
    entitlement: 'owner',
    billingEnabled: false,
  });
});
