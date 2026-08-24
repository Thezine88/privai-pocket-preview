import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildWeb } from '../scripts/build-web.mjs';

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
