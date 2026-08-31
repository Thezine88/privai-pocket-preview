import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBuildConfig } from '../src/config/build.mjs';

const FILES = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js', 'assets', 'src', 'vendor'];

export function isBuildOutputInsideProject(sourceRoot, outputRoot, pathApi) {
  const relativeOutput = pathApi.relative(pathApi.resolve(sourceRoot), pathApi.resolve(outputRoot));
  return relativeOutput !== ''
    && relativeOutput !== '..'
    && !relativeOutput.startsWith(`..${pathApi.sep}`)
    && !pathApi.isAbsolute(relativeOutput);
}

export async function buildWeb({ sourceRoot, outputRoot, channel = 'production' }) {
  const source = resolve(sourceRoot);
  const output = resolve(outputRoot);
  if (!isBuildOutputInsideProject(source, output, { resolve, relative, isAbsolute, sep })) throw new Error('La cartella di build deve trovarsi dentro il progetto');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of FILES) await cp(resolve(source, name), resolve(output, name), { recursive: true });
  await writeFile(resolve(output, 'build-meta.json'), `${JSON.stringify(readBuildConfig({ channel }), null, 2)}\n`);
}

const invokedPath = process.argv[1] && resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const channelArg = process.argv.find((argument) => argument.startsWith('--channel='));
  await buildWeb({
    sourceRoot,
    outputRoot: resolve(sourceRoot, 'www'),
    channel: channelArg?.slice('--channel='.length) || 'production',
  });
}
